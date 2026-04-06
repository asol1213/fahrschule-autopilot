"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTenantId } from "@/components/dashboard/TenantContext";
import {
  Users,
  Car,
  CreditCard,
  Trophy,
  TrendingUp,
  Bell,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Zap,
} from "lucide-react";

interface ReportData {
  tenantName?: string;
  generatedAt: string;
  schueler: {
    total: number;
    nachStatus: Record<string, number>;
    neueAnmeldungenDiesenMonat: number;
  };
  fahrstunden: {
    total: number;
    geplant: number;
    abgeschlossen: number;
    abgesagt: number;
    noShows: number;
    noShowRate: number;
    durchschnittsBewertung: number;
  };
  zahlungen: {
    summeGesamt: number;
    summeBezahlt: number;
    summeOffen: number;
    summeUeberfaellig: number;
    anzahlOffen: number;
    anzahlUeberfaellig: number;
  };
  pruefungen: {
    total: number;
    bestanden: number;
    nichtBestanden: number;
    bestehensquote: number;
  };
  automationen: {
    erinnerungenGesendet: number;
    bewertungenAngefragt: number;
    zahlungserinnerungenGesendet: number;
    zeitGespart: number;
  };
}

export default function ReportingDashboard() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const tenantId = useTenantId();
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reporting?tenantId=${tenantId}`);
      const report = await res.json();
      if (report.error) { setError(report.error); }
      else { setData(report); }
    } catch (err) {
      console.error("Failed to load report:", err);
      setError("Report konnte nicht geladen werden");
    }
    setLoading(false);
  }, [tenantId]);

  const loadReportRef = useRef(loadReport);
  useEffect(() => { loadReportRef.current = loadReport; }, [loadReport]);

  useEffect(() => {
    loadReportRef.current();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-foreground font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Reporting Dashboard</h1>
            <p className="text-sm text-muted">
              {data.tenantName || "Fahrschule"} — Stand: {new Date(data.generatedAt).toLocaleDateString("de-DE")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadReport}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Aktualisieren
            </button>
            <button
              onClick={() => window.open(`/api/export?tenantId=${tenantId}&format=csv&type=report`, "_blank")}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => window.open(`/api/export/pdf?tenantId=${tenantId}`, "_blank")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              <Download className="h-4 w-4" />
              PDF Report
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-8">
        {/* Automations-Highlight */}
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-accent">Autopilot Automationen diesen Monat</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AutomationCard icon={<Bell />} value={data.automationen.erinnerungenGesendet} label="Erinnerungen gesendet" />
            <AutomationCard icon={<Star />} value={data.automationen.bewertungenAngefragt} label="Bewertungen angefragt" />
            <AutomationCard icon={<CreditCard />} value={data.automationen.zahlungserinnerungenGesendet} label="Zahlungserinnerungen" />
            <AutomationCard icon={<Clock />} value={`${data.automationen.zeitGespart}h`} label="Zeit gespart" />
          </div>
        </section>

        {/* KPI Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<Users className="h-5 w-5" />}
            title="Schüler"
            value={data.schueler.total}
            subtitle={`${data.schueler.neueAnmeldungenDiesenMonat} neue diesen Monat`}
            color="text-blue-400"
          />
          <KPICard
            icon={<Car className="h-5 w-5" />}
            title="Fahrstunden"
            value={data.fahrstunden.total}
            subtitle={`${data.fahrstunden.noShowRate}% No-Show Rate`}
            color="text-cyan-400"
            alert={data.fahrstunden.noShowRate > 15}
          />
          <KPICard
            icon={<Trophy className="h-5 w-5" />}
            title="Bestehensquote"
            value={`${data.pruefungen.bestehensquote}%`}
            subtitle={`${data.pruefungen.bestanden}/${data.pruefungen.total} bestanden`}
            color="text-green-400"
          />
          <KPICard
            icon={<CreditCard className="h-5 w-5" />}
            title="Umsatz"
            value={`€${data.zahlungen.summeBezahlt.toLocaleString("de-DE")}`}
            subtitle={`€${data.zahlungen.summeOffen.toLocaleString("de-DE")} offen`}
            color="text-orange-400"
            alert={data.zahlungen.summeUeberfaellig > 0}
          />
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Schüler-Pipeline */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Schüler-Pipeline
            </h3>
            <div className="space-y-3">
              {[
                { key: "angemeldet", label: "Angemeldet", color: "bg-blue-500" },
                { key: "dokumente_ausstehend", label: "Dokumente ausstehend", color: "bg-orange-500" },
                { key: "theorie", label: "In Theorie", color: "bg-purple-500" },
                { key: "praxis", label: "In Praxis", color: "bg-cyan-500" },
                { key: "pruefung", label: "Prüfung geplant", color: "bg-yellow-500" },
                { key: "bestanden", label: "Bestanden", color: "bg-green-500" },
              ].map(({ key, label, color }) => {
                const count = data.schueler.nachStatus[key] || 0;
                const pct = data.schueler.total > 0 ? (count / data.schueler.total) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm flex-1 text-muted">{label}</span>
                    <div className="w-32 h-2 rounded-full bg-surface-lighter overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finanz-Übersicht */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Finanzen
            </h3>
            <div className="space-y-4">
              <FinanceRow label="Gesamt-Umsatz" value={data.zahlungen.summeGesamt} />
              <FinanceRow label="Bezahlt" value={data.zahlungen.summeBezahlt} color="text-green-400" />
              <FinanceRow label="Offen" value={data.zahlungen.summeOffen} count={data.zahlungen.anzahlOffen} />
              {data.zahlungen.summeUeberfaellig > 0 && (
                <FinanceRow label="Überfällig" value={data.zahlungen.summeUeberfaellig} color="text-red-400" count={data.zahlungen.anzahlUeberfaellig} alert />
              )}
            </div>
          </div>
        </div>

        {/* Fahrstunden Details */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Fahrstunden-Übersicht
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MiniStat label="Gesamt" value={data.fahrstunden.total} />
            <MiniStat label="Geplant" value={data.fahrstunden.geplant} />
            <MiniStat label="Abgeschlossen" value={data.fahrstunden.abgeschlossen} />
            <MiniStat label="No-Shows" value={data.fahrstunden.noShows} alert={data.fahrstunden.noShows > 0} />
            <MiniStat label="Bewertung" value={data.fahrstunden.durchschnittsBewertung > 0 ? `${data.fahrstunden.durchschnittsBewertung}/5` : "—"} />
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({ icon, title, value, subtitle, color, alert }: {
  icon: React.ReactNode; title: string; value: string | number; subtitle: string; color: string; alert?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-surface p-5 ${alert ? "border-red-500/30" : "border-border"}`}>
      <div className={`mb-3 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted mt-1">{title}</p>
      <p className="text-xs text-muted mt-1 flex items-center gap-1">
        {alert && <AlertTriangle className="h-3 w-3 text-red-400" />}
        {subtitle}
      </p>
    </div>
  );
}

function AutomationCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-accent">{icon}</div>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

function FinanceRow({ label, value, color, count, alert }: {
  label: string; value: number; color?: string; count?: number; alert?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted flex items-center gap-1.5">
        {alert && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
        {!alert && value > 0 && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
        {label}
        {count !== undefined && <span className="text-xs">({count})</span>}
      </span>
      <span className={`text-sm font-semibold ${color || "text-foreground"}`}>
        €{value.toLocaleString("de-DE")}
      </span>
    </div>
  );
}

function MiniStat({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="text-center p-3 rounded-lg bg-surface-light">
      <p className={`text-xl font-bold ${alert ? "text-red-400" : ""}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
