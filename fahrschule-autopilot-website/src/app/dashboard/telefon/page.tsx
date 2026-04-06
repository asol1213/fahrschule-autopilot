"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTenantId } from "@/components/dashboard/TenantContext";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp,
  Play,
  Loader2,
} from "lucide-react";

// --- Types ---

interface HealthStatus {
  status: string;
  service: string;
  webhookConfigured: boolean;
  signatureVerification: boolean;
}

interface WebhookTestResult {
  event: string;
  status: "pass" | "fail" | "pending";
  response?: string;
  httpCode?: number;
}

interface AnalyticsData {
  monat: number;
  avgDauerSekunden: number;
  konversionsrate: number;
  newLeads: number;
  topIntents: Array<{ intent: string; label: string; count: number }>;
  sentimentVerteilung: Record<string, number>;
  letzteAnrufe: Array<{
    id: string;
    datum: string;
    anrufer: string;
    dauer: number;
    intent: string;
    sentiment: string;
    zusammenfassung: string;
    isNewLead: boolean;
  }>;
}

// --- Helpers ---

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        ok
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}
    >
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
      <div className="flex items-center gap-2 text-[var(--c-muted)] mb-2">
        <Icon size={16} />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold text-[var(--c-foreground)]">{value}</div>
      {sub && <div className="text-xs text-[var(--c-muted)] mt-1">{sub}</div>}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sentimentEmoji(s: string): string {
  switch (s) {
    case "positive": return "😊";
    case "negative": return "😟";
    case "neutral": return "😐";
    default: return "❓";
  }
}

function intentLabel(intent: string): string {
  const labels: Record<string, string> = {
    anmeldung: "Anmeldung",
    termin: "Termin",
    preisanfrage: "Preis",
    information: "Info",
    beschwerde: "Beschwerde",
    umschreibung: "Umschreibung",
    auffrischung: "Auffrischung",
    sonstiges: "Sonstiges",
  };
  return labels[intent] || intent;
}

// --- Main Component ---

