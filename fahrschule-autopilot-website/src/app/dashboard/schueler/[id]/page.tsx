"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { useTenantId } from "@/components/dashboard/TenantContext";
import Link from "next/link";
import {
  ArrowLeft, User, Car, CreditCard, FileText, MessageSquare,
  GraduationCap, Edit3, Save, X, CheckCircle, Shield, Trash2, Award, Download,
} from "lucide-react";

const STATUS_STEPS = [
  { key: "angemeldet", label: "Angemeldet" },
  { key: "dokumente_ausstehend", label: "Dokumente" },
  { key: "theorie", label: "Theorie" },
  { key: "praxis", label: "Praxis" },
  { key: "pruefung", label: "Prüfung" },
  { key: "bestanden", label: "Bestanden" },
];

const TABS = [
  { id: "fahrstunden", label: "Fahrstunden", icon: Car },
  { id: "zahlungen", label: "Zahlungen", icon: CreditCard },
  { id: "dokumente", label: "Dokumente", icon: FileText },
  { id: "pruefungen", label: "Prüfungen", icon: GraduationCap },
  { id: "kommunikation", label: "Kommunikation", icon: MessageSquare },
];

export default function SchuelerDetailPage() {
  const { id } = useParams();
  const tenantId = useTenantId();
  const [schueler, setSchueler] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("fahrstunden");
  const [tabData, setTabData] = useState<Record<string, unknown>[]>([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pruefungsreife, setPruefungsreife] = useState<Record<string, unknown> | null>(null);
  const [showDsgvo, setShowDsgvo] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("schueler")
      .select("*, fahrlehrer(vorname, nachname)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();
    setSchueler(data);
    setLoading(false);

    // Load Prüfungsreife
    try {
      const res = await fetch(`/api/crm/pruefungsreife?schuelerId=${id}`);
      if (res.ok) setPruefungsreife(await res.json());
    } catch { /* ignore */ }
  }, [supabase, id, tenantId]);

  const loadTab = useCallback(async () => {
    if (!id) return;
    let data: Record<string, unknown>[] = [];

    if (activeTab === "fahrstunden") {
      const { data: rows } = await supabase.from("fahrstunden").select("*, fahrlehrer(vorname, nachname)").eq("schueler_id", id).eq("tenant_id", tenantId).order("datum", { ascending: false });
      data = (rows || []) as Record<string, unknown>[];
    } else if (activeTab === "zahlungen") {
      const { data: rows } = await supabase.from("zahlungen").select("*").eq("schueler_id", id).eq("tenant_id", tenantId).order("faellig_am", { ascending: false });
      data = (rows || []) as Record<string, unknown>[];
    } else if (activeTab === "dokumente") {
      const { data: rows } = await supabase.from("dokumente").select("*").eq("schueler_id", id).eq("tenant_id", tenantId);
      data = (rows || []) as Record<string, unknown>[];
    } else if (activeTab === "pruefungen") {
      const { data: rows } = await supabase.from("pruefungen").select("*").eq("schueler_id", id).eq("tenant_id", tenantId).order("datum", { ascending: false });
      data = (rows || []) as Record<string, unknown>[];
    } else if (activeTab === "kommunikation") {
      const { data: rows } = await supabase.from("kommunikation").select("*").eq("schueler_id", id).eq("tenant_id", tenantId).order("datum", { ascending: false });
      data = (rows || []) as Record<string, unknown>[];
    }

    setTabData(data);
  }, [supabase, id, activeTab, tenantId]);

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  const loadTabRef = useRef(loadTab);
  useEffect(() => { loadTabRef.current = loadTab; }, [loadTab]);

  useEffect(() => { loadRef.current(); }, [id]);
  useEffect(() => { loadTabRef.current(); }, [id, activeTab]);

  const handleSave = async () => {
    if (!schueler) return;
    await supabase.from("schueler").update(editData).eq("id", id);
    setEditing(false);
    load();
  };

  const handleStatusChange = async (newStatus: string) => {
    await supabase.from("schueler").update({ status: newStatus }).eq("id", id);
    load();
  };

  const handleDownloadAusbildungsnachweis = async () => {
    if (!schueler?.tenant_id) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(
        `/api/crm/ausbildungsnachweis?schuelerId=${id}&tenantId=${schueler.tenant_id}`
      );
      if (!res.ok) throw new Error("PDF-Generierung fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ausbildungsnachweis_${schueler.vorname}_${schueler.nachname}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Fehler beim Herunterladen des Ausbildungsnachweises.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-primary)]" />
      </div>
    );
  }

  if (!schueler) {
    return <div className="text-center text-[var(--c-muted)] py-12">Schüler nicht gefunden.</div>;
  }

  const currentStatusIdx = STATUS_STEPS.findIndex((s) => s.key === schueler.status);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/schueler" className="p-2 rounded-lg hover:bg-[var(--c-surface-light)] text-[var(--c-muted)]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--c-foreground)]">
            {schueler.vorname as string} {schueler.nachname as string}
          </h1>
          <p className="text-sm text-[var(--c-muted)]">
            Klasse {schueler.fuehrerscheinklasse as string} &middot; {schueler.email as string} &middot; {schueler.telefon as string}
          </p>
        </div>
        <button
          onClick={handleDownloadAusbildungsnachweis}
          disabled={downloadingPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--c-border)] text-sm text-[var(--c-muted)] hover:text-[var(--c-foreground)] transition-colors disabled:opacity-50"
          title="Ausbildungsnachweis herunterladen"
        >
          <Download size={16} />
          {downloadingPdf ? "Wird erstellt..." : "Ausbildungsnachweis"}
        </button>
        <button
          onClick={() => {
            if (editing) {
              handleSave();
            } else {
              setEditData({
                vorname: schueler.vorname as string,
                nachname: schueler.nachname as string,
                email: schueler.email as string,
                telefon: schueler.telefon as string,
                notizen: (schueler.notizen as string) || "",
              });
              setEditing(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--c-border)] text-sm text-[var(--c-muted)] hover:text-[var(--c-foreground)] transition-colors"
        >
          {editing ? <><Save size={16} /> Speichern</> : <><Edit3 size={16} /> Bearbeiten</>}
        </button>
        {editing && (
          <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-[var(--c-surface-light)] text-[var(--c-muted)]">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] grid grid-cols-2 gap-3">
          <input value={editData.vorname || ""} onChange={(e) => setEditData({ ...editData, vorname: e.target.value })} placeholder="Vorname" className="px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]" />
          <input value={editData.nachname || ""} onChange={(e) => setEditData({ ...editData, nachname: e.target.value })} placeholder="Nachname" className="px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]" />
          <input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="E-Mail" className="px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]" />
          <input value={editData.telefon || ""} onChange={(e) => setEditData({ ...editData, telefon: e.target.value })} placeholder="Telefon" className="px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]" />
          <textarea value={editData.notizen || ""} onChange={(e) => setEditData({ ...editData, notizen: e.target.value })} placeholder="Notizen" className="col-span-2 px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] h-20 resize-none" />
        </div>
      )}

      {/* Status Pipeline */}
      <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
        <h3 className="text-sm font-medium text-[var(--c-muted)] mb-3">Ausbildungs-Status</h3>
        <div className="flex items-center gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const isActive = idx <= currentStatusIdx;
            const isCurrent = step.key === schueler.status;
            return (
              <button
                key={step.key}
                onClick={() => handleStatusChange(step.key)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors text-center ${
                  isCurrent
                    ? "bg-[var(--c-primary)] text-white"
                    : isActive
                    ? "bg-[var(--c-primary)]/20 text-[var(--c-primary)]"
                    : "bg-[var(--c-surface-light)] text-[var(--c-muted)] hover:bg-[var(--c-surface-lighter)]"
                }`}
              >
                {isCurrent && <CheckCircle size={12} className="inline mr-1" />}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prüfungsreife + DSGVO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prüfungsreife Badge */}
        {pruefungsreife && (
          <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[var(--c-foreground)] flex items-center gap-2">
                <Award size={16} />
                Prüfungsreife-Check
              </h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                pruefungsreife.pruefungsreif
                  ? "bg-green-500/20 text-green-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}>
                {pruefungsreife.pruefungsreif ? "Prüfungsreif" : "Noch nicht bereit"}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-3 rounded-full bg-[var(--c-surface-lighter)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (pruefungsreife.score as number) >= 80 ? "bg-green-500" : (pruefungsreife.score as number) >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${pruefungsreife.score}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[var(--c-foreground)]">{pruefungsreife.score as number}%</span>
            </div>
            <p className="text-xs text-[var(--c-muted)]">{pruefungsreife.empfehlung as string}</p>
          </div>
        )}

        {/* DSGVO Einwilligungen */}
        <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--c-foreground)] flex items-center gap-2">
              <Shield size={16} />
              DSGVO & Einwilligungen
            </h3>
            <button
              onClick={() => setShowDsgvo(!showDsgvo)}
              className="text-xs text-[var(--c-primary)] hover:underline"
            >
              {showDsgvo ? "Schließen" : "Verwalten"}
            </button>
          </div>
          <div className="flex gap-3">
            <span className={`text-xs px-2 py-1 rounded ${schueler?.whatsapp_einwilligung ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              WhatsApp {schueler?.whatsapp_einwilligung ? "OK" : "Nein"}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${schueler?.email_einwilligung ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              E-Mail {schueler?.email_einwilligung ? "OK" : "Nein"}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${schueler?.dsgvo_einwilligung ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              DSGVO {schueler?.dsgvo_einwilligung ? "OK" : "Nein"}
            </span>
          </div>
          {showDsgvo && (
            <div className="mt-3 space-y-2 pt-3 border-t border-[var(--c-border)]">
              {(["whatsapp_einwilligung", "email_einwilligung", "dsgvo_einwilligung"] as const).map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm text-[var(--c-foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!schueler?.[field]}
                    onChange={async () => {
                      await supabase.from("schueler").update({
                        [field]: !schueler?.[field],
                        ...(field === "dsgvo_einwilligung" && !schueler?.[field] ? { dsgvo_einwilligung_datum: new Date().toISOString() } : {}),
                      }).eq("id", id);
                      load();
                    }}
                    className="rounded"
                  />
                  {field === "whatsapp_einwilligung" && "WhatsApp-Kommunikation"}
                  {field === "email_einwilligung" && "E-Mail-Kommunikation"}
                  {field === "dsgvo_einwilligung" && "DSGVO-Einwilligung"}
                </label>
              ))}
              <div className="pt-2">
                <button
                  onClick={async () => {
                    if (confirm("Alle Daten dieses Schülers DSGVO-konform löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
                      await fetch("/api/crm/dsgvo", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ schuelerId: id, confirm: true }),
                      });
                      window.location.href = "/dashboard/schueler";
                    }
                  }}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                  DSGVO-konform löschen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--c-border)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--c-primary)] text-[var(--c-primary)]"
                  : "border-transparent text-[var(--c-muted)] hover:text-[var(--c-foreground)]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span className="text-xs bg-[var(--c-surface-light)] px-1.5 py-0.5 rounded">
                {activeTab === tab.id ? tabData.length : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
        {tabData.length === 0 ? (
          <div className="p-8 text-center text-[var(--c-muted)]">
            <User size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine {TABS.find((t) => t.id === activeTab)?.label} vorhanden.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {activeTab === "fahrstunden" &&
                tabData.map((r) => (
                  <tr key={r.id as string} className="border-b border-[var(--c-border)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--c-foreground)]">
                      {new Date(r.datum as string).toLocaleDateString("de-DE")} um {r.uhrzeit as string}
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">{r.dauer as number} Min</td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">{r.typ as string}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${r.status === "abgeschlossen" ? "bg-green-500/20 text-green-400" : r.status === "abgesagt" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {r.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">
                      {r.bewertung ? `${"★".repeat(r.bewertung as number)}${"☆".repeat(5 - (r.bewertung as number))}` : "—"}
                    </td>
                  </tr>
                ))}
              {activeTab === "zahlungen" &&
                tabData.map((r) => (
                  <tr key={r.id as string} className="border-b border-[var(--c-border)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--c-foreground)]">{r.beschreibung as string}</td>
                    <td className="px-4 py-3 font-bold">{new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(r.betrag))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${r.status === "bezahlt" ? "bg-green-500/20 text-green-400" : r.status === "ueberfaellig" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"}`}>
                        {r.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)] text-xs">
                      Fällig: {new Date(r.faellig_am as string).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))}
              {activeTab === "dokumente" &&
                tabData.map((r) => (
                  <tr key={r.id as string} className="border-b border-[var(--c-border)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--c-foreground)]">{r.typ as string}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${r.vorhanden ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {r.vorhanden ? "Vorhanden" : "Fehlend"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)] text-xs">
                      {r.ablauf_datum ? `Ablauf: ${new Date(r.ablauf_datum as string).toLocaleDateString("de-DE")}` : "—"}
                    </td>
                  </tr>
                ))}
              {activeTab === "pruefungen" &&
                tabData.map((r) => (
                  <tr key={r.id as string} className="border-b border-[var(--c-border)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--c-foreground)]">
                      {new Date(r.datum as string).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3">{r.typ as string}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${r.ergebnis === "bestanden" ? "bg-green-500/20 text-green-400" : r.ergebnis === "nicht_bestanden" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {(r.ergebnis as string) || "Ausstehend"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">
                      {r.fehlerpunkte !== null ? `${r.fehlerpunkte} Fehlerpunkte` : "—"}
                    </td>
                  </tr>
                ))}
              {activeTab === "kommunikation" &&
                tabData.map((r) => (
                  <tr key={r.id as string} className="border-b border-[var(--c-border)]/50">
                    <td className="px-4 py-3 text-xs text-[var(--c-muted)]">
                      {new Date(r.datum as string).toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-[var(--c-surface-light)]">{r.kanal as string}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{r.richtung as string}</td>
                    <td className="px-4 py-3 text-sm text-[var(--c-foreground)]">{r.inhalt as string}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
