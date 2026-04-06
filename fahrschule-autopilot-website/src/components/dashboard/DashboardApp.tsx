"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import {
  Users,
  Car,
  CreditCard,
  FileText,
  TrendingUp,
  Plus,
  RefreshCw,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalSchueler: number;
  schuelerNachStatus: Record<string, number>;
  offeneZahlungen: number;
  summeOffen: number;
  heutigeTermine: number;
  bestehensquote: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  angemeldet: { label: "Angemeldet", color: "text-blue-400", bgColor: "bg-blue-500/20", icon: <UserCheck className="h-4 w-4" /> },
  dokumente_ausstehend: { label: "Dokumente ausstehend", color: "text-orange-400", bgColor: "bg-orange-500/20", icon: <FileText className="h-4 w-4" /> },
  theorie: { label: "In Theorie", color: "text-purple-400", bgColor: "bg-purple-500/20", icon: <GraduationCap className="h-4 w-4" /> },
  praxis: { label: "In Praxis", color: "text-cyan-400", bgColor: "bg-cyan-500/20", icon: <Car className="h-4 w-4" /> },
  pruefung: { label: "Prüfung geplant", color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: <Clock className="h-4 w-4" /> },
  bestanden: { label: "Bestanden", color: "text-green-400", bgColor: "bg-green-500/20", icon: <CheckCircle className="h-4 w-4" /> },
  abgebrochen: { label: "Abgebrochen", color: "text-red-400", bgColor: "bg-red-500/20", icon: <AlertCircle className="h-4 w-4" /> },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

