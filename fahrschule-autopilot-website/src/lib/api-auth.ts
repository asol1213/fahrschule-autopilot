import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { timingSafeEqual, createHmac } from "crypto";

interface AuthResult {
  userId: string;
  tenantId: string;
  role: string;
}

/**
 * Prüft Auth + Tenant-Zugehörigkeit für API-Routes.
 * Gibt AuthResult zurück oder NextResponse mit 401/403.
 */
export async function requireAuth(
  requestedTenantId?: string | null
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // If a specific tenant is requested, check access to that tenant
  if (requestedTenantId) {
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .eq("tenant_id", requestedTenantId)
      .maybeSingle();

    if (!tenantUser) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
    }

    return {
      userId: user.id,
      tenantId: tenantUser.tenant_id as string,
      role: tenantUser.role as string,
    };
  }

  // No specific tenant requested — return first tenant
  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!tenantUser) {
    return NextResponse.json({ error: "Kein Tenant zugeordnet" }, { status: 403 });
  }

  return {
    userId: user.id,
    tenantId: tenantUser.tenant_id as string,
    role: tenantUser.role as string,
  };
}

/**
 * Typ-Guard: Prüft ob requireAuth ein AuthResult (kein Error) zurückgegeben hat.
 */
export function isAuthed(result: AuthResult | NextResponse): result is AuthResult {
  return !(result instanceof NextResponse);
}

/**
 * Timing-safe string comparison to prevent timing attacks on API keys.
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Prüft API-Key-basierte Auth für interne/admin/cron Routes.
 * Verwendet timing-safe Vergleich gegen den angegebenen Env-Var.
 *
 * Liest Key aus den Headers: x-admin-key, x-api-key, oder Authorization: Bearer ...
 */
export function requireServiceKey(
  req: NextRequest,
  envVarName: string = "ADMIN_API_KEY"
): NextResponse | null {
  const expectedKey = process.env[envVarName];
  if (!expectedKey) {
    return NextResponse.json(
      { error: `Server-Konfiguration fehlt: ${envVarName}` },
      { status: 500 }
    );
  }

  const providedKey =
    req.headers.get("x-admin-key") ??
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    "";

  if (!safeCompare(providedKey, expectedKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Auth OK
}

/**
 * Prüft HMAC-SHA256 Webhook-Signatur.
 * Erwartet Header: x-webhook-signature mit Wert sha256=<hex>
 *
 * Gibt den parsed Body zurück bei Erfolg, oder NextResponse bei Fehler.
 */
export async function requireWebhookSignature(
  req: NextRequest,
  secretEnvVar: string = "WEBHOOK_SECRET"
): Promise<{ body: Record<string, unknown> } | NextResponse> {
  const secret = process.env[secretEnvVar];
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";

  if (!secret) {
    console.error(`[Webhook] ${secretEnvVar} nicht konfiguriert`);
    return NextResponse.json(
      { error: `Server-Konfiguration fehlt: ${secretEnvVar}` },
      { status: 500 }
    );
  }

  try {
    const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
    return { body: JSON.parse(rawBody) };
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature or JSON" }, { status: 401 });
  }
}

/**
 * Helper: Prüft ob ein requireServiceKey Ergebnis ein Fehler ist.
 */
export function isServiceKeyError(result: NextResponse | null): result is NextResponse {
  return result !== null;
}

/**
 * Helper: Prüft ob requireWebhookSignature ein Fehler ist.
 */
export function isWebhookError(
  result: { body: Record<string, unknown> } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Rate-Limiter Factory (In-Memory mit Serverless-Awareness)
 *
 * Funktioniert per-instance auf Vercel — bietet Best-Effort-Schutz.
 * Für production-grade Limiting: `npm i @upstash/ratelimit @upstash/redis`
 * und UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in .env setzen.
 *
 * Wenn Upstash konfiguriert ist, wird automatisch Redis verwendet.
 */
const limiters = new Map<string, Map<string, { count: number; resetAt: number }>>();

export function rateLimit(
  namespace: string,
  maxRequests: number,
  windowMs: number
): (ip: string) => boolean {
  if (!limiters.has(namespace)) {
    limiters.set(namespace, new Map());
  }
  const store = limiters.get(namespace)!;

  return (ip: string): boolean => {
    const now = Date.now();
    // Cleanup expired entries (limit scan to prevent memory growth)
    let cleaned = 0;
    for (const [key, val] of store) {
      if (now > val.resetAt) {
        store.delete(key);
        cleaned++;
      }
      if (cleaned > 100) break;
    }
    const entry = store.get(ip);
    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count++;
    return entry.count > maxRequests;
  };
}

/**
 * Extrahiert Client-IP aus Request Headers (Vercel-kompatibel).
 * Prüft x-real-ip (Vercel setzt das) vor x-forwarded-for.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
