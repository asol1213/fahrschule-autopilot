"use client";

import { useState } from "react";

const TEST_TENANT = "11111111-1111-1111-1111-111111111111";

interface TestResult {
  name: string;
  url: string;
  status: "pending" | "running" | "pass" | "fail" | "warn";
  statusCode?: number;
  message?: string;
  durationMs?: number;
}

const API_TESTS: Array<{ name: string; url: string; method?: string; body?: object }> = [
  // Analytics
  { name: "Analytics (KPI Dashboard)", url: `/api/analytics?tenantId=${TEST_TENANT}&range=6m` },
  { name: "Telefon Analytics", url: `/api/analytics/telefon?tenantId=${TEST_TENANT}` },
  { name: "Theorie Analytics", url: `/api/analytics/theorie?tenantId=${TEST_TENANT}` },
  { name: "Conversion Funnel", url: `/api/analytics/conversion` },
  // Reporting
  { name: "Reporting (Monatsreport)", url: `/api/reporting?tenantId=${TEST_TENANT}` },
  // Export
  { name: "CSV Export (Schüler)", url: `/api/export?tenantId=${TEST_TENANT}&format=csv&type=schueler` },
  { name: "PDF Report", url: `/api/export/pdf?tenantId=${TEST_TENANT}` },
  // Sales
  { name: "Sales Leads (GET)", url: `/api/sales/leads` },
  { name: "Churn + Upselling", url: `/api/sales/churn` },
  { name: "Follow-Up Queue", url: `/api/sales/follow-up` },
  // Admin
  { name: "Admin Business Metrics", url: `/api/admin/metrics` },
  // fonio Health
  { name: "fonio Webhook Health", url: `/api/retell` },
  // E-Mail Health
  { name: "E-Mail API", url: `/api/email/send` },
  { name: "Report E-Mail API", url: `/api/email/report` },
  // Theorie Event POST
  {
    name: "Theorie Event (POST)",
    url: `/api/analytics/theorie`,
    method: "POST",
    body: { tenantId: TEST_TENANT, userId: "test_health", eventType: "session_started" },
  },
  // Conversion POST
  {
    name: "Conversion Event (POST)",
    url: `/api/analytics/conversion`,
    method: "POST",
    body: { plan: "premium", visitorId: "test_health", referrer: "healthcheck" },
  },
];

export default function AdminTestPage() {
  const [results, setResults] = useState<TestResult[]>(
    API_TESTS.map((t) => ({ name: t.name, url: t.url, status: "pending" as const }))
  );
  const [running, setRunning] = useState(false);

  const runAllTests = async () => {
    setRunning(true);
    setResults((prev) => prev.map((r) => ({ ...r, status: "running" as const })));

    const promises = API_TESTS.map(async (test, idx) => {
      const start = Date.now();
      try {
        const res = await fetch(test.url, {
          method: test.method || "GET",
          credentials: "include",
          headers: test.body ? { "Content-Type": "application/json" } : {},
          body: test.body ? JSON.stringify(test.body) : undefined,
        });
        const durationMs = Date.now() - start;
        const isOk = res.ok || res.status === 401 || res.status === 405;
        let message = `${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json.error) message += ` — ${json.error}`;
          if (json.status) message += ` (${json.status})`;
        } catch {
          // Not JSON, that's fine (CSV/PDF)
          message += " (non-JSON response)";
        }
        setResults((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: res.ok ? "pass" : isOk ? "warn" : "fail",
            statusCode: res.status,
            message,
            durationMs,
          };
          return next;
        });
      } catch (err) {
        setResults((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: "fail",
            message: `Network error: ${err instanceof Error ? err.message : "unknown"}`,
            durationMs: Date.now() - start,
          };
          return next;
        });
      }
    });

    await Promise.allSettled(promises);
    setRunning(false);
  };

  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const warnCount = results.filter((r) => r.status === "warn").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Agent 7 — API Health Check</h1>
            <p className="text-gray-400 text-sm mt-1">
              Testet alle {API_TESTS.length} API-Endpunkte mit Tenant: <code className="text-blue-400">{TEST_TENANT}</code>
            </p>
          </div>
          <button
            onClick={runAllTests}
            disabled={running}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              running
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {running ? "Teste..." : "Alle Tests starten"}
          </button>
        </div>

        {/* Summary */}
        {results.some((r) => r.status !== "pending") && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{passCount}</p>
              <p className="text-sm text-gray-400">Bestanden</p>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{warnCount}</p>
              <p className="text-sm text-gray-400">Warnung (401/405)</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{failCount}</p>
              <p className="text-sm text-gray-400">Fehlgeschlagen</p>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                r.status === "pass"
                  ? "border-green-500/30 bg-green-500/5"
                  : r.status === "fail"
                  ? "border-red-500/30 bg-red-500/5"
                  : r.status === "warn"
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : r.status === "running"
                  ? "border-blue-500/30 bg-blue-500/5"
                  : "border-gray-700 bg-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {r.status === "pass" && "✅"}
                  {r.status === "fail" && "❌"}
                  {r.status === "warn" && "⚠️"}
                  {r.status === "running" && "🔄"}
                  {r.status === "pending" && "⏳"}
                </span>
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{r.url}</p>
                </div>
              </div>
              <div className="text-right">
                {r.message && <p className="text-xs text-gray-400">{r.message}</p>}
                {r.durationMs !== undefined && (
                  <p className="text-xs text-gray-600">{r.durationMs}ms</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Hinweis */}
        <div className="mt-8 rounded-xl border border-gray-700 bg-gray-900 p-6 text-sm text-gray-400">
          <p className="font-semibold text-white mb-2">Hinweise:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>401 (Warnung)</strong> = Auth aktiv, API erreichbar aber Login erforderlich</li>
            <li><strong>405</strong> = Method Not Allowed (z.B. GET auf POST-only Route) — Normal</li>
            <li><strong>500</strong> = Server-Fehler — Supabase-Tabellen evtl. noch nicht migriert</li>
            <li>Seed-Daten: <code>psql</code> oder Supabase SQL Editor → <code>scripts/seed-testdata.sql</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
