"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { Car, Wrench, AlertTriangle, Plus, Check, X, Pencil } from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";

const statusColors: Record<string, string> = {
  aktiv: "bg-green-500/20 text-green-400",
  werkstatt: "bg-orange-500/20 text-orange-400",
  ausgemustert: "bg-gray-500/20 text-gray-400",
};

const statusIcons: Record<string, typeof Car> = {
  aktiv: Car,
  werkstatt: Wrench,
  ausgemustert: AlertTriangle,
};

const statusLabels: Record<string, string> = {
  aktiv: "Aktiv",
  werkstatt: "Werkstatt",
  ausgemustert: "Ausgemustert",
};

interface Fahrzeug {
  id: string;
  kennzeichen: string;
  marke: string;
  modell: string;
  baujahr: number;
  fuehrerscheinklasse: string;
  tuev_bis: string;
  kilometerstand: number;
  status: string;
  notizen: string | null;
}

const emptyForm = {
  kennzeichen: "",
  marke: "",
  modell: "",
  baujahr: new Date().getFullYear(),
  fuehrerscheinklasse: "B",
  tuev_bis: "",
  kilometerstand: 0,
  status: "aktiv",
  notizen: "",
};

function isTuevExpired(tuevBis: string): boolean {
  return new Date(tuevBis) < new Date();
}

