import Sidebar from "@/components/dashboard/Sidebar";
import { ToastProvider } from "@/components/dashboard/Toast";
import { TenantProvider } from "@/components/dashboard/TenantContext";
import { getCurrentTenant } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantInfo = await getCurrentTenant();

  if (!tenantInfo) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--c-background)]">
      <Sidebar
        fahrschulName={tenantInfo.tenant?.name || "Fahrschule"}
        plan={(tenantInfo.tenant?.plan as "starter" | "pro" | "premium") || "premium"}
        activeTenantId={tenantInfo.tenantId}
        allTenants={tenantInfo.allTenants || []}
      />
      <main className="flex-1 p-8 overflow-auto">
        <TenantProvider tenantId={tenantInfo.tenantId}>
          <ToastProvider>{children}</ToastProvider>
        </TenantProvider>
      </main>
    </div>
  );
}
