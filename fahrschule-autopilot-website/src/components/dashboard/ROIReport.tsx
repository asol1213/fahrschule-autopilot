"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenantId } from "@/components/dashboard/TenantContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Clock, CreditCard, Shield, RefreshCw } from "lucide-react";

interface ROIData {
  planKosten: number;
  plan: string;
  noShow: { aktuelleRate: number; branchenDurchschnitt: number; geretteteStunden: number; ersparnis: number };
  zeit: { automationen: number; stundenGespart: number; ersparnis: number };
  zahlungen: { wiederhergestellt: number; mahnungenErfolgreich: number };
  gesamt: { ersparnis: number; roi: number; nettoVorteil: number };
}

export default function ROIReport() {
  const tenantId = useTenantId();
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/roi?tenantId=${tenantId}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("ROI load error:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-[var(--c-primary)] animate-spin" />
      </div>
    );
  }

  const chartData = [
    { name: "Autopilot Kosten", betrag: data.planKosten, fill: "#ef4444" },
    { name: "Ersparnisse", betrag: data.gesamt.ersparnis, fill: "#22c55e" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--c-foreground)] flex items-center gap-2">
          <TrendingUp size={24} />
          ROI Report
        </h1>
        <p className="text-sm text-[var(--c-muted)]">Ihre monatlichen Ersparnisse durch Fahrschule Autopilot</p>
      </div>

      {/* Hero Number */}
      <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-8 text-center">
        <p className="text-sm text-[var(--c-muted)] mb-2">Monatliche Gesamtersparnis</p>
        <p className={`text-5xl font-bold ${data.gesamt.ersparnis > 0 ? "text-green-400" : "text-[var(--c-muted)]"}`}>
          &euro;{data.gesamt.ersparnis.toLocaleString("de-DE")}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className={`text-lg font-semibold ${data.gesamt.roi > 0 ? "text-green-400" : "text-red-400"}`}>
            {data.gesamt.roi > 0 ? "+" : ""}{data.gesamt.roi}% ROI
          </span>
          <span className="text-sm text-[var(--c-muted)]">
            vs. &euro;{data.planKosten}/Monat ({data.plan})
          </span>
        </div>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ROICard
          icon={<Shield size={20} />}
          title="No-Show Ersparnis"
          value={`\u20AC${data.noShow.ersparnis}`}
          color="text-blue-400"
          bg="bg-blue-500/10"
          details={[
            `Aktuelle Rate: ${data.noShow.aktuelleRate}% (Branche: ${data.noShow.branchenDurchschnitt}%)`,
            `${data.noShow.geretteteStunden} Fahrstunden gerettet`,
          ]}
        />
        <ROICard
          icon={<Clock size={20} />}
          title="Zeitersparnis"
          value={`\u20AC${data.zeit.ersparnis}`}
          color="text-purple-400"
          bg="bg-purple-500/10"
          details={[
            `${data.zeit.stundenGespart}h manuelle Arbeit gespart`,
            `${data.zeit.automationen} Automationen ausgefuehrt`,
          ]}
        />
        <ROICard
          icon={<CreditCard size={20} />}
          title="Zahlungen gerettet"
          value={`\u20AC${data.zahlungen.wiederhergestellt}`}
          color="text-green-400"
          bg="bg-green-500/10"
          details={[
            `${data.zahlungen.mahnungenErfolgreich} erfolgreiche Mahnungen`,
            "Automatische 3-Stufen-Erinnerung",
          ]}
        />
      </div>

      {/* Comparison Chart */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h3 className="text-base font-semibold text-[var(--c-foreground)] mb-4">Kosten vs. Ersparnisse</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false} />
            <XAxis type="number" stroke="var(--c-muted)" fontSize={12} tickFormatter={(v) => `\u20AC${v}`} />
            <YAxis type="category" dataKey="name" stroke="var(--c-muted)" fontSize={12} width={130} />
            <Tooltip
              contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8 }}
              formatter={(value) => [`\u20AC${Number(value).toLocaleString("de-DE")}`, "Betrag"]}
            />
            <Bar dataKey="betrag" radius={[0, 4, 4, 0]}>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ROICard({ icon, title, value, color, bg, details }: {
  icon: React.ReactNode; title: string; value: string; color: string; bg: string; details: string[];
}) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <span className={color}>{icon}</span>
        </div>
        <span className="text-sm text-[var(--c-muted)]">{title}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <div className="mt-3 space-y-1">
        {details.map((d, i) => (
          <p key={i} className="text-xs text-[var(--c-muted)]">{d}</p>
        ))}
      </div>
    </div>
  );
}
