import { createClient } from "./server";

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentStudent() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: student } = await supabase
      .from("students")
      .select("id, tenant_id, name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student) return null;

    return {
      userId: user.id,
      email: user.email,
      studentId: student.id as string,
      tenantId: student.tenant_id as string,
      name: student.name as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentTenant() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get all tenants for this user
    const { data: tenantUsers } = await supabase
      .from("tenant_users")
      .select("tenant_id, role, tenants(id, slug, name, plan)")
      .eq("user_id", user.id);

    if (!tenantUsers?.length) return null;

    // Check for active tenant cookie
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const activeTenantId = cookieStore.get("active_tenant_id")?.value;

    // Find active tenant or default to first
    let tenantUser = tenantUsers[0];
    if (activeTenantId) {
      const found = tenantUsers.find((tu) => tu.tenant_id === activeTenantId);
      if (found) tenantUser = found;
    }

    const allTenants = tenantUsers.map((tu) => {
      const t = Array.isArray(tu.tenants) ? tu.tenants[0] : tu.tenants;
      return t as { id: string; slug: string; name: string; plan: string };
    });

    return {
      userId: user.id,
      email: user.email,
      tenantId: tenantUser.tenant_id as string,
      role: tenantUser.role as string,
      tenant: (Array.isArray(tenantUser.tenants) ? tenantUser.tenants[0] : tenantUser.tenants) as { id: string; slug: string; name: string; plan: string },
      allTenants,
    };
  } catch {
    return null;
  }
}
