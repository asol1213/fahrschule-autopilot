"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { useRealtimeSubscription } from "@/lib/supabase/realtime";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  BarChart3,
  Calendar,
  Phone,
  BookOpen,
  MousePointerClick,
} from "lucide-react";

interface AnalyticsData {
  umsatzProMonat: Array<{ monat: string; label: string; betrag: number }>;
  anmeldungenProMonat: Array<{ monat: string; label: string; count: number }>;
  noShowsProWoche: Array<{ woche: string; label: string; rate: number; count: number; total: number }>;
  fahrstundenProWoche: Array<{ woche: string; label: string; geplant: number; abgeschlossen: number; noShow: number; abgesagt: number }>;
  pruefungenProMonat: Array<{ monat: string; label: string; bestanden: number; nichtBestanden: number }>;
  pruefungsSummary: { theorieBestanden: number; theorieNicht: number; praxisBestanden: number; praxisNicht: number };
  schuelerPipeline: Array<{ status: string; label: string; count: number; color: string }>;
  anomalies: Array<{ type: "warning" | "danger" | "info"; title: string; message: string; metric?: string }>;
}

interface KpiData {
  durchlaufzeit: { avg: number | null; min: number | null; max: number | null; anzahl: number };
  dokumenteVollstaendig: { rate: number; complete: number; total: number };
  tageBisDokKomplett: { avg: number | null; anzahl: number };
  abbruch: { rate: number; count: number; total: number };
  dokumenteProTyp: Array<{ typ: string; label: string; vorhanden: number; fehlend: number; rate: number }>;
  statusVerteilung: Array<{ status: string; label: string; count: number }>;
  schuelerDokStatus: Array<{ id: string; name: string; total: number; vorhanden: number; complete: boolean }>;
}

interface TelefonData {
  monat: number;
  avgDauerSekunden: number;
  konversionsrate: number;
  newLeads: number;
  anrufVolumen: Array<{ tag: string; label: string; count: number }>;
  topIntents: Array<{ intent: string; label: string; count: number }>;
  sentimentVerteilung: Record<string, number>;
  letzteAnrufe: Array<{ id: string; datum: string; anrufer: string; dauer: number; intent: string; sentiment: string; zusammenfassung: string; isNewLead: boolean }>;
}

interface TheorieData {
  monat: { aktiveNutzer: number; fragenBeantwortet: number; richtigRate: number; quizzesAbgeschlossen: number; aiTutorNutzung: number };
  woche: { aktiveNutzer: number; fragenBeantwortet: number; richtigRate: number };
  kategorieStats: Array<{ name: string; total: number; richtig: number; rate: number }>;
  aktivitaetProTag: Array<{ tag: string; label: string; count: number }>;
}

type TabKey = "overview" | "kpis" | "telefon" | "theorie";

const PIE_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f97316"];

