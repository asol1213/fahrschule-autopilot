"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { Check, Filter, Download } from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";

function getDefaultDateRange() {
  const now = new Date();
  const von = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const bis = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { von, bis };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

const statusColors: Record<string, string> = {
  offen: "bg-orange-500/20 text-orange-400",
  teilbezahlt: "bg-yellow-500/20 text-yellow-400",
  bezahlt: "bg-green-500/20 text-green-400",
  ueberfaellig: "bg-red-500/20 text-red-400",
  storniert: "bg-gray-500/20 text-gray-400",
};

interface Zahlung {
  id: string;
  betrag: number;
  beschreibung: string;
  status: string;
  faellig_am: string;
  bezahlt_am: string | null;
  mahnungs_stufe: number;
  schueler: { vorname: string; nachname: string } | null;
}

export default function ZahlungenPage() {
  const [zahlungen, setZahlungen] = useState<Zahlung[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [summen, setSummen] = useState({ offen: 0, bezahlt: 0, gesamt: 0 });
  const supabase = createClient();
  const tenantId = useTenantId();
  const { addToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const tid = tenantId;

    let query = supabase.from("zahlungen").select("*, schueler(vorname, nachname)").eq("tenant_id", tid).order("faellig_am", { ascending: false });
    if (filter) query = query.eq("status", filter);

    const { data } = await query;
    const rows = (data || []) as unknown as Zahlung[];
    setZahlungen(rows);

    // Compute sums from all (unfiltered)
    const { data: all } = await supabase.from("zahlungen").select("betrag, status").eq("tenant_id", tid);
    const allRows = all || [];
    setSummen({
      offen: allRows.filter((r) => r.status === "offen" || r.status === "ueberfaellig").reduce((s, r) => s + Number(r.betrag), 0),
      bezahlt: allRows.filter((r) => r.status === "bezahlt").reduce((s, r) => s + Number(r.betrag), 0),
      gesamt: allRows.reduce((s, r) => s + Number(r.betrag), 0),
    });
    setLoading(false);
  }, [supabase, filter, tenantId]);

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => { loadRef.current(); }, [filter]);

  const markAsBezahlt = async (id: string) => {
    const { error } = await supabase.from("zahlungen").update({
      status: "bezahlt",
      bezahlt_am: new Date().toISOString().split("T")[0],
    }).eq("id", id).eq("tenant_id", tenantId);
    if (error) {
      addToast("error", "Fehler beim Markieren als bezahlt.");
    } else {
      addToast("success", "Zahlung als bezahlt markiert.");
    }
    load();
  };

  const downloadExport = async (type: "datev" | "lexoffice") => {
    const { von, bis } = getDefaultDateRange();
    const url = `/api/crm/export/${type}?tenantId=${tenantId}&von=${von}&bis=${bis}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        addToast("error", "Fehler beim Export.");
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = type === "datev" ? `DATEV_Export_${von}_${bis}.csv` : `lexoffice_Export_${von}_${bis}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      addToast("error", "Fehler beim Export.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Zahlungen</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadExport("datev")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-muted)] hover:text-[var(--c-foreground)] hover:border-[var(--c-primary)] transition-colors"
          >
            <Download size={14} /> DATEV Export
          </button>
          <button
            onClick={() => downloadExport("lexoffice")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-muted)] hover:text-[var(--c-foreground)] hover:border-[var(--c-primary)] transition-colors"
          >
            <Download size={14} /> lexoffice Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Offen</p>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(summen.offen)}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Bezahlt</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(summen.bezahlt)}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Gesamt</p>
          <p className="text-2xl font-bold text-[var(--c-foreground)]">{formatCurrency(summen.gesamt)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-[var(--c-muted)]" />
        {["", "offen", "ueberfaellig", "bezahlt", "storniert"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-[var(--c-primary)] text-white" : "bg-[var(--c-surface-light)] text-[var(--c-muted)] hover:text-[var(--c-foreground)]"
            }`}
          >
            {f || "Alle"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
        {loading ? (
          <div className="animate-pulse">
            <div className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)] px-4 py-3 flex gap-4">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-4 bg-[var(--c-border)] rounded flex-1" />)}
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className="border-b border-[var(--c-border)]/50 px-4 py-4 flex gap-4">
                {[1,2,3,4,5,6,7].map(j => <div key={j} className="h-3 bg-[var(--c-border)]/50 rounded flex-1" />)}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Schüler</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Beschreibung</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--c-muted)]">Betrag</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Fällig</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Mahnung</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {zahlungen.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--c-muted)]">Keine Zahlungen vorhanden.</td></tr>
              ) : (
                zahlungen.map((z) => (
                  <tr key={z.id} className="border-b border-[var(--c-border)]/50 hover:bg-[var(--c-surface-light)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--c-foreground)]">
                      {z.schueler?.vorname} {z.schueler?.nachname}
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">{z.beschreibung}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(z.betrag)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[z.status] || ""}`}>{z.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)] text-xs">{new Date(z.faellig_am).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">{z.mahnungs_stufe > 0 ? `Stufe ${z.mahnungs_stufe}` : "—"}</td>
                    <td className="px-4 py-3">
                      {z.status !== "bezahlt" && z.status !== "storniert" && (
                        <button onClick={() => markAsBezahlt(z.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                          <Check size={12} /> Bezahlt
                        </button>
                      )}
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
