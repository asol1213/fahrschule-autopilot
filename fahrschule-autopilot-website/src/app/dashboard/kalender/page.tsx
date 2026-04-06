"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTenantId } from "@/components/dashboard/TenantContext";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 - 19:00
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(diff + i);
    return dt;
  });
}

const typColors: Record<string, string> = {
  normal: "bg-blue-500/30 border-blue-500 text-blue-300",
  sonderfahrt_ueberlandfahrt: "bg-purple-500/30 border-purple-500 text-purple-300",
  sonderfahrt_autobahnfahrt: "bg-cyan-500/30 border-cyan-500 text-cyan-300",
  sonderfahrt_nachtfahrt: "bg-indigo-500/30 border-indigo-500 text-indigo-300",
  pruefungsvorbereitung: "bg-yellow-500/30 border-yellow-500 text-yellow-300",
};

interface Fahrstunde {
  id: string;
  datum: string;
  uhrzeit: string;
  dauer: number;
  typ: string;
  status: string;
  schueler: { vorname: string; nachname: string } | null;
  fahrlehrer: { vorname: string; nachname: string } | null;
}

export default function KalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fahrstunden, setFahrstunden] = useState<Fahrstunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [schuelerList, setSchuelerList] = useState<Array<{ id: string; vorname: string; nachname: string }>>([]);
  const [fahrlehrerList, setFahrlehrerList] = useState<Array<{ id: string; vorname: string; nachname: string }>>([]);
  const tenantId = useTenantId();
  const supabase = createClient();
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const tid = tenantId;

    const von = weekDates[0].toISOString().split("T")[0];
    const bis = weekDates[5].toISOString().split("T")[0];

    const [{ data: fs }, { data: sl }, { data: fl }] = await Promise.all([
      supabase.from("fahrstunden").select("*, schueler(vorname, nachname), fahrlehrer(vorname, nachname)").eq("tenant_id", tid).gte("datum", von).lte("datum", bis).order("uhrzeit"),
      supabase.from("schueler").select("id, vorname, nachname").eq("tenant_id", tid).neq("status", "bestanden").neq("status", "abgebrochen"),
      supabase.from("fahrlehrer").select("id, vorname, nachname").eq("tenant_id", tid).eq("aktiv", true),
    ]);

    setFahrstunden((fs || []) as unknown as Fahrstunde[]);
    setSchuelerList(sl || []);
    setFahrlehrerList(fl || []);
    setLoading(false);
  }, [supabase, weekDates, tenantId]);

  const loadDataRef = useRef(loadData);
  useEffect(() => { loadDataRef.current = loadData; }, [loadData]);

  useEffect(() => { loadDataRef.current(); }, [weekDates]);

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const toToday = () => setCurrentDate(new Date());

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await supabase.from("fahrstunden").insert({
      tenant_id: tenantId,
      schueler_id: form.get("schueler_id"),
      fahrlehrer_id: form.get("fahrlehrer_id") || null,
      datum: form.get("datum"),
      uhrzeit: form.get("uhrzeit"),
      dauer: Number(form.get("dauer")),
      typ: form.get("typ"),
    });
    setShowAddModal(false);
    loadData();
  };

  const formatWeekRange = () => {
    const start = weekDates[0].toLocaleDateString("de-DE", { day: "numeric", month: "short" });
    const end = weekDates[5].toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
    return `${start} — ${end}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--c-foreground)]">Kalender</h1>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--c-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--c-primary-dark)] transition-colors">
          <Plus size={16} /> Neue Fahrstunde
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-4">
        <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-[var(--c-surface-light)] text-[var(--c-muted)]"><ChevronLeft size={20} /></button>
        <button onClick={toToday} className="px-3 py-1.5 rounded-lg border border-[var(--c-border)] text-sm text-[var(--c-muted)] hover:text-[var(--c-foreground)]">Heute</button>
        <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-[var(--c-surface-light)] text-[var(--c-muted)]"><ChevronRight size={20} /></button>
        <span className="text-sm font-medium text-[var(--c-foreground)]">{formatWeekRange()}</span>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-primary)]" />
          </div>
        ) : (
          <div className="grid grid-cols-[60px_repeat(6,1fr)]">
            {/* Header */}
            <div className="border-b border-[var(--c-border)] bg-[var(--c-surface-light)] p-2" />
            {weekDates.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`border-b border-l border-[var(--c-border)] p-2 text-center ${isToday ? "bg-[var(--c-primary)]/10" : "bg-[var(--c-surface-light)]"}`}>
                  <p className="text-xs text-[var(--c-muted)]">{DAYS[i]}</p>
                  <p className={`text-sm font-medium ${isToday ? "text-[var(--c-primary)]" : "text-[var(--c-foreground)]"}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}

            {/* Time slots */}
            {HOURS.map((hour) => (
              <React.Fragment key={`hour-${hour}`}>
                <div className="border-b border-[var(--c-border)] p-1 text-xs text-[var(--c-muted)] text-right pr-2">
                  {hour}:00
                </div>
                {weekDates.map((d, dayIdx) => {
                  const dateStr = d.toISOString().split("T")[0];
                  const slots = fahrstunden.filter((f) => f.datum === dateStr && parseInt(f.uhrzeit) === hour);
                  return (
                    <div key={`${hour}-${dayIdx}`} className="border-b border-l border-[var(--c-border)] p-0.5 min-h-[48px] relative">
                      {slots.map((f) => (
                        <div key={f.id} className={`text-xs p-1 rounded border-l-2 mb-0.5 ${typColors[f.typ] || typColors.normal} ${f.status === "abgesagt" ? "opacity-50 line-through" : ""}`}>
                          <p className="font-medium truncate">{f.schueler?.vorname} {f.schueler?.nachname}</p>
                          <p className="opacity-75">{f.uhrzeit} &middot; {f.dauer}m</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Legend + Fahrlehrer Auslastung */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-wrap gap-3 text-xs items-start pt-2">
          {Object.entries(typColors).map(([typ, cls]) => (
            <span key={typ} className={`px-2 py-1 rounded ${cls}`}>
              {typ.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        {/* Fahrlehrer Auslastung */}
        <div className="p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <h3 className="text-sm font-medium text-[var(--c-foreground)] mb-3">Fahrlehrer-Auslastung (diese Woche)</h3>
          <div className="space-y-2">
            {fahrlehrerList.length === 0 ? (
              <p className="text-xs text-[var(--c-muted)]">Keine Fahrlehrer angelegt.</p>
            ) : (
              fahrlehrerList.map((fl) => {
                const flStunden = fahrstunden.filter((f) => f.fahrlehrer?.vorname === fl.vorname && f.fahrlehrer?.nachname === fl.nachname && f.status !== "abgesagt");
                const totalMinutes = flStunden.reduce((s, f) => s + (f.dauer || 45), 0);
                const hours = Math.round(totalMinutes / 60 * 10) / 10;
                const maxHours = 40; // 40h/Woche max
                const pct = Math.min((hours / maxHours) * 100, 100);
                const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500";

                return (
                  <div key={fl.id} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--c-foreground)] w-28 truncate">{fl.vorname} {fl.nachname}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--c-surface-lighter)] overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[var(--c-muted)] w-16 text-right">{hours}h / {maxHours}h</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--c-foreground)]">Neue Fahrstunde</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--c-muted)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <select name="schueler_id" required className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]">
                <option value="">Schüler wählen *</option>
                {schuelerList.map((s) => <option key={s.id} value={s.id}>{s.vorname} {s.nachname}</option>)}
              </select>
              <select name="fahrlehrer_id" className="w-full px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]">
                <option value="">Fahrlehrer (optional)</option>
                {fahrlehrerList.map((f) => <option key={f.id} value={f.id}>{f.vorname} {f.nachname}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input name="datum" type="date" required className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]" />
                <input name="uhrzeit" type="time" required className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="dauer" className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]">
                  <option value="45">45 Min</option>
                  <option value="90">90 Min</option>
                </select>
                <select name="typ" className="px-3 py-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface-light)] text-sm text-[var(--c-foreground)]">
                  <option value="normal">Normal</option>
                  <option value="sonderfahrt_ueberlandfahrt">Überland</option>
                  <option value="sonderfahrt_autobahnfahrt">Autobahn</option>
                  <option value="sonderfahrt_nachtfahrt">Nachtfahrt</option>
                  <option value="pruefungsvorbereitung">Prüfungsvorbereitung</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 rounded-lg border border-[var(--c-border)] px-4 py-2.5 text-sm text-[var(--c-foreground)]">Abbrechen</button>
                <button type="submit" className="flex-1 rounded-lg bg-[var(--c-primary)] px-4 py-2.5 text-sm font-medium text-white">Anlegen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