export default function AnalyticsDashboard() {
  const tenantId = useTenantId();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [telefonData, setTelefonData] = useState<TelefonData | null>(null);
  const [theorieData, setTheorieData] = useState<TheorieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6m");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Realtime subscription
  const isLive = useRealtimeSubscription(
    ["schueler", "zahlungen", "fahrstunden", "pruefungen"],
    tenantId,
    () => loadData(),
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, kpiRes, telefonRes, theorieRes] = await Promise.all([
        fetch(`/api/analytics?tenantId=${tenantId}&range=${range}`),
        fetch(`/api/analytics/kpis?tenantId=${tenantId}`).catch(() => null),
        fetch(`/api/analytics/telefon?tenantId=${tenantId}`).catch(() => null),
        fetch(`/api/analytics/theorie?tenantId=${tenantId}`).catch(() => null),
      ]);
      const json = await analyticsRes.json();
      setData(json);
      setLastUpdated(new Date());
      if (kpiRes?.ok) setKpiData(await kpiRes.json());
      if (telefonRes?.ok) setTelefonData(await telefonRes.json());
      if (theorieRes?.ok) setTheorieData(await theorieRes.json());
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh alle 30 Sekunden
  useEffect(() => {
    intervalRef.current = setInterval(() => loadData(), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-[var(--c-primary)] animate-spin" />
      </div>
    );
  }

  const handleExport = (type: string) => {
    if (!tenantId) return;
    if (type === "pdf") {
      window.open(`/api/export/pdf?tenantId=${tenantId}`, "_blank");
    } else {
      window.open(`/api/export?tenantId=${tenantId}&format=csv&type=${type}`, "_blank");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-foreground)] flex items-center gap-2">
            <BarChart3 size={24} />
            Analytics
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--c-muted)]">Trends, Entwicklungen und Anomalien auf einen Blick</p>
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-[var(--c-muted)]">
                Aktualisiert {lastUpdated.toLocaleTimeString("de-DE")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {/* Range Selector */}
          <div className="flex rounded-lg border border-[var(--c-border)] overflow-hidden">
            {["3m", "6m", "12m"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  range === r
                    ? "bg-[var(--c-primary)] text-white"
                    : "text-[var(--c-muted)] hover:text-[var(--c-foreground)]"
                }`}
              >
                {r === "3m" ? "3 Mon." : r === "6m" ? "6 Mon." : "12 Mon."}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--c-border)] text-sm text-[var(--c-muted)] hover:text-[var(--c-foreground)] transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--c-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--c-primary-dark)] transition-colors">
              <Download size={16} />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-[var(--c-surface)] border border-[var(--c-border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[180px]">
              {[
                { type: "pdf", label: "Monatsreport (PDF)" },
                { type: "report", label: "Monatsreport (CSV)" },
                { type: "schueler", label: "Schüler-Liste" },
                { type: "zahlungen", label: "Zahlungen" },
                { type: "fahrstunden", label: "Fahrstunden" },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleExport(item.type)}
                  className="block w-full text-left px-4 py-2 text-sm text-[var(--c-foreground)] hover:bg-[var(--c-surface-light)] transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {item.label} (CSV)
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-[var(--c-border)] p-1 w-fit">
        {([
          { key: "overview" as TabKey, label: "Übersicht", icon: <BarChart3 size={16} /> },
          { key: "kpis" as TabKey, label: "KPIs", icon: <TrendingUp size={16} /> },
          { key: "telefon" as TabKey, label: "AI Telefon", icon: <Phone size={16} /> },
          { key: "theorie" as TabKey, label: "Theorie-Trainer", icon: <BookOpen size={16} /> },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--c-primary)] text-white"
                : "text-[var(--c-muted)] hover:text-[var(--c-foreground)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* === KPIs TAB === */}
      {activeTab === "kpis" && (
        <KpisTab data={kpiData} />
      )}

      {/* === TELEFON TAB === */}
      {activeTab === "telefon" && (
        <TelefonTab data={telefonData} />
      )}

      {/* === THEORIE TAB === */}
      {activeTab === "theorie" && (
        <TheorieTab data={theorieData} />
      )}

      {/* === OVERVIEW TAB === */}
      {activeTab !== "overview" ? null : (
      <>
      {/* Anomalien / Alerts */}
      {data.anomalies.length > 0 && (
        <div className="space-y-3">
          {data.anomalies.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                a.type === "danger"
                  ? "border-red-500/30 bg-red-500/5"
                  : a.type === "warning"
                  ? "border-orange-500/30 bg-orange-500/5"
                  : "border-blue-500/30 bg-blue-500/5"
              }`}
            >
              {a.type === "danger" && <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />}
              {a.type === "warning" && <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />}
              {a.type === "info" && <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--c-foreground)]">{a.title}</p>
                <p className="text-sm text-[var(--c-muted)] mt-0.5">{a.message}</p>
              </div>
              {a.metric && (
                <span className={`text-lg font-bold ${
                  a.type === "danger" ? "text-red-400" : a.type === "warning" ? "text-orange-400" : "text-blue-400"
                }`}>
                  {a.metric}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Row 1: Umsatz + Anmeldungen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Umsatz-Verlauf" icon={<TrendingUp size={18} />}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.umsatzProMonat}>
              <defs>
                <linearGradient id="umsatzGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={12} />
              <YAxis stroke="var(--c-muted)" fontSize={12} tickFormatter={(v) => `€${v}`} />
              <Tooltip
                contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--c-foreground)" }}
                formatter={(value) => [`€${Number(value).toLocaleString("de-DE")}`, "Umsatz"]}
              />
              <Area type="monotone" dataKey="betrag" stroke="#3b82f6" fill="url(#umsatzGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Neue Anmeldungen" icon={<Users size={18} />}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.anmeldungenProMonat}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={12} />
              <YAxis stroke="var(--c-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--c-foreground)" }}
                formatter={(value) => [Number(value), "Anmeldungen"]}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: No-Shows + Fahrstunden */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="No-Show-Rate (Wochen)" icon={<AlertTriangle size={18} />}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.noShowsProWoche}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={12} />
              <YAxis stroke="var(--c-muted)" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--c-foreground)" }}
                formatter={(value, name) => [
                  name === "rate" ? `${Number(value)}%` : Number(value),
                  name === "rate" ? "No-Show Rate" : "Anzahl",
                ]}
              />
              <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fahrstunden pro Woche" icon={<Calendar size={18} />}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.fahrstundenProWoche}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={12} />
              <YAxis stroke="var(--c-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--c-foreground)" }}
              />
              <Legend />
              <Bar dataKey="abgeschlossen" name="Abgeschlossen" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="geplant" name="Geplant" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="noShow" name="No-Show" fill="#ef4444" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="abgesagt" name="Abgesagt" fill="#6b7280" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Prüfungen + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Bestehensquote" icon={<TrendingUp size={18} />}>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={240}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Theorie bestanden", value: data.pruefungsSummary.theorieBestanden },
                    { name: "Theorie nicht best.", value: data.pruefungsSummary.theorieNicht },
                    { name: "Praxis bestanden", value: data.pruefungsSummary.praxisBestanden },
                    { name: "Praxis nicht best.", value: data.pruefungsSummary.praxisNicht },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  {PIE_COLORS.map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm">
              {[
                { label: "Theorie best.", color: "#22c55e", val: data.pruefungsSummary.theorieBestanden },
                { label: "Theorie n.b.", color: "#ef4444", val: data.pruefungsSummary.theorieNicht },
                { label: "Praxis best.", color: "#3b82f6", val: data.pruefungsSummary.praxisBestanden },
                { label: "Praxis n.b.", color: "#f97316", val: data.pruefungsSummary.praxisNicht },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--c-muted)]">{item.label}</span>
                  <span className="font-semibold text-[var(--c-foreground)]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Schüler-Pipeline" icon={<Users size={18} />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.schuelerPipeline} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--c-muted)" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="var(--c-muted)" fontSize={12} width={90} />
              <Tooltip
                contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--c-foreground)" }}
                formatter={(value) => [Number(value), "Schüler"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.schuelerPipeline.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 4: Prüfungen Trend */}
      <ChartCard title="Prüfungen pro Monat" icon={<TrendingUp size={18} />}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.pruefungenProMonat}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={12} />
            <YAxis stroke="var(--c-muted)" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
              labelStyle={{ color: "var(--c-foreground)" }}
            />
            <Legend />
            <Bar dataKey="bestanden" name="Bestanden" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="nichtBestanden" name="Nicht bestanden" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      </>
      )}
    </div>
  );
}

