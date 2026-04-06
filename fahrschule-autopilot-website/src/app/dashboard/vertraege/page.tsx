"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { FileText, Plus, Download, Send } from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";

const statusColors: Record<string, string> = {
  entwurf: "bg-gray-500/20 text-gray-400",
  gesendet: "bg-orange-500/20 text-orange-400",
  unterschrieben: "bg-green-500/20 text-green-400",
};

const vertragstypLabels: Record<string, string> = {
  ausbildungsvertrag: "Ausbildungsvertrag",
  dsgvo_einwilligung: "DSGVO Einwilligung",
};

interface Vertrag {
  id: string;
  vertragstyp: string;
  status: string;
  created_at: string;
  unterschrieben_am: string | null;
  schueler: { vorname: string; nachname: string } | null;
}

export default function VertraegePage() {
  const [vertraege, setVertraege] = useState<Vertrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [schuelerList, setSchuelerList] = useState<Array<{ id: string; vorname: string; nachname: string }>>([]);
  const [newVertrag, setNewVertrag] = useState({ schuelerId: "", vertragstyp: "ausbildungsvertrag" });
  const [creating, setCreating] = useState(false);
  const supabase = createClient();
  const tenantId = useTenantId();
  const { addToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("vertraege")
      .select("id, vertragstyp, status, created_at, unterschrieben_am, schueler(vorname, nachname)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    setVertraege((data || []) as unknown as Vertrag[]);
    setLoading(false);
  }, [supabase, tenantId]);

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useEffect(() => { loadRef.current(); }, []);

  const loadSchueler = async () => {
    const { data } = await supabase
      .from("schueler")
      .select("id, vorname, nachname")
      .eq("tenant_id", tenantId)
      .order("nachname");
    setSchuelerList((data || []) as Array<{ id: string; vorname: string; nachname: string }>);
  };

  const handleCreate = async () => {
    if (!newVertrag.schuelerId) {
      addToast("error", "Bitte Schüler auswählen.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/crm/vertrag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          schuelerId: newVertrag.schuelerId,
          vertragstyp: newVertrag.vertragstyp,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        addToast("error", err.error || "Fehler beim Erstellen.");
      } else {
        addToast("success", "Vertrag erstellt.");
        setShowCreate(false);
        setNewVertrag({ schuelerId: "", vertragstyp: "ausbildungsvertrag" });
        load();
      }
    } catch {
      addToast("error", "Fehler beim Erstellen.");
    } finally {
      setCreating(false);
    }
  };

  const sendVertrag = async (id: string) => {
    const res = await fetch("/api/crm/vertrag", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tenantId, status: "gesendet" }),
    });
    if (res.ok) {
      addToast("success", "Vertrag als gesendet markiert.");
      load();
    } else {
      addToast("error", "Fehler beim Senden.");
    }
  };

  const downloadPdf = async (vertragId: string) => {
    const url = `/api/crm/vertrag/pdf?vertragId=${vertragId}&tenantId=${tenantId}`;
    const res = await fetch(url);
    if (!res.ok) {
      addToast("error", "Fehler beim PDF-Download.");
      return;
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `Vertrag_${vertragId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Verträge</h1>
        <button
          onClick={() => { setShowCreate(true); loadSchueler(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--c-primary)] text-white text-sm font-medium hover:bg-[var(--c-primary-dark)] transition-colors"
        >
          <Plus size={16} /> Vertrag erstellen
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] space-y-4">
          <h2 className="text-lg font-semibold text-[var(--c-foreground)]">Neuen Vertrag erstellen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--c-muted)] mb-1">Schüler</label>
              <select
                value={newVertrag.schuelerId}
                onChange={(e) => setNewVertrag({ ...newVertrag, schuelerId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)]"
              >
                <option value="">Bitte wählen...</option>
                {schuelerList.map((s) => (
                  <option key={s.id} value={s.id}>{s.vorname} {s.nachname}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--c-muted)] mb-1">Vertragstyp</label>
              <select
                value={newVertrag.vertragstyp}
                onChange={(e) => setNewVertrag({ ...newVertrag, vertragstyp: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)]"
              >
                <option value="ausbildungsvertrag">Ausbildungsvertrag</option>
                <option value="dsgvo_einwilligung">DSGVO Einwilligung</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-[var(--c-primary)] text-white text-sm font-medium hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50"
            >
              {creating ? "Erstelle..." : "Erstellen"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-muted)] text-sm hover:text-[var(--c-foreground)] transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
        {loading ? (
          <div className="animate-pulse">
            <div className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)] px-4 py-3 flex gap-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-[var(--c-border)] rounded flex-1" />)}
            </div>
            {[1,2,3].map(i => (
              <div key={i} className="border-b border-[var(--c-border)]/50 px-4 py-4 flex gap-4">
                {[1,2,3,4,5].map(j => <div key={j} className="h-3 bg-[var(--c-border)]/50 rounded flex-1" />)}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Schüler</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Vertragstyp</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Datum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vertraege.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--c-muted)]">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  Keine Verträge vorhanden.
                </td></tr>
              ) : (
                vertraege.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--c-border)]/50 hover:bg-[var(--c-surface-light)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--c-foreground)]">
                      {v.schueler?.vorname} {v.schueler?.nachname}
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">
                      {vertragstypLabels[v.vertragstyp] || v.vertragstyp}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[v.status] || ""}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)] text-xs">
                      {new Date(v.created_at).toLocaleDateString("de-DE")}
                      {v.unterschrieben_am && (
                        <span className="block text-green-400">
                          Unterschrieben: {new Date(v.unterschrieben_am).toLocaleDateString("de-DE")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {v.status === "entwurf" && (
                          <button
                            onClick={() => sendVertrag(v.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                          >
                            <Send size={12} /> Senden
                          </button>
                        )}
                        {v.status === "unterschrieben" && (
                          <button
                            onClick={() => downloadPdf(v.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <Download size={12} /> Als PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
