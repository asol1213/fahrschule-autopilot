/**
 * Error Monitoring & Logging
 *
 * Zentrales Error-Handling mit Sentry + Console-Fallback.
 */

import * as Sentry from "@sentry/nextjs";

interface ErrorContext {
  component?: string;
  action?: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Error an Monitoring senden
 */
export function captureError(error: Error | unknown, context?: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));

  Sentry.captureException(err, {
    extra: context ? { ...context } as Record<string, unknown> : undefined,
  });

  console.error(`[ERROR] ${context?.component || "unknown"}:`, {
    message: err.message,
    stack: err.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Performance-Metrik tracken
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>): void {
  Sentry.metrics.distribution(name, value, { attributes: tags });

  if (process.env.NODE_ENV === "development") {
    console.log(`[METRIC] ${name}: ${value}`, tags);
  }
}

/**
 * Custom Event tracken (Analytics)
 */
export function trackEvent(name: string, data?: Record<string, unknown>): void {
  Sentry.captureMessage(name, { level: "info", extra: data });

  if (process.env.NODE_ENV === "development") {
    console.log(`[EVENT] ${name}`, data);
  }
}

/**
 * Health Check Endpoint Helper
 */
export async function getHealthStatus(): Promise<{
  status: "ok" | "degraded" | "down";
  checks: Record<string, boolean>;
  timestamp: string;
  version: string;
}> {
  const checks: Record<string, boolean> = {
    api: true,
    env_supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };

  // Real Supabase ping
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("tenants").select("id", { count: "exact", head: true });
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  const failed = Object.values(checks).filter((v) => !v).length;
  const status = failed === 0 ? "ok" : failed <= 1 ? "degraded" : "down";

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  };
}

/**
 * Sentry Setup (für Production):
 *
 * Environment Variables setzen:
 *   - NEXT_PUBLIC_SENTRY_DSN (Client)
 *   - SENTRY_DSN (Server)
 *   - SENTRY_AUTH_TOKEN (Source Maps Upload)
 *   - SENTRY_ORG
 *   - SENTRY_PROJECT
 */
