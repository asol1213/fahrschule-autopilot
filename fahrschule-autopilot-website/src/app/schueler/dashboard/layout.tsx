"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, GraduationCap } from "lucide-react";

export default function SchuelerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/schueler/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--c-background)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--c-border)] bg-[var(--c-surface)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--c-primary)]/10">
              <GraduationCap className="h-5 w-5 text-[var(--c-primary)]" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[var(--c-foreground)]">
                Fahrschule Autopilot
              </span>
              <span className="hidden sm:inline text-sm text-[var(--c-muted)]">
                {" "}&mdash; Sch&uuml;ler-Portal
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--c-muted)] hover:bg-[var(--c-surface-light)] hover:text-[var(--c-foreground)] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