function isTuevWarning(tuevBis: string): boolean {
  const diff = new Date(tuevBis).getTime() - new Date().getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

export default function FahrzeugePage() {
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const tenantId = useTenantId();
  const supabase = createClient();
  const { addToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("fahrzeuge")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("kennzeichen");

    setFahrzeuge((data || []) as unknown as Fahrzeug[]);
    setLoading(false);
  }, [supabase, tenantId]);

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useEffect(() => { loadRef.current(); }, []);

  const handleSubmit = async () => {
    if (!tenantId) return;

    if (!form.kennzeichen || !form.marke || !form.modell || !form.tuev_bis) {
      addToast("error", "Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    if (editId) {
      const { error } = await supabase
        .from("fahrzeuge")
        .update({
          kennzeichen: form.kennzeichen,
          marke: form.marke,
          modell: form.modell,
          baujahr: form.baujahr,
          fuehrerscheinklasse: form.fuehrerscheinklasse,
          tuev_bis: form.tuev_bis,
          kilometerstand: form.kilometerstand,
          status: form.status,
          notizen: form.notizen || null,
        })
        .eq("id", editId);

      if (error) {
        addToast("error", "Fehler beim Aktualisieren.");
      } else {
        addToast("success", "Fahrzeug aktualisiert.");
      }
    } else {
      const { error } = await supabase.from("fahrzeuge").insert({
        tenant_id: tenantId,
        kennzeichen: form.kennzeichen,
        marke: form.marke,
        modell: form.modell,
        baujahr: form.baujahr,
        fuehrerscheinklasse: form.fuehrerscheinklasse,
        tuev_bis: form.tuev_bis,
        kilometerstand: form.kilometerstand,
        status: form.status,
        notizen: form.notizen || null,
      });

      if (error) {
        addToast("error", "Fehler beim Anlegen.");
      } else {
        addToast("success", "Fahrzeug angelegt.");
      }
    }

    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    load();
  };

  const startEdit = (f: Fahrzeug) => {
    setEditId(f.id);
    setForm({
      kennzeichen: f.kennzeichen,
      marke: f.marke,
      modell: f.modell,
      baujahr: f.baujahr,
      fuehrerscheinklasse: f.fuehrerscheinklasse,
      tuev_bis: f.tuev_bis,
      kilometerstand: f.kilometerstand,
      status: f.status,
      notizen: f.notizen || "",
    });
    setShowForm(true);
  };

  const deleteFahrzeug = async (id: string) => {
    if (!window.confirm("Fahrzeug wirklich löschen?")) return;

    const { error } = await supabase
      .from("fahrzeuge")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      addToast("error", "Fehler beim Löschen.");
    } else {
      addToast("success", "Fahrzeug gelöscht.");
    }
    load();
  };

  const counts = {
    aktiv: fahrzeuge.filter((f) => f.status === "aktiv").length,
    werkstatt: fahrzeuge.filter((f) => f.status === "werkstatt").length,
    ausgemustert: fahrzeuge.filter((f) => f.status === "ausgemustert").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Fahrzeuge</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--c-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Fahrzeug hinzufügen
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Aktiv</p>
          <p className="text-2xl font-bold text-green-400">{counts.aktiv}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">In Werkstatt</p>
          <p className="text-2xl font-bold text-orange-400">{counts.werkstatt}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <p className="text-sm text-[var(--c-muted)]">Ausgemustert</p>
          <p className="text-2xl font-bold text-gray-400">{counts.ausgemustert}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-5 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] space-y-4">
          <h2 className="text-lg font-semibold text-[var(--c-foreground)]">
            {editId ? "Fahrzeug bearbeiten" : "Neues Fahrzeug"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Kennzeichen *</label>
              <input
                value={form.kennzeichen}
                onChange={(e) => setForm({ ...form, kennzeichen: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
                placeholder="M-AB 1234"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Marke *</label>
              <input
                value={form.marke}
                onChange={(e) => setForm({ ...form, marke: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
                placeholder="VW"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Modell *</label>
              <input
                value={form.modell}
                onChange={(e) => setForm({ ...form, modell: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
                placeholder="Golf 8"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Baujahr</label>
              <input
                type="number"
                value={form.baujahr}
                onChange={(e) => setForm({ ...form, baujahr: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Führerscheinklasse</label>
              <select
                value={form.fuehrerscheinklasse}
                onChange={(e) => setForm({ ...form, fuehrerscheinklasse: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
              >
                {["AM", "A1", "A2", "A", "B", "BE", "C1", "C1E", "C", "CE", "D1", "D1E", "D", "DE", "L", "T"].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">TÜV bis *</label>
              <input
                type="date"
                value={form.tuev_bis}
                onChange={(e) => setForm({ ...form, tuev_bis: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Kilometerstand</label>
              <input
                type="number"
                value={form.kilometerstand}
                onChange={(e) => setForm({ ...form, kilometerstand: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
              >
                <option value="aktiv">Aktiv</option>
                <option value="werkstatt">Werkstatt</option>
                <option value="ausgemustert">Ausgemustert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--c-muted)] mb-1">Notizen</label>
              <input
                value={form.notizen}
                onChange={(e) => setForm({ ...form, notizen: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--c-background)] border border-[var(--c-border)] text-[var(--c-foreground)] text-sm"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--c-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Check size={16} /> {editId ? "Speichern" : "Anlegen"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--c-surface-light)] text-[var(--c-muted)] text-sm font-medium hover:text-[var(--c-foreground)] transition-colors"
            >
              <X size={16} /> Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
        {loading ? (
          <div className="animate-pulse">
            <div className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)] px-4 py-3 flex gap-4">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-4 bg-[var(--c-border)] rounded flex-1" />)}
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className="border-b border-[var(--c-border)]/50 px-4 py-4 flex gap-4">
                {[1,2,3,4,5,6,7,8].map(j => <div key={j} className="h-3 bg-[var(--c-border)]/50 rounded flex-1" />)}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Kennzeichen</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Marke / Modell</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Baujahr</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Klasse</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">TÜV bis</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--c-muted)]">KM-Stand</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {fahrzeuge.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--c-muted)]">Keine Fahrzeuge vorhanden.</td></tr>
              ) : (
                fahrzeuge.map((f) => {
                  const StatusIcon = statusIcons[f.status] || Car;
                  const expired = isTuevExpired(f.tuev_bis);
                  const warning = isTuevWarning(f.tuev_bis);
                  return (
                    <tr key={f.id} className="border-b border-[var(--c-border)]/50 hover:bg-[var(--c-surface-light)]/50">
                      <td className="px-4 py-3 font-mono font-bold text-[var(--c-foreground)]">{f.kennzeichen}</td>
                      <td className="px-4 py-3 text-[var(--c-foreground)]">{f.marke} {f.modell}</td>
                      <td className="px-4 py-3 text-[var(--c-muted)]">{f.baujahr}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{f.fuehrerscheinklasse}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs flex items-center gap-1 ${expired ? "text-red-400 font-bold" : warning ? "text-yellow-400 font-medium" : "text-[var(--c-muted)]"}`}>
                          {(expired || warning) && <AlertTriangle size={12} />}
                          {new Date(f.tuev_bis).toLocaleDateString("de-DE")}
                          {expired && " (abgelaufen)"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--c-muted)]">{f.kilometerstand.toLocaleString("de-DE")} km</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${statusColors[f.status] || ""}`}>
                          <StatusIcon size={12} /> {statusLabels[f.status] || f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(f)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            <Pencil size={12} /> Bearbeiten
                          </button>
                          <button
                            onClick={() => deleteFahrzeug(f.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
