"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Users,
  Calendar,
  CreditCard,
  FileText,
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  BarChart3,
  FileBarChart,
  Phone,
  LogOut,
  TrendingUp,
  Lock,
  ChevronDown,
  Building2,
  Car,
  FileSignature,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PlanTier } from "@/lib/tenant";
import { PLAN_FEATURES } from "@/lib/tenant";

const navItems = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard, feature: null },
  { href: "/dashboard/schueler", label: "Schüler", icon: Users, feature: null },
  { href: "/dashboard/kalender", label: "Kalender", icon: Calendar, feature: null },
  { href: "/dashboard/zahlungen", label: "Zahlungen", icon: CreditCard, feature: "zahlungen" },
  { href: "/dashboard/dokumente", label: "Dokumente", icon: FileText, feature: null },
  { href: "/dashboard/pruefungen", label: "Prüfungen", icon: GraduationCap, feature: null },
  { href: "/dashboard/fahrzeuge", label: "Fahrzeuge", icon: Car, feature: "crm" },
  { href: "/dashboard/vertraege", label: "Verträge", icon: FileSignature, feature: "crm" },
  { href: "/dashboard/telefon", label: "AI Telefon", icon: Phone, feature: "telefon" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, feature: null },
  { href: "/dashboard/roi", label: "ROI Report", icon: TrendingUp, feature: "reporting" },
  { href: "/dashboard/reporting", label: "Reports", icon: FileBarChart, feature: "reporting" },
];

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter · €99/Mo",
  pro: "Pro · €249/Mo",
  premium: "Premium · €499/Mo",
};

interface SidebarProps {
  fahrschulName: string;
  plan?: PlanTier;
  activeTenantId: string;
  allTenants: { id: string; slug: string; name: string; plan: string }[];
}

export default function Sidebar({ fahrschulName, plan = "premium", activeTenantId, allTenants }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const features = PLAN_FEATURES[plan];
  const [showSwitcher, setShowSwitcher] = useState(false);

  const [pendingTenant, setPendingTenant] = useState<string | null>(null);

  // Effect-based cookie write to satisfy React immutability rules
  React.useEffect(() => {
    if (!pendingTenant) return;
    document.cookie = `active_tenant_id=${pendingTenant}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.assign("/dashboard");
  }, [pendingTenant]);

  function switchTenant(tid: string) {
    if (tid === activeTenantId) { setShowSwitcher(false); return; }
    setPendingTenant(tid);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const hasMultipleTenants = allTenants.length > 1;

  return (
    <aside className="w-64 min-h-screen bg-[var(--c-surface)] border-r border-[var(--c-border)] flex flex-col">
      {/* Tenant Header / Switcher */}
      <div className="p-6 border-b border-[var(--c-border)] relative">
        <button
          onClick={() => hasMultipleTenants && setShowSwitcher(!showSwitcher)}
          className={`w-full text-left ${hasMultipleTenants ? "cursor-pointer hover:opacity-80" : "cursor-default"} transition-opacity`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--c-foreground)] truncate">
                {fahrschulName}
              </h2>
              <p className="text-xs text-[var(--c-muted)] mt-1">
                {PLAN_LABELS[plan] || "CRM Dashboard"}
              </p>
            </div>
            {hasMultipleTenants && (
              <ChevronDown size={16} className={`text-[var(--c-muted)] shrink-0 ml-2 transition-transform ${showSwitcher ? "rotate-180" : ""}`} />
            )}
          </div>
        </button>

        {/* Dropdown */}
        {showSwitcher && (
          <div className="absolute left-4 right-4 top-full mt-1 z-50 bg-[var(--c-surface-light)] border border-[var(--c-border)] rounded-xl shadow-xl overflow-hidden">
            {allTenants.map((t) => (
              <button
                key={t.id}
                onClick={(e) => { e.stopPropagation(); switchTenant(t.id); }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors ${
                  t.id === activeTenantId
                    ? "bg-[var(--c-primary)]/10 text-[var(--c-primary)]"
                    : "text-[var(--c-foreground)] hover:bg-[var(--c-surface)]"
                }`}
              >
                <Building2 size={16} className="shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.name}</div>
                  <div className="text-xs text-[var(--c-muted)]">{PLAN_LABELS[t.plan] || t.plan}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const locked = item.feature !== null && !features[item.feature];

          if (locked) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--c-muted)] opacity-40 cursor-not-allowed"
                title={`Verfügbar im ${item.feature === "telefon" ? "Premium" : "Pro"}-Plan`}
              >
                <Icon size={18} />
                {item.label}
                <Lock size={14} className="ml-auto" />
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--c-primary)] text-white"
                  : "text-[var(--c-muted)] hover:text-[var(--c-foreground)] hover:bg-[var(--c-surface-light)]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--c-border)] space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--c-muted)] hover:text-red-500 hover:bg-[var(--c-surface-light)] transition-colors w-full"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
