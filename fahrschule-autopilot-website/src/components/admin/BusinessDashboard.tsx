"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Crown,
  RefreshCw,
  Building2,
  AlertTriangle,
  ArrowUpCircle,
  Target,
} from "lucide-react";

interface MetricsData {
  mrr: number;
  arr: number;
  totalKunden: number;
  totalSchueler: number;
  totalUmsatz: number;
  avgSchuelerProKunde: number;
  avgPlanPrice: number;
  estimatedLTV: number;
  cac: number;
  ltcRatio: number;
  leadToCustomerRate: number;
  totalLeads: number;
  totalOutreach: number;
  kundenProPlan: { starter: number; pro: number; premium: number };
  kundenProMonat: Array<{ monat: string; label: string; count: number; mrr: number }>;
  topKunden: Array<{ name: string; plan: string; schueler: number; mrr: number }>;
}

interface MarketingData {
  traffic: { uniqueBesucher30d: number; ctaClicks30d: number; conversionRate: number; neueKunden30d: number; trafficQuellen: Array<{ quelle: string; count: number; anteil: number }> };
  bewertungen: { anfragenGesamt: number; anfragen30d: number; avgGoogleRating: number; totalGoogleReviews: number };
  empfehlungen: { gesendetGesamt: number; gesendet30d: number };
}

interface ChurnData {
  churnRisiko: Array<{ name: string; plan: string; mrr: number; churnScore: number; reasons: string[]; empfohleneAktion: string }>;
  upsellingKandidaten: Array<{ name: string; plan: string; zielPlan: string; uplift: number; aktiveSchueler: number; upsellingScore: number; empfehlung: string }>;
  metriken: { kundenMitChurnRisiko: number; churnRisikoMRR: number; upsellingKandidatenAnzahl: number; potenziellesUpselling: number };
}

interface SalesPipeline {
  pipeline: Record<string, number>;
  total: number;
}

interface FunnelData {
  funnel: Array<{ stufe: string; label: string; count: number; conversionFromStart: number; conversionFromPrev?: number }>;
  avgDaysToClose: number | null;
  totalClosed: number;
  totalLost: number;
  responseRate: number;
  weeklyVolume: Array<{ woche: string; outreach: number; antworten: number; calls: number }>;
}

