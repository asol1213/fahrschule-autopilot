import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the active tenant ID for the current user.
 * Checks the active_tenant_id cookie, falls back to first tenant.
 */
export async function getActiveTenantId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // Try reading cookie (works when httpOnly: false)
  const activeCookie = typeof document !== "undefined"
    ? document.cookie.split("; ").find(c => c.startsWith("active_tenant_id="))?.split("=")[1]
    : undefined;

  if (activeCookie) {
    // Verify user has access
    const { data } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", userId)
      .eq("tenant_id", activeCookie)
      .single();
    if (data) return data.tenant_id;
  }

  // Fallback: first tenant
  const { data: fallback } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return fallback?.tenant_id || null;
}
