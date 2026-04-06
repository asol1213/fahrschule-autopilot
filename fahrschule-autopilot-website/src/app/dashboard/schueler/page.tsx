"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { Search, Plus, Filter, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/dashboard/Toast";

const STATUS_OPTIONS = [
  { value: "", label: "Alle Status" },
  { value: "angemeldet", label: "Angemeldet" },
  { value: "dokumente_ausstehend", label: "Dokumente ausstehend" },
  { value: "theorie", label: "Theorie" },
  { value: "praxis", label: "Praxis" },
  { value: "pruefung", label: "Prüfung" },
  { value: "bestanden", label: "Bestanden" },
  { value: "abgebrochen", label: "Abgebrochen" },
];

const statusColors: Record<string, string> = {
  angemeldet: "bg-blue-500/20 text-blue-400",
  dokumente_ausstehend: "bg-orange-500/20 text-orange-400",
  theorie: "bg-purple-500/20 text-purple-400",
  praxis: "bg-cyan-500/20 text-cyan-400",
  pruefung: "bg-yellow-500/20 text-yellow-400",
  bestanden: "bg-green-500/20 text-green-400",
  abgebrochen: "bg-red-500/20 text-red-400",
};

interface Schueler {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  fuehrerscheinklasse: string;
  status: string;
  created_at: string;
  fahrlehrer: { vorname: string; nachname: string } | null;
}

export default function SchuelerPage() {
  const [schueler, setSchueler] = useState<Schueler[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(searchParams.get("neu") === "1");
  const supabase = createClient();
  const tenantId = useTenantId();
  const { addToast } = useToast();

  // Open modal when searchParams change to include neu=1
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);
  if (prevSearchParams !== searchParams) {
    setPrevSearchParams(searchParams);
    if (searchParams.get("neu") === "1") setShowAddModal(true);
  }

  const loadSchueler = useCallback(async () => {
    setLoading(true);
    const tid = tenantId;

    let query = supabase
      .from("schueler")
      .select("id, vorname, nachname, email, telefon, fuehrerscheinklasse, status, created_at, fahrlehrer(vorname, nachname)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);
    if (search) query = query.or(`vorname.ilike.%${search}%,nachname.ilike.%${search}%,email.ilike.%${search}%`);

    const { data } = await query;
    setSchueler((data as unknown as Schueler[]) || []);
    setLoading(false);
  }, [supabase, statusFilter, search, tenantId]);

  const loadSchuelerRef = useRef(loadSchueler);
  useEffect(() => { loadSchuelerRef.current = loadSchueler; }, [loadSchueler]);

  useEffect(() => {
    loadSchuelerRef.current();
  }, [statusFilter, search]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const { error } = await supabase.from("schueler").insert({
      tenant_id: tenantId,
      vorname: form.get("vorname") as string,
      nachname: form.get("nachname") as string,
      email: form.get("email") as string,
      telefon: form.get("telefon") as string,
      geburtsdatum: form.get("geburtsdatum") as string,
      fuehrerscheinklasse: form.get("fuehrerscheinklasse") as string,
      adresse: form.get("adresse") as string,
      plz: form.get("plz") as string,
      ort: form.get("ort") as string,
    });

    if (error) {
      addToast("error", `Fehler beim Anlegen: ${error.message}`);
      return;
    }

    addToast("success", `${form.get("vorname")} ${form.get("nachname")} wurde angelegt.`);
    setShowAddModal(false);
    loadSchueler();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Schüler</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--c-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--c-primary-dark)] transition-colors"
        >
          <Plus size={16} /> Neuer Schüler
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)]" size={16} />
          <input
            type="text"
            placeholder="Schüler suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)]" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-sm text-[var(--c-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] appearance-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
        {loading ? (
          <div className="animate-pulse">
            <div className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)] px-4 py-3 flex gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-4 bg-[var(--c-border)] rounded flex-1" />)}
            </div>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="border-b border-[var(--c-border)]/50 px-4 py-4 flex gap-4">
                {[1,2,3,4,5,6].map(j => <div key={j} className="h-3 bg-[var(--c-border)]/50 rounded flex-1" />)}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Name</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Klasse</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Fahrlehrer</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Kontakt</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--c-muted)]">Anmeldung</th>
              </tr>
            </thead>
            <tbody>
              {schueler.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--c-muted)]">
                    {search || statusFilter ? "Keine Ergebnisse gefunden." : "Noch keine Schüler vorhanden."}
                  </td>
                </tr>
              ) : (
                schueler.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--c-border)]/50 hover:bg-[var(--c-surface-light)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/schueler/${s.id}`} className="font-medium text-[var(--c-foreground)] hover:text-[var(--c-primary)]">
                        {s.vorname} {s.nachname}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--c-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--c-primary)]">
                        {s.fuehrerscheinklasse}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[s.status] || "bg-gray-500/20 text-gray-400"}`}>
                        {STATUS_OPTIONS.find((o) => o.value === s.status)?.label || s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)]">
                      {s.fahrlehrer ? `${s.fahrlehrer.vorname} ${s.fahrlehrer.nachname}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--c-muted)] text-xs">{s.email}</td>
                    <td className="px-4 py-3 text-[var(--c-muted)] text-xs">
                      {new Date(s.created_at).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--c-foreground)]">Neuen Schüler anlegen</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--c-muted)] hover:text-[var(--c-foreground)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="vorname" placeholder="Vorname *" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)]" />
                <input name="nachname" placeholder="Nachname *" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)]" />
              </div>
              <input name="email" type="email" placeholder="E-Mail *" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)]" />
              <input name="telefon" placeholder="Telefon *" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)]" />
              <input name="geburtsdatum" type="date" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] focus:outline-none focus:border-[var(--c-primary)]" />
              <div className="grid grid-cols-3 gap-3">
                <input name="adresse" placeholder="Straße" className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)]" />
                <input name="plz" placeholder="PLZ" className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)]" />
                <input name="ort" placeholder="Ort" className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] placeholder:text-[var(--c-muted)] focus:outline-none focus:border-[var(--c-primary)]" />
              </div>
              <select name="fuehrerscheinklasse" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)] focus:outline-none focus:border-[var(--c-primary)]">
                <option value="B">Klasse B</option>
                <option value="B96">Klasse B96</option>
                <option value="BE">Klasse BE</option>
                <option value="A">Klasse A</option>
                <option value="A2">Klasse A2</option>
                <option value="A1">Klasse A1</option>
                <option value="AM">Klasse AM</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 rounded-lg border border-[var(--c-border)] px-4 py-2.5 text-sm hover:bg-[var(--c-surface-light)] transition-colors text-[var(--c-foreground)]">
                  Abbrechen
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-[var(--c-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--c-primary-dark)] transition-colors">
                  Anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