export default function BusinessDashboard() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [salesData, setSalesData] = useState<SalesPipeline | null>(null);
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadMetrics() {
    setLoading(true);
    try {
      const [metricsRes, churnRes, salesRes, marketingRes, funnelRes] = await Promise.all([
        fetch("/api/admin/metrics", { headers: { "x-admin-key": "" } }),
        fetch("/api/sales/churn", { headers: { "x-admin-key": "" } }).catch(() => null),
        fetch("/api/sales/leads").catch(() => null),
        fetch("/api/analytics/marketing", { headers: { "x-admin-key": "" } }).catch(() => null),
        fetch("/api/analytics/sales-funnel", { headers: { "x-admin-key": "" } }).catch(() => null),
      ]);
      setData(await metricsRes.json());
      setLastUpdated(new Date());
      if (churnRes?.ok) setChurnData(await churnRes.json());
      if (salesRes?.ok) setSalesData(await salesRes.json());
      if (marketingRes?.ok) setMarketingData(await marketingRes.json());
      if (funnelRes?.ok) setFunnelData(await funnelRes.json());
    } catch (err) {
      console.error("Admin metrics error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
    intervalRef.current = setInterval(() => loadMetrics(), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 size={24} />
              Business Metrics
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-400">Fahrschule Autopilot — Internes Dashboard</p>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Aktualisiert {lastUpdated.toLocaleTimeString("de-DE")}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={loadMetrics}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
            Aktualisieren
          </button>
        </div>

        {/* KPI Cards — Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<DollarSign size={20} />}
            label="MRR"
            value={`€${data.mrr.toLocaleString("de-DE")}`}
            sub={`ARR: €${data.arr.toLocaleString("de-DE")}`}
            color="text-green-400"
            bg="bg-green-500/10"
          />
          <MetricCard
            icon={<Users size={20} />}
            label="Kunden"
            value={String(data.totalKunden)}
            sub={`Ø ${data.avgSchuelerProKunde} Schüler/Kunde`}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
          <MetricCard
            icon={<TrendingUp size={20} />}
            label="LTV"
            value={`€${data.estimatedLTV}`}
            sub={`Ø Planpreis: €${data.avgPlanPrice}/m`}
            color="text-purple-400"
            bg="bg-purple-500/10"
          />
          <MetricCard
            icon={<Target size={20} />}
            label="CAC"
            value={data.cac > 0 ? `€${data.cac}` : "–"}
            sub={data.ltcRatio > 0 ? `LTV:CAC = ${data.ltcRatio}x` : `${data.totalLeads} Leads, ${data.leadToCustomerRate}% Conversion`}
            color="text-cyan-400"
            bg="bg-cyan-500/10"
          />
        </div>

        {/* KPI Cards — Row 2: Marketing */}
        {marketingData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Crown size={20} />}
              label="Demo-Besucher (30d)"
              value={String(marketingData.traffic.uniqueBesucher30d)}
              sub={`${marketingData.traffic.ctaClicks30d} CTA Clicks`}
              color="text-orange-400"
              bg="bg-orange-500/10"
            />
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="Conversion Rate"
              value={`${marketingData.traffic.conversionRate}%`}
              sub={`${marketingData.traffic.neueKunden30d} neue Kunden (30d)`}
              color="text-green-400"
              bg="bg-green-500/10"
            />
            <MetricCard
              icon={<Crown size={20} />}
              label="Google-Bewertung"
              value={marketingData.bewertungen.avgGoogleRating > 0 ? `${marketingData.bewertungen.avgGoogleRating}★` : "–"}
              sub={`${marketingData.bewertungen.totalGoogleReviews} Bewertungen gesamt`}
              color="text-yellow-400"
              bg="bg-yellow-500/10"
            />
            <MetricCard
              icon={<Users size={20} />}
              label="Empfehlungen (30d)"
              value={String(marketingData.empfehlungen.gesendet30d)}
              sub={`${marketingData.empfehlungen.gesendetGesamt} gesamt gesendet`}
              color="text-pink-400"
              bg="bg-pink-500/10"
            />
          </div>
        )}

        {/* Traffic-Quellen */}
        {marketingData && marketingData.traffic.trafficQuellen.length > 0 && (
          <div className="rounded-xl border border-gray-800 bg-[#111118] p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <ArrowUpCircle size={18} className="text-cyan-400" />
              Traffic-Quellen (30 Tage)
            </h3>
            <div className="space-y-2">
              {marketingData.traffic.trafficQuellen.map((q) => (
                <div key={q.quelle} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-32 truncate">{q.quelle}</span>
                  <div className="flex-1 h-3 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${q.anteil}%`, minWidth: q.count > 0 ? "8px" : "0" }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{q.count}</span>
                  <span className="text-xs text-gray-500 w-10 text-right">{q.anteil}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-800 bg-[#111118] p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Crown size={18} className="text-blue-400" />
              Kunden pro Plan
            </h3>
            <div className="space-y-4">
              {[
                { plan: "Starter", count: data.kundenProPlan.starter, price: 99, color: "bg-blue-500" },
                { plan: "Pro", count: data.kundenProPlan.pro, price: 249, color: "bg-green-500" },
                { plan: "Premium", count: data.kundenProPlan.premium, price: 499, color: "bg-purple-500" },
              ].map((p) => (
                <div key={p.plan} className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 w-20">{p.plan}</span>
                  <div className="flex-1 h-6 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full ${p.color} rounded-full flex items-center justify-end pr-2`}
                      style={{ width: `${data.totalKunden > 0 ? (p.count / data.totalKunden) * 100 : 0}%`, minWidth: p.count > 0 ? "40px" : "0" }}
                    >
                      {p.count > 0 && <span className="text-xs font-bold text-white">{p.count}</span>}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 w-24 text-right">
                    €{(p.count * p.price).toLocaleString("de-DE")}/m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kunden-Wachstum */}
          <div className="rounded-xl border border-gray-800 bg-[#111118] p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" />
              Kunden-Wachstum
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.kundenProMonat}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="label" stroke="#8888a0" fontSize={12} />
                <YAxis stroke="#8888a0" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111118", border: "1px solid #2a2a3a", borderRadius: 8 }}
                  labelStyle={{ color: "#f0f0f5" }}
                  formatter={(value, name) => [
                    name === "mrr" ? `€${Number(value)}` : Number(value),
                    name === "mrr" ? "MRR" : "Neukunden",
                  ]}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn-Risiko */}
        {churnData && churnData.churnRisiko.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-400" />
              Churn-Risiko ({churnData.metriken.kundenMitChurnRisiko} Kunden, €{churnData.metriken.churnRisikoMRR}/m gefährdet)
            </h3>
            <div className="space-y-3">
              {churnData.churnRisiko.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#111118]">
                  <div>
                    <p className="font-medium">{c.name} <span className="text-xs text-gray-400">({c.plan})</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.reasons.join(" • ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">{c.churnScore}%</p>
                    <p className="text-xs text-gray-400">{c.empfohleneAktion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upselling-Kandidaten */}
        {churnData && churnData.upsellingKandidaten.length > 0 && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <ArrowUpCircle size={18} className="text-green-400" />
              Upselling (+€{churnData.metriken.potenziellesUpselling}/m Potenzial)
            </h3>
            <div className="space-y-3">
              {churnData.upsellingKandidaten.slice(0, 5).map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#111118]">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{u.empfehlung}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-gray-400">{u.plan}</span>
                      <span className="mx-1 text-gray-500">→</span>
                      <span className="text-green-400 font-bold">{u.zielPlan}</span>
                    </p>
                    <p className="text-xs text-green-400">+€{u.uplift}/m</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Pipeline */}
        {salesData && salesData.total > 0 && (
          <div className="rounded-xl border border-gray-800 bg-[#111118] p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Target size={18} className="text-purple-400" />
              Sales Pipeline ({salesData.total} Leads)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { key: "neu", label: "Neu", color: "text-gray-400" },
                { key: "kontaktiert", label: "Kontaktiert", color: "text-blue-400" },
                { key: "interessiert", label: "Interessiert", color: "text-cyan-400" },
                { key: "demo_gebucht", label: "Demo", color: "text-purple-400" },
                { key: "gewonnen", label: "Gewonnen", color: "text-green-400" },
              ].map((s) => (
                <div key={s.key} className="text-center p-3 rounded-lg bg-gray-800/30">
                  <p className={`text-xl font-bold ${s.color}`}>{salesData.pipeline[s.key] || 0}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Funnel */}
        {funnelData && funnelData.funnel.length > 0 && (
          <div className="rounded-xl border border-gray-800 bg-[#111118] p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Target size={18} className="text-cyan-400" />
              Sales Funnel
              {funnelData.avgDaysToClose && (
                <span className="text-xs text-gray-400 font-normal ml-2">
                  (Avg. {funnelData.avgDaysToClose} Tage bis Close | Response Rate: {funnelData.responseRate}%)
                </span>
              )}
            </h3>
            <div className="space-y-3">
              {funnelData.funnel.map((stage, i) => {
                const maxCount = funnelData.funnel[0]?.count || 1;
                const width = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0) : 0;
                const colors = ["bg-gray-500", "bg-blue-500", "bg-cyan-500", "bg-purple-500", "bg-orange-500", "bg-green-500"];
                return (
                  <div key={stage.stufe} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-28 truncate">{stage.label}</span>
                    <div className="flex-1 h-7 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full ${colors[i] || "bg-blue-500"} rounded-full flex items-center justify-end pr-2 transition-all`}
                        style={{ width: `${width}%` }}
                      >
                        {stage.count > 0 && <span className="text-xs font-bold text-white">{stage.count}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{stage.conversionFromStart}%</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <span>Gewonnen: <strong className="text-green-400">{funnelData.totalClosed}</strong></span>
              <span>Verloren: <strong className="text-red-400">{funnelData.totalLost}</strong></span>
            </div>
          </div>
        )}

        {/* Top Kunden */}
        <div className="rounded-xl border border-gray-800 bg-[#111118] p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Top Kunden
          </h3>
          {data.topKunden.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Noch keine Kunden vorhanden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 font-medium">Fahrschule</th>
                    <th className="text-left py-2 font-medium">Plan</th>
                    <th className="text-right py-2 font-medium">Schüler</th>
                    <th className="text-right py-2 font-medium">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topKunden.map((k, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 font-medium">{k.name}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          k.plan === "premium" ? "bg-purple-500/20 text-purple-400" :
                          k.plan === "pro" ? "bg-green-500/20 text-green-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {k.plan}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">{k.schueler}</td>
                      <td className="py-2.5 text-right font-medium text-green-400">€{k.mrr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111118] p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bg}`}>
          <span className={color}>{icon}</span>
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