export default function TelefonDashboard() {
  const tenantId = useTenantId();

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [webhookTests, setWebhookTests] = useState<WebhookTestResult[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Health Check
  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/retell");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    }
    setHealthLoading(false);
  }, []);

  // Analytics
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/analytics/telefon?tenantId=${encodeURIComponent(tenantId)}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // Supabase not connected
    }
    setAnalyticsLoading(false);
  }, [tenantId]);

  const checkHealthRef = useRef(checkHealth);
  useEffect(() => { checkHealthRef.current = checkHealth; }, [checkHealth]);

  const loadAnalyticsRef = useRef(loadAnalytics);
  useEffect(() => { loadAnalyticsRef.current = loadAnalytics; }, [loadAnalytics]);

  useEffect(() => {
    checkHealthRef.current();
    loadAnalyticsRef.current();
  }, [tenantId]);

  // Webhook Test
  async function runWebhookTests() {
    setTestRunning(true);
    const tests: WebhookTestResult[] = [];

    const payloads = [
      {
        event: "call_started",
        label: "Anruf gestartet",
        data: {
          event: "call_started",
          call: {
            call_id: `dashboard_test_${Date.now()}`,
            agent_id: "test_agent",
            call_status: "registered",
            from_number: "+4917600000000",
            direction: "inbound",
            metadata: { tenant_id: tenantId },
          },
        },
      },
      {
        event: "call_ended",
        label: "Anruf beendet",
        data: {
          event: "call_ended",
          call: {
            call_id: `dashboard_test_${Date.now()}`,
            agent_id: "test_agent",
            call_status: "ended",
            from_number: "+4917600000000",
            duration_ms: 120000,
            transcript: "Test-Transkription vom Dashboard",
            metadata: { tenant_id: tenantId },
          },
        },
      },
      {
        event: "call_analyzed",
        label: "Anruf analysiert",
        data: {
          event: "call_analyzed",
          call: {
            call_id: `dashboard_test_${Date.now()}`,
            agent_id: "test_agent",
            call_status: "ended",
            from_number: "+4917600000000",
            duration_ms: 120000,
            call_analysis: {
              call_summary: "Dashboard Test: Anfrage Klasse B",
              user_sentiment: "positive",
              custom_analysis_data: {
                intent: "preisanfrage",
                name: "Test Anrufer",
                phone: "017600000000",
                license_class: "B",
                urgency: "mittel",
                recording_consent: "ja",
              },
            },
            metadata: { tenant_id: tenantId },
          },
        },
      },
    ];

    for (const p of payloads) {
      tests.push({ event: p.label, status: "pending" });
      setWebhookTests([...tests]);

      try {
        const res = await fetch("/api/retell", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Test-Secret": "dashboard-test",
          },
          body: JSON.stringify(p.data),
        });
        const body = await res.json();
        tests[tests.length - 1] = {
          event: p.label,
          status: body.success ? "pass" : "fail",
          httpCode: res.status,
          response: JSON.stringify(body),
        };
      } catch (err) {
        tests[tests.length - 1] = {
          event: p.label,
          status: "fail",
          response: String(err),
        };
      }
      setWebhookTests([...tests]);
    }

    setTestRunning(false);
    // Reload analytics after tests
    setTimeout(() => loadAnalytics(), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--c-foreground)]">
            AI Telefon-Assistent
          </h1>
          <p className="text-sm text-[var(--c-muted)] mt-1">
            Status, Tests und Analytics
          </p>
        </div>
        <button
          onClick={() => { checkHealth(); loadAnalytics(); }}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--c-border)] text-[var(--c-muted)] hover:text-[var(--c-foreground)] hover:bg-[var(--c-surface-light)] transition-colors"
        >
          <RefreshCw size={14} />
          Aktualisieren
        </button>
      </div>

      {/* System Status */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h2 className="text-sm font-semibold text-[var(--c-foreground)] mb-4 flex items-center gap-2">
          <Phone size={16} />
          System-Status
        </h2>
        {healthLoading ? (
          <div className="flex items-center gap-2 text-[var(--c-muted)]">
            <Loader2 size={14} className="animate-spin" />
            Prüfe Verbindung...
          </div>
        ) : health?.status === "ok" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-green-400">
                Webhook aktiv und empfangsbereit
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge ok={true} label="Webhook online" />
              <StatusBadge
                ok={health.webhookConfigured}
                label={health.webhookConfigured ? "n8n verbunden" : "n8n nicht konfiguriert"}
              />
              <StatusBadge
                ok={health.signatureVerification}
                label={health.signatureVerification ? "Signatur-Check aktiv" : "Keine Signatur-Prüfung"}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={16} />
            <span className="text-sm">Webhook nicht erreichbar</span>
          </div>
        )}
      </div>

      {/* Webhook Tests */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--c-foreground)] flex items-center gap-2">
            <Play size={16} />
            Webhook-Tests
          </h2>
          <button
            onClick={runWebhookTests}
            disabled={testRunning}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--c-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {testRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {testRunning ? "Läuft..." : "Tests starten"}
          </button>
        </div>
        <p className="text-xs text-[var(--c-muted)] mb-4">
          Sendet simulierte fonio-Events an den Webhook und prüft die Antworten.
        </p>

        {webhookTests.length === 0 ? (
          <div className="text-center py-8 text-[var(--c-muted)]">
            <PhoneCall size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Klicke &quot;Tests starten&quot; um alle Events zu testen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {webhookTests.map((t, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  t.status === "pass"
                    ? "border-green-500/20 bg-green-500/5"
                    : t.status === "fail"
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-[var(--c-border)] bg-[var(--c-surface-light)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {t.status === "pending" ? (
                    <Loader2 size={16} className="animate-spin text-[var(--c-muted)]" />
                  ) : t.status === "pass" ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                  <span className="text-sm">{t.event}</span>
                </div>
                {t.httpCode && (
                  <span className="text-xs text-[var(--c-muted)]">HTTP {t.httpCode}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics KPIs */}
      {analytics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={PhoneCall}
              label="Anrufe (30 Tage)"
              value={String(analytics.monat)}
            />
            <StatCard
              icon={Clock}
              label="Ø Dauer"
              value={formatDuration(analytics.avgDauerSekunden)}
              sub="pro Anruf"
            />
            <StatCard
              icon={Users}
              label="Neue Leads"
              value={String(analytics.newLeads)}
              sub={`${analytics.konversionsrate}% Konversion`}
            />
            <StatCard
              icon={TrendingUp}
              label="Konversionsrate"
              value={`${analytics.konversionsrate}%`}
              sub="Anrufe → Leads"
            />
          </div>

          {/* Top Intents */}
          {analytics.topIntents.length > 0 && (
            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
              <h2 className="text-sm font-semibold text-[var(--c-foreground)] mb-4 flex items-center gap-2">
                <BarChart3 size={16} />
                Top Anliegen
              </h2>
              <div className="space-y-2">
                {analytics.topIntents.map((item) => {
                  const pct = analytics.monat > 0 ? Math.round((item.count / analytics.monat) * 100) : 0;
                  return (
                    <div key={item.intent} className="flex items-center gap-3">
                      <span className="text-sm w-24 text-[var(--c-muted)]">{item.label}</span>
                      <div className="flex-1 h-6 rounded-full bg-[var(--c-surface-light)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500/30"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--c-muted)] w-16 text-right">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sentiment */}
          {analytics.sentimentVerteilung && (
            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
              <h2 className="text-sm font-semibold text-[var(--c-foreground)] mb-4 flex items-center gap-2">
                <MessageSquare size={16} />
                Stimmung der Anrufer
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(analytics.sentimentVerteilung).map(([key, count]) => (
                  <div key={key} className="text-center p-3 rounded-lg border border-[var(--c-border)]">
                    <div className="text-2xl mb-1">{sentimentEmoji(key)}</div>
                    <div className="text-lg font-bold text-[var(--c-foreground)]">{count}</div>
                    <div className="text-xs text-[var(--c-muted)] capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Calls Table */}
          {analytics.letzteAnrufe.length > 0 && (
            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
              <div className="p-4 border-b border-[var(--c-border)]">
                <h2 className="text-sm font-semibold text-[var(--c-foreground)] flex items-center gap-2">
                  <PhoneOff size={16} />
                  Letzte Anrufe
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--c-surface-light)]">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--c-muted)]">Datum</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--c-muted)]">Anrufer</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--c-muted)]">Dauer</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--c-muted)]">Anliegen</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--c-muted)]">Stimmung</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--c-muted)]">Lead?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.letzteAnrufe.map((call) => (
                      <tr key={call.id} className="border-t border-[var(--c-border)] hover:bg-[var(--c-surface-light)]">
                        <td className="px-4 py-2.5 text-[var(--c-muted)]">
                          {new Date(call.datum).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--c-foreground)]">{call.anrufer}</td>
                        <td className="px-4 py-2.5 text-[var(--c-muted)]">{formatDuration(call.dauer || 0)}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {intentLabel(call.intent)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{sentimentEmoji(call.sentiment)}</td>
                        <td className="px-4 py-2.5">
                          {call.isNewLead ? (
                            <CheckCircle2 size={14} className="text-green-400" />
                          ) : (
                            <span className="text-[var(--c-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {analyticsLoading && !analytics && (
        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-8 text-center">
          <AlertTriangle size={24} className="mx-auto mb-2 text-yellow-400" />
          <p className="text-sm text-[var(--c-muted)]">
            Analytics werden geladen... Falls keine Daten erscheinen, ist die Datenbank
            möglicherweise noch nicht verbunden.
          </p>
        </div>
      )}
    </div>
  );
}
