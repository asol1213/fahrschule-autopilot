"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ChevronRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TENANT_MAP: Record<string, { id: string; name: string }> = {
  "fahrschule-mueller": { id: "29decffc-25a6-4bcb-bb36-aac5b83d1887", name: "Fahrschule Müller" },
  "fahrschule-schmidt": { id: "5b177a69-21d5-410e-b2b0-2b7d92bd2d42", name: "Fahrschule Schmidt" },
  "fahrschule-weber": { id: "f748a840-5d56-4dfa-b269-6144d595d5cd", name: "Fahrschule Weber" },
};

const KLASSEN = [
  { value: "B", label: "B — PKW" },
  { value: "B96", label: "B96 — PKW + Anhänger" },
  { value: "BE", label: "BE — PKW + schwerer Anhänger" },
  { value: "A", label: "A — Motorrad unbeschränkt" },
  { value: "A2", label: "A2 — Motorrad bis 35 kW" },
  { value: "A1", label: "A1 — Motorrad bis 125 ccm" },
  { value: "AM", label: "AM — Roller / Moped" },
  { value: "Mofa", label: "Mofa — bis 25 km/h" },
  { value: "L", label: "L — Land-/Forstwirtschaft" },
] as const;

const inputClass =
  "w-full rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

const selectClass =
  "w-full rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WartelisteForm() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("fahrschule") || "";
  const tenant = useMemo(() => TENANT_MAP[tenantSlug] || null, [tenantSlug]);

  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [fuehrerscheinklasse, setFuehrerscheinklasse] = useState("B");
  const [dsgvo, setDsgvo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Wenn keine Fahrschule ausgewählt: Auswahl anzeigen
  if (!tenant) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h2 className="text-xl font-bold mb-2 text-center">Fahrschule wählen</h2>
        <p className="text-sm text-muted text-center mb-6">
          Bei welcher Fahrschule möchten Sie auf die Warteliste?
        </p>
        <div className="space-y-3">
          {Object.entries(TENANT_MAP).map(([slug, t]) => (
            <a
              key={slug}
              href={`/warteliste?fahrschule=${slug}`}
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div>
                <div className="font-semibold text-foreground group-hover:text-primary-light transition-colors">
                  {t.name}
                </div>
                <div className="text-xs text-muted mt-0.5">Auf die Warteliste setzen</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary-light transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12 shadow-2xl shadow-black/20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Sie stehen auf der Warteliste!</h2>
        <p className="text-muted leading-relaxed max-w-sm mx-auto">
          Wir kontaktieren Sie, sobald ein Platz frei wird. Vielen Dank für Ihr Interesse an {tenant.name}!
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/warteliste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vorname: vorname.trim(),
          nachname: nachname.trim(),
          email: email.trim(),
          telefon: telefon.trim(),
          fuehrerscheinklasse,
          tenantId: tenant.id,
          dsgvo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Ein Fehler ist aufgetreten.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMsg("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl shadow-black/20 space-y-5"
    >
      <div className="text-center mb-2">
        <p className="text-sm text-muted">
          Warteliste für <span className="font-semibold text-foreground">{tenant.name}</span>
        </p>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vorname" className="block text-sm font-medium mb-1.5">
            Vorname *
          </label>
          <input
            id="vorname"
            type="text"
            required
            value={vorname}
            onChange={(e) => setVorname(e.target.value)}
            placeholder="Max"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="nachname" className="block text-sm font-medium mb-1.5">
            Nachname *
          </label>
          <input
            id="nachname"
            type="text"
            required
            value={nachname}
            onChange={(e) => setNachname(e.target.value)}
            placeholder="Mustermann"
            className={inputClass}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          E-Mail *
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="max@beispiel.de"
          className={inputClass}
        />
      </div>

      {/* Telefon */}
      <div>
        <label htmlFor="telefon" className="block text-sm font-medium mb-1.5">
          Telefon *
        </label>
        <input
          id="telefon"
          type="tel"
          required
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          placeholder="0170 1234567"
          className={inputClass}
        />
      </div>

      {/* Führerscheinklasse */}
      <div>
        <label htmlFor="klasse" className="block text-sm font-medium mb-1.5">
          Führerscheinklasse *
        </label>
        <select
          id="klasse"
          required
          value={fuehrerscheinklasse}
          onChange={(e) => setFuehrerscheinklasse(e.target.value)}
          className={selectClass}
        >
          {KLASSEN.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      {/* DSGVO */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          required
          checked={dsgvo}
          onChange={(e) => setDsgvo(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-xs text-muted leading-relaxed">
          Ich willige ein, dass meine Daten zum Zweck der Kontaktaufnahme gespeichert und verarbeitet
          werden. Die Daten werden nicht an Dritte weitergegeben. Ich kann meine Einwilligung jederzeit
          widerrufen. *
        </span>
      </label>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !dsgvo}
        className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Wird gesendet...
          </>
        ) : (
          "Auf die Warteliste setzen"
        )}
      </button>
    </form>
  );
}
