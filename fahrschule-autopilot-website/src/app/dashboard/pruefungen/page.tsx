"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { Plus, X } from "lucide-react";

export default function PruefungenPage() {
  const [pruefungen, setPruefungen] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, bestanden: 0, quote: 0, theorieQuote: 0, praxisQuote: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [schuelerList, setSchuelerList] = useState<Array<{ id: string; vorname: string; nachname: string }>>([]);
  const tenantId = useTenantId();
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: rows }, { data: sl }] = await Promise.all([
      supabase.from("pruefungen").select("*, schueler(vorname, nachname)").eq("tenant_id", tenantId).order("datum", { ascending: false }),
      supabase.from("schueler").select("id, vorname, nachname").eq("tenant_id", tenantId),
    ]);

    const allP = (rows || []) as Record<string, unknown>[];
    setPruefungen(allP);
    setSchuelerList(sl || []);

    const withResult = allP.filter((p) => p.ergebnis);
    const bestanden = withResult.filter((p) => p.ergebnis === "bestanden").length;
    const theorie = withResult.filter((p) => p.typ === "theorie");
    const praxis = withResult.filter((p) => p.typ === "praxis");

    setStats({
      total: allP.length,
      bestanden,
      quote: withResult.length > 0 ? Math.round((bestanden / withResult.length) * 100) : 0,
      theorieQuote: theorie.length > 0 ? Math.round((theorie.filter((p) => p.ergebnis === "bestanden").length / theorie.length) * 100) : 0,
      praxisQuote: praxis.length > 0 ? Math.round((praxis.filter((p) => p.ergebnis === "bestanden").length / praxis.length) * 100) : 0,
    });
    setLoading(false);
  }, [supabase, tenantId]);

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => { loadRef.current(); }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await supabase.from("pruefungen").insert({
      tenant_id: tenantId,
      schueler_id: form.get("schueler_id"),
      typ: form.get("typ"),
      datum: form.get("datum"),
      ergebnis: form.get("ergebnis") || null,
      fehlerpunkte: form.get("fehlerpunkte") ? Number(form.get("fehlerpunkte")) : null,
      notizen: form.get("notizen") || null,
    });
    setShowAdd(false);
    load();
  };

  const updateErgebnis = async (id: string, ergebnis: string) => {
    await supabase.from("pruefungen").update({ ergebnis }).eq("id", id).eq("tenant_id", tenantId);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Prüfungen</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--c-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--c-primary-dark)] transition-colors">
          <Plus size={16} /> Neue Prüfung
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Gesamt</p>
          <p className="text-2xl font-bold text-[var(--c-foreground)]">{stats.total}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Bestehensquote</p>
          <p className="text-2xl font-bold text-green-400">{stats.quote}%</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Theorie-Quote</p>
          <p className="text-2xl font-bold text-purple-400">{stats.theorieQuote}%</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Praxis-Quote</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.praxisQuote}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-primary)]" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Datum</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Schüler</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Typ</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Ergebnis</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Fehlerpunkte</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pruefungen.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--c-muted)]">Keine Prüfungen vorhanden.</td></tr>
              ) : (
                pruefungen.map((p) => {
                  const schueler = p.schueler as Record<string, string> | null;
                  return (
                    <tr key={p.id as string} className="border-b border-[var(--c-border)]/50 hover:bg-[var(--c-surface-light)]/50">
                      <td className="px-4 py-3 text-[var(--c-foreground)]">{new Date(p.datum as string).toLocaleDateString("de-DE")}</td>
                      <td className="px-4 py-3 font-medium text-[var(--c-foreground)]">{schueler?.vorname} {schueler?.nachname}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${p.typ === "theorie" ? "bg-purple-500/20 text-purple-400" : "bg-cyan-500/20 text-cyan-400"}`}>
                          {p.typ as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.ergebnis ? (
                          <span className={`text-xs px-2.5 py-1 rounded-full ${p.ergebnis === "bestanden" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {p.ergebnis as string}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--c-muted)]">Ausstehend</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--c-muted)]">{p.fehlerpunkte !== null ? p.fehlerpunkte as number : "—"}</td>
                      <td className="px-4 py-3">
                        {!p.ergebnis && (
                          <div className="flex gap-1">
                            <button onClick={() => updateErgebnis(p.id as string, "bestanden")} className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30">Bestanden</button>
                            <button onClick={() => updateErgebnis(p.id as string, "nicht_bestanden")} className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30">Nicht bestanden</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--c-foreground)]">Neue Prüfung</h2>
              <button onClick={() => setShowAdd(false)} className="text-[var(--c-muted)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <select name="schueler_id" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]">
                <option value="">Schüler wählen *</option>
                {schuelerList.map((s) => <option key={s.id} value={s.id}>{s.vorname} {s.nachname}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select name="typ" required className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]">
                  <option value="theorie">Theorie</option>
                  <option value="praxis">Praxis</option>
                </select>
                <input name="datum" type="date" required className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="ergebnis" className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]">
                  <option value="">Ergebnis (optional)</option>
                  <option value="bestanden">Bestanden</option>
                  <option value="nicht_bestanden">Nicht bestanden</option>
                </select>
                <input name="fehlerpunkte" type="number" min="0" placeholder="Fehlerpunkte" className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)]" />
              </div>
              <textarea name="notizen" placeholder="Notizen (optional)" className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] h-20 resize-none" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-[var(--c-border)] px-4 py-2.5 text-sm text-[var(--c-foreground)]">Abbrechen</button>
                <button type="submit" className="flex-1 rounded-lg bg-[var(--c-primary)] px-4 py-2.5 text-sm font-medium text-white">Anlegen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