export default function DashboardApp() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSchueler, setRecentSchueler] = useState<Array<Record<string, unknown>>>([]);
  const [overduePayments, setOverduePayments] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const tenantId = useTenantId();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const tid = tenantId;

      // Parallel queries
      const [
        { count: totalSchueler },
        { data: schuelerRows },
        { data: zahlungenOffen },
        { data: heutigeRows },
        { data: pruefungenRows },
        { data: recentRows },
        { data: overdueRows },
      ] = await Promise.all([
        supabase.from("schueler").select("*", { count: "exact", head: true }).eq("tenant_id", tid),
        supabase.from("schueler").select("status").eq("tenant_id", tid),
        supabase.from("zahlungen").select("betrag").eq("tenant_id", tid).in("status", ["offen", "ueberfaellig"]),
        supabase.from("fahrstunden").select("id").eq("tenant_id", tid).eq("datum", today),
        supabase.from("pruefungen").select("ergebnis").eq("tenant_id", tid).not("ergebnis", "is", null),
        supabase.from("schueler").select("id, vorname, nachname, status, fuehrerscheinklasse, created_at").eq("tenant_id", tid).order("created_at", { ascending: false }).limit(5),
        supabase.from("zahlungen").select("id, schueler_id, betrag, beschreibung, faellig_am, status, schueler(vorname, nachname)").eq("tenant_id", tid).in("status", ["offen", "ueberfaellig"]).order("faellig_am").limit(5),
      ]);

      // Status counts
      const schuelerNachStatus: Record<string, number> = {};
      (schuelerRows || []).forEach((r) => {
        const s = r.status as string;
        schuelerNachStatus[s] = (schuelerNachStatus[s] || 0) + 1;
      });

      // Bestehensquote
      const allP = pruefungenRows || [];
      const bestanden = allP.filter((p) => p.ergebnis === "bestanden").length;
      const bestehensquote = allP.length > 0 ? Math.round((bestanden / allP.length) * 100) : 0;

      const summeOffen = (zahlungenOffen || []).reduce((sum, r) => sum + Number(r.betrag), 0);

      setStats({
        totalSchueler: totalSchueler || 0,
        schuelerNachStatus,
        offeneZahlungen: (zahlungenOffen || []).length,
        summeOffen,
        heutigeTermine: (heutigeRows || []).length,
        bestehensquote,
      });
      setRecentSchueler(recentRows || []);
      setOverduePayments(overdueRows || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-primary)]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-[var(--c-muted)] py-12">
        <p>Keine Daten verfügbar.</p>
        <p className="text-sm mt-2">Bitte prüfen Sie, ob Ihr Konto einem Tenant zugeordnet ist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Dashboard</h1>
          <p className="text-sm text-[var(--c-muted)]">Übersicht aller wichtigen Kennzahlen</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--c-border)] text-sm text-[var(--c-muted)] hover:text-[var(--c-foreground)] transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Aktualisieren
          </button>
          <Link
            href="/dashboard/schueler?neu=1"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--c-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--c-primary-dark)] transition-colors"
          >
            <Plus size={16} />
            Neuer Schüler
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Users size={20} />}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
          label="Aktive Schüler"
          value={String(stats.totalSchueler)}
        />
        <KPICard
          icon={<CreditCard size={20} />}
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
          label="Offene Zahlungen"
          value={formatCurrency(stats.summeOffen)}
          sub={`${stats.offeneZahlungen} Rechnungen`}
        />
        <KPICard
          icon={<Calendar size={20} />}
          iconBg="bg-cyan-500/20"
          iconColor="text-cyan-400"
          label="Termine heute"
          value={String(stats.heutigeTermine)}
        />
        <KPICard
          icon={<GraduationCap size={20} />}
          iconBg="bg-green-500/20"
          iconColor="text-green-400"
          label="Bestehensquote"
          value={`${stats.bestehensquote}%`}
        />
      </div>

      {/* Status Pipeline */}
      <div className="p-6 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
        <h2 className="text-lg font-semibold text-[var(--c-foreground)] mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Schüler-Pipeline
        </h2>
        <div className="space-y-3">
          {Object.entries(STATUS_LABELS).map(([key, { label, color, icon }]) => {
            const count = stats.schuelerNachStatus[key] || 0;
            const pct = stats.totalSchueler > 0 ? (count / stats.totalSchueler) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={color}>{icon}</span>
                <span className="text-sm flex-1 text-[var(--c-foreground)]">{label}</span>
                <div className="w-40 h-2 rounded-full bg-[var(--c-surface-lighter)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--c-primary)]" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-medium w-8 text-right text-[var(--c-foreground)]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column: Recent + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="p-6 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--c-foreground)]">Letzte Anmeldungen</h2>
            <Link href="/dashboard/schueler" className="text-sm text-[var(--c-primary)] hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-2">
            {recentSchueler.length === 0 ? (
              <p className="text-[var(--c-muted)] text-sm py-4 text-center">Noch keine Schüler vorhanden.</p>
            ) : (
              recentSchueler.map((s) => {
                const st = STATUS_LABELS[s.status as string];
                return (
                  <Link
                    key={s.id as string}
                    href={`/dashboard/schueler/${s.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--c-surface-light)] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--c-foreground)]">
                        {s.vorname as string} {s.nachname as string}
                      </p>
                      <p className="text-xs text-[var(--c-muted)]">Klasse {s.fuehrerscheinklasse as string}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${st?.bgColor || "bg-gray-500/20"} ${st?.color || "text-gray-400"}`}>
                      {st?.label || (s.status as string)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="p-6 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--c-foreground)] flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-400" />
              Offene Zahlungen
            </h2>
            <Link href="/dashboard/zahlungen" className="text-sm text-[var(--c-primary)] hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-2">
            {overduePayments.length === 0 ? (
              <p className="text-[var(--c-muted)] text-sm py-4 text-center">Keine offenen Zahlungen.</p>
            ) : (
              overduePayments.map((z) => {
                const schueler = z.schueler as Record<string, string> | null;
                return (
                  <div key={z.id as string} className="flex items-center justify-between p-3 rounded-lg bg-[var(--c-surface-light)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--c-foreground)]">
                        {schueler?.vorname} {schueler?.nachname}
                      </p>
                      <p className="text-xs text-[var(--c-muted)]">{z.beschreibung as string}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-400">{formatCurrency(Number(z.betrag))}</p>
                      <p className="text-xs text-[var(--c-muted)]">
                        Fällig: {new Date(z.faellig_am as string).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Hidden tenant ID for child components */}
      <input type="hidden" id="tenant-id" value={tenantId} />
    </div>
  );
}

function KPICard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-sm text-[var(--c-muted)]">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--c-foreground)]">{value}</p>
      {sub && <p className="text-xs text-[var(--c-muted)] mt-1">{sub}</p>}
    </div>
  );
}