/* ================================================================
   KPIs TAB
   ================================================================ */
function KpisTab({ data }: { data: KpiData | null }) {
  if (!data) return <p className="text-[var(--c-muted)] text-center py-8">Keine KPI-Daten verfügbar.</p>;

  const STATUS_COLORS: Record<string, string> = {
    angemeldet: "#3b82f6",
    dokumente_ausstehend: "#f97316",
    theorie: "#a855f7",
    praxis: "#06b6d4",
    pruefung: "#eab308",
    bestanden: "#22c55e",
    abgebrochen: "#ef4444",
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className="text-2xl font-bold text-blue-400">
            {data.durchlaufzeit.avg != null ? `${data.durchlaufzeit.avg} Tage` : "–"}
          </p>
          <p className="text-xs text-[var(--c-muted)] mt-1">Ø Durchlaufzeit (Anmeldung → Bestanden)</p>
          {data.durchlaufzeit.min != null && (
            <p className="text-[10px] text-[var(--c-muted)] mt-1">
              Min: {data.durchlaufzeit.min}d / Max: {data.durchlaufzeit.max}d ({data.durchlaufzeit.anzahl} Schüler)
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className={`text-2xl font-bold ${data.dokumenteVollstaendig.rate >= 80 ? "text-green-400" : data.dokumenteVollstaendig.rate >= 50 ? "text-orange-400" : "text-red-400"}`}>
            {data.dokumenteVollstaendig.rate}%
          </p>
          <p className="text-xs text-[var(--c-muted)] mt-1">Dokumenten-Vollständigkeit</p>
          <p className="text-[10px] text-[var(--c-muted)] mt-1">
            {data.dokumenteVollstaendig.complete} / {data.dokumenteVollstaendig.total} Schüler komplett
          </p>
        </div>
        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className="text-2xl font-bold text-cyan-400">
            {data.tageBisDokKomplett.avg != null ? `${data.tageBisDokKomplett.avg} Tage` : "–"}
          </p>
          <p className="text-xs text-[var(--c-muted)] mt-1">Ø Tage bis Dokumente komplett</p>
          <p className="text-[10px] text-[var(--c-muted)] mt-1">
            Basierend auf {data.tageBisDokKomplett.anzahl} Schüler
          </p>
        </div>
        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className={`text-2xl font-bold ${data.abbruch.rate <= 10 ? "text-green-400" : data.abbruch.rate <= 25 ? "text-orange-400" : "text-red-400"}`}>
            {data.abbruch.rate}%
          </p>
          <p className="text-xs text-[var(--c-muted)] mt-1">Abbruchrate</p>
          <p className="text-[10px] text-[var(--c-muted)] mt-1">
            {data.abbruch.count} von {data.abbruch.total} Schülern abgebrochen
          </p>
        </div>
      </div>

      {/* Dokumente pro Typ + Status-Verteilung */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Dokumente pro Typ" icon={<Users size={18} />}>
          <div className="space-y-4">
            {data.dokumenteProTyp.map((d) => (
              <div key={d.typ}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--c-foreground)]">{d.label}</span>
                  <span className="text-[var(--c-muted)]">{d.rate}% ({d.vorhanden} vorhanden)</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--c-surface-light)] overflow-hidden flex">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${d.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Schüler-Status Verteilung" icon={<BarChart3 size={18} />}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.statusVerteilung}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="count"
                nameKey="label"
              >
                {data.statusVerteilung.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
                formatter={(value) => [Number(value), "Schüler"]}
              />
              <Legend
                formatter={(value) => <span style={{ color: "var(--c-foreground)", fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Dokumenten-Status aller Schüler */}
      <ChartCard title="Dokumenten-Status pro Schüler" icon={<Users size={18} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--c-muted)] border-b border-[var(--c-border)]">
                <th className="text-left py-2 font-medium">Schüler</th>
                <th className="text-center py-2 font-medium">Status</th>
                <th className="text-center py-2 font-medium">Vorhanden</th>
                <th className="text-left py-2 font-medium">Fortschritt</th>
              </tr>
            </thead>
            <tbody>
              {[...data.schuelerDokStatus].sort((a, b) => b.vorhanden - a.vorhanden).map((s) => (
                <tr key={s.id} className="border-b border-[var(--c-border)]/50">
                  <td className="py-2.5 text-[var(--c-foreground)]">{s.name}</td>
                  <td className="py-2.5 text-center">
                    {s.complete ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                        <CheckCircle size={10} /> Vollständig
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                        <AlertCircle size={10} /> Fehlend
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-center text-[var(--c-muted)]">{s.vorhanden} / {s.total}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-[var(--c-surface-light)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            s.complete ? "bg-green-500" : s.vorhanden >= 3 ? "bg-orange-400" : "bg-red-400"
                          }`}
                          style={{ width: `${(s.vorhanden / s.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--c-muted)] w-8">{Math.round((s.vorhanden / s.total) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ================================================================
   TELEFON TAB
   ================================================================ */
function TelefonTab({ data }: { data: TelefonData | null }) {
  if (!data) return <p className="text-[var(--c-muted)] text-center py-8">Keine Telefon-Daten verfügbar.</p>;

  const sentimentData = [
    { name: "Positiv", value: data.sentimentVerteilung.positive || 0, color: "#22c55e" },
    { name: "Neutral", value: data.sentimentVerteilung.neutral || 0, color: "#6b7280" },
    { name: "Negativ", value: data.sentimentVerteilung.negative || 0, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKPI label="Anrufe (30 Tage)" value={String(data.monat)} color="text-blue-400" />
        <MiniKPI label="Ø Dauer" value={`${Math.floor(data.avgDauerSekunden / 60)}:${String(data.avgDauerSekunden % 60).padStart(2, "0")}`} color="text-cyan-400" />
        <MiniKPI label="Konversionsrate" value={`${data.konversionsrate}%`} color="text-green-400" />
        <MiniKPI label="Neue Leads" value={String(data.newLeads)} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anrufvolumen */}
        <ChartCard title="Anrufe pro Tag" icon={<Phone size={18} />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.anrufVolumen}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={11} />
              <YAxis stroke="var(--c-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sentiment + Intents */}
        <ChartCard title="Top-Anfragen & Stimmung" icon={<Info size={18} />}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--c-muted)] mb-2 font-medium">Anfrage-Typ</p>
              {data.topIntents.slice(0, 5).map((item) => (
                <div key={item.intent} className="flex justify-between text-sm py-1">
                  <span className="text-[var(--c-foreground)]">{item.label}</span>
                  <span className="font-semibold text-[var(--c-primary)]">{item.count}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-[var(--c-muted)] mb-2 font-medium">Stimmung</p>
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm py-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--c-foreground)] flex-1">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Letzte Anrufe */}
      <ChartCard title="Letzte Anrufe" icon={<Phone size={18} />}>
        {data.letzteAnrufe.length === 0 ? (
          <p className="text-[var(--c-muted)] text-sm text-center py-4">Noch keine Anrufe erfasst.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--c-muted)] border-b border-[var(--c-border)]">
                  <th className="text-left py-2 font-medium">Datum</th>
                  <th className="text-left py-2 font-medium">Anrufer</th>
                  <th className="text-left py-2 font-medium">Intent</th>
                  <th className="text-left py-2 font-medium">Stimmung</th>
                  <th className="text-right py-2 font-medium">Dauer</th>
                </tr>
              </thead>
              <tbody>
                {data.letzteAnrufe.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--c-border)]/50">
                    <td className="py-2 text-[var(--c-muted)]">{new Date(a.datum).toLocaleDateString("de-DE")}</td>
                    <td className="py-2 text-[var(--c-foreground)]">
                      {a.anrufer}
                      {a.isNewLead && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Lead</span>}
                    </td>
                    <td className="py-2 text-[var(--c-foreground)]">{a.intent || "–"}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.sentiment === "positive" ? "bg-green-500/20 text-green-400" :
                        a.sentiment === "negative" ? "bg-red-500/20 text-red-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {a.sentiment === "positive" ? "Positiv" : a.sentiment === "negative" ? "Negativ" : "Neutral"}
                      </span>
                    </td>
                    <td className="py-2 text-right text-[var(--c-muted)]">
                      {a.dauer ? `${Math.floor(a.dauer / 60)}:${String(a.dauer % 60).padStart(2, "0")}` : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

/* ================================================================
   THEORIE TAB
   ================================================================ */
function TheorieTab({ data }: { data: TheorieData | null }) {
  if (!data) return <p className="text-[var(--c-muted)] text-center py-8">Keine Theorie-Daten verfügbar.</p>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MiniKPI label="Aktive Nutzer (Monat)" value={String(data.monat.aktiveNutzer)} color="text-blue-400" />
        <MiniKPI label="Fragen beantw." value={String(data.monat.fragenBeantwortet)} color="text-cyan-400" />
        <MiniKPI label="Richtig-Rate" value={`${data.monat.richtigRate}%`} color="text-green-400" />
        <MiniKPI label="Quizzes" value={String(data.monat.quizzesAbgeschlossen)} color="text-purple-400" />
        <MiniKPI label="AI-Tutor Fragen" value={String(data.monat.aiTutorNutzung)} color="text-orange-400" />
      </div>

      {/* Woche vs Monat Vergleich */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h3 className="text-base font-semibold text-[var(--c-foreground)] mb-4">Woche vs. Monat</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-[var(--c-muted)]">Aktive Nutzer</p>
            <p className="text-lg font-bold text-[var(--c-foreground)]">{data.woche.aktiveNutzer} <span className="text-sm text-[var(--c-muted)]">/ {data.monat.aktiveNutzer}</span></p>
          </div>
          <div>
            <p className="text-xs text-[var(--c-muted)]">Fragen</p>
            <p className="text-lg font-bold text-[var(--c-foreground)]">{data.woche.fragenBeantwortet} <span className="text-sm text-[var(--c-muted)]">/ {data.monat.fragenBeantwortet}</span></p>
          </div>
          <div>
            <p className="text-xs text-[var(--c-muted)]">Richtig-Rate</p>
            <p className="text-lg font-bold text-[var(--c-foreground)]">{data.woche.richtigRate}% <span className="text-sm text-[var(--c-muted)]">/ {data.monat.richtigRate}%</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktivität */}
        <ChartCard title="Tägliche Aktivität" icon={<BookOpen size={18} />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.aktivitaetProTag}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="label" stroke="var(--c-muted)" fontSize={11} />
              <YAxis stroke="var(--c-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Kategorien */}
        <ChartCard title="Kategorien-Ergebnis" icon={<MousePointerClick size={18} />}>
          {data.kategorieStats.length === 0 ? (
            <p className="text-[var(--c-muted)] text-sm text-center py-8">Noch keine Kategorie-Daten.</p>
          ) : (
            <div className="space-y-3">
              {data.kategorieStats.map((kat) => (
                <div key={kat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--c-foreground)]">{kat.name}</span>
                    <span className="text-[var(--c-muted)]">{kat.rate}% ({kat.richtig}/{kat.total})</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--c-surface-lighter)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--c-primary)]"
                      style={{ width: `${kat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[var(--c-muted)] mt-1">{label}</p>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
      <h3 className="text-base font-semibold text-[var(--c-foreground)] mb-4 flex items-center gap-2">
        <span className="text-[var(--c-primary)]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}
