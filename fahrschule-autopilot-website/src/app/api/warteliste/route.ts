import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api-auth";

const wartelisteLimiter = rateLimit("warteliste", 3, 60_000);

const REQUIRED_FIELDS = ["vorname", "nachname", "email", "telefon", "fuehrerscheinklasse", "tenantId", "dsgvo"];

/**
 * POST /api/warteliste
 * Öffentlicher Endpoint — fügt eine Person zur Warteliste hinzu.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (wartelisteLimiter(ip)) {
      return NextResponse.json(
        { success: false, message: "Zu viele Anfragen. Bitte warten Sie eine Minute." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter((field) => {
      const value = body[field];
      if (typeof value === "boolean") return !value;
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Pflichtfelder fehlen.", missingFields: missing },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    // DSGVO must be accepted
    if (!body.dsgvo) {
      return NextResponse.json(
        { success: false, message: "DSGVO-Einwilligung ist erforderlich." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert into warteliste_public
    const { data, error } = await supabase.from("warteliste_public").insert({
      tenant_id: body.tenantId,
      vorname: body.vorname.trim(),
      nachname: body.nachname.trim(),
      email: body.email.trim().toLowerCase(),
      telefon: body.telefon.trim(),
      fuehrerscheinklasse: body.fuehrerscheinklasse || "B",
      status: "wartend",
      dsgvo_einwilligung: true,
    }).select("id").single();

    if (error) {
      console.error("[Warteliste] Supabase insert error:", error);
      return NextResponse.json(
        { success: false, message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." },
        { status: 500 }
      );
    }

    // Send webhook to n8n for notification (non-blocking)
    const webhookUrl = process.env.WEBHOOK_WARTELISTE_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data?.id,
            vorname: body.vorname.trim(),
            nachname: body.nachname.trim(),
            email: body.email.trim().toLowerCase(),
            telefon: body.telefon.trim(),
            fuehrerscheinklasse: body.fuehrerscheinklasse,
            tenantId: body.tenantId,
            submittedAt: new Date().toISOString(),
            source: "website-warteliste",
          }),
        });
      } catch (webhookError) {
        console.error("[Warteliste] Webhook delivery failed:", webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sie stehen auf der Warteliste! Wir kontaktieren Sie sobald ein Platz frei wird.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/warteliste?tenantId=xxx
 * Authentifizierter Endpoint — gibt Wartelisten-Zählung pro Tenant zurück.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  // Lazy import to avoid circular deps
  const { requireAuth, isAuthed } = await import("@/lib/api-auth");
  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const supabase = await createClient();

  const { count, error } = await supabase
    .from("warteliste_public")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "wartend");

  if (error) {
    return NextResponse.json({ error: "Fehler beim Laden der Warteliste" }, { status: 500 });
  }

  // Also get breakdown by status
  const { data: statusCounts } = await supabase
    .from("warteliste_public")
    .select("status")
    .eq("tenant_id", tenantId);

  const breakdown: Record<string, number> = {};
  for (const entry of statusCounts || []) {
    const s = entry.status as string;
    breakdown[s] = (breakdown[s] || 0) + 1;
  }

  return NextResponse.json({
    wartend: count || 0,
    breakdown,
  });
}
