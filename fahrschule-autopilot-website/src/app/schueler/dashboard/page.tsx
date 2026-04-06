"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  FileCheck,
  CreditCard,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ExternalLink,
} from "lucide-react";

/* ---------- types ---------- */

interface Fahrlehrer {
  vorname: string;
  nachname: string;
}

interface SchuelerData {
  id: string;
  vorname: string;
  nachname: string;
  fuehrerscheinklasse: string;
  status: string;
  created_at: string;
  fahrlehrer: Fahrlehrer | null;
  tenant_id: string;
}

interface Fahrstunde {
  id: string;
  datum: string;
  uhrzeit: string;
  dauer: number;
  typ: string;
  status: string;
  fahrlehrer: Fahrlehrer | null;
}

interface Dokument {
  id: string;
  typ: string;
  vorhanden: boolean;
  ablauf_datum: string | null;
}

interface Zahlung {
  id: string;
  betrag: number;
  beschreibung: string;
  status: string;
  faellig_am: string;
}

interface DashboardData {
  student: { name: string; email: string };
  schueler: SchuelerData | null;
  fahrstunden: Fahrstunde[];
  dokumente: Dokument[];
  zahlungen: Zahlung[];
}

/* ---------- constants ---------- */

const STAGES = [
  { key: "angemeldet", label: "Angemeldet" },
  { key: "dokumente_ausstehend", label: "Dokumente" },
  { key: "theorie", label: "Theorie" },
  { key: "praxis", label: "Praxis" },
  { key: "pruefung", label: "Pr\u00fcfung" },
  { key: "bestanden", label: "Bestanden" },
] as const;

const DOKUMENT_TYPEN = [
  { typ: "sehtest", label: "Sehtest" },
  { typ: "erste_hilfe", label: "Erste-Hilfe-Kurs" },
  { typ: "passfoto", label: "Passfoto" },
  { typ: "ausweis", label: "Personalausweis / Pass" },
  { typ: "fuehrerschein_antrag", label: "F\u00fchrerschein-Antrag" },
];

const TYP_LABELS: Record<string, string> = {
  normal: "Normal",
  sonderfahrt_ueberlandfahrt: "\u00dcberlandfahrt",
  sonderfahrt_autobahnfahrt: "Autobahnfahrt",
  sonderfahrt_nachtfahrt: "Nachtfahrt",
  pruefungsvorbereitung: "Pr\u00fcfungsvorbereitung",
};

const DOKUMENT_HILFE_LINKS: Record<string, { label: string; url: string }> = {
  sehtest: {
    label: "Sehtest online buchen",
    url: "https://www.fielmann.de/sehtest/",
  },
  erste_hilfe: {
    label: "Erste-Hilfe-Kurs buchen",
    url: "https://www.erstehilfe.de/",
  },
  passfoto: {
    label: "Passfoto-Service finden",
    url: "https://www.dm.de/services/fotoservice/passbilder",
  },
};

const ZAHLUNG_STATUS_COLORS: Record<string, string> = {
  offen: "bg-orange-500/20 text-orange-400",
  ueberfaellig: "bg-red-500/20 text-red-400",
  bezahlt: "bg-green-500/20 text-green-400",
  teilbezahlt: "bg-yellow-500/20 text-yellow-400",
  storniert: "bg-gray-500/20 text-gray-400",
};

const ZAHLUNG_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  ueberfaellig: "\u00dcberf\u00e4llig",
  bezahlt: "Bezahlt",
  teilbezahlt: "Teilbezahlt",
  storniert: "Storniert",
};

/* ---------- helpers ---------- */

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(t: string): string {
  return t.slice(0, 5) + " Uhr";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/* ---------- component ---------- */

export default function SchuelerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    // Check auth first
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/schueler/login");
      return;
    }

    try {
      const res = await fetch("/api/schueler/meine-daten");
      if (res.status === 401) {
        router.push("/schueler/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Fehler beim Laden der Daten.");
        setLoading(false);
        return;
      }
      const json: DashboardData = await res.json();
      setData(json);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    loadDataRef.current();
  }, []);

  const handleDownloadAusbildungsnachweis = async () => {
    if (!data?.schueler) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(
        `/api/crm/ausbildungsnachweis?schuelerId=${data.schueler.id}&tenantId=${data.schueler.tenant_id}`
      );
      if (!res.ok) throw new Error("PDF-Generierung fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ausbildungsnachweis_${data.schueler.vorname}_${data.schueler.nachname}.pdf`;
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

  /* ---------- loading / error states ---------- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-72 rounded bg-[var(--c-border)] animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6"
          >
            <div className="h-5 w-40 rounded bg-[var(--c-border)] animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-[var(--c-border)]/50 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-[var(--c-border)]/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => loadDataRef.current()}
          className="mt-4 rounded-lg bg-[var(--c-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--c-primary-dark)] transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { student, schueler, fahrstunden, dokumente, zahlungen } = data;

  /* ---------- derived values ---------- */

  const currentStageIdx = schueler
    ? STAGES.findIndex((s) => s.key === schueler.status)
    : 0;

  const dokumentMap = new Map(dokumente.map((d) => [d.typ, d]));
  const dokumenteVorhanden = DOKUMENT_TYPEN.filter(
    (dt) => dokumentMap.get(dt.typ)?.vorhanden
  ).length;

  const offeneZahlungen = zahlungen.filter(
    (z) => z.status === "offen" || z.status === "ueberfaellig"
  );
  const offenerBetrag = offeneZahlungen.reduce(
    (sum, z) => sum + Number(z.betrag),
    0
  );

  /* ---------- render ---------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--c-foreground)] flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-[var(--c-primary)]" />
          Mein Ausbildungs-&Uuml;berblick
        </h1>
        <p className="text-[var(--c-muted)] mt-1">
          Hallo{" "}
          <span className="text-[var(--c-foreground)] font-medium">
            {schueler
              ? `${schueler.vorname} ${schueler.nachname}`
              : student.name}
          </span>
          {schueler?.fuehrerscheinklasse && (
            <span>
              {" "}
              &mdash; Klasse {schueler.fuehrerscheinklasse}
            </span>
          )}
        </p>
      </div>

      {/* Section 1: Fortschritt */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--c-foreground)] mb-5">
          Fortschritt
        </h2>

        {/* Progress steps */}
        <div className="flex items-center gap-0">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                {/* Step circle + label */}
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-colors ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-[var(--c-primary)] text-white ring-4 ring-[var(--c-primary)]/20"
                        : "bg-[var(--c-surface-light)] text-[var(--c-muted)] border border-[var(--c-border)]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs text-center leading-tight ${
                      isCurrent
                        ? "text-[var(--c-foreground)] font-semibold"
                        : isCompleted
                        ? "text-green-400"
                        : "text-[var(--c-muted)]"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                {/* Connector line */}
                {idx < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full ${
                      idx < currentStageIdx
                        ? "bg-green-500"
                        : "bg-[var(--c-border)]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Naechste Termine */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--c-foreground)] mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[var(--c-primary)]" />
          N&auml;chste Termine
        </h2>

        {fahrstunden.length === 0 ? (
          <p className="text-[var(--c-muted)] text-sm py-4 text-center">
            Keine Termine geplant.
          </p>
        ) : (
          <div className="space-y-3">
            {fahrstunden.map((fs) => (
              <div
                key={fs.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)]/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--c-primary)]/10">
                    <Calendar className="h-5 w-5 text-[var(--c-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--c-foreground)]">
                      {formatDate(fs.datum)} &mdash; {formatTime(fs.uhrzeit)}
                    </p>
                    <p className="text-xs text-[var(--c-muted)]">
                      {TYP_LABELS[fs.typ] || fs.typ} &middot;{" "}
                      {fs.dauer} Min.
                      {fs.fahrlehrer &&
                        ` \u00b7 ${fs.fahrlehrer.vorname} ${fs.fahrlehrer.nachname}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[var(--c-muted)]" />
                  <span className="text-xs text-[var(--c-muted)]">
                    {fs.dauer} Min.
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Dokumente-Checkliste */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--c-foreground)] mb-1 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-[var(--c-primary)]" />
          Dokumente-Checkliste
        </h2>
        <p className="text-sm text-[var(--c-muted)] mb-4">
          {dokumenteVorhanden} von {DOKUMENT_TYPEN.length} Dokumenten vorhanden
        </p>

        <div className="space-y-2">
          {DOKUMENT_TYPEN.map((dt) => {
            const dok = dokumentMap.get(dt.typ);
            const vorhanden = dok?.vorhanden ?? false;
            const hilfeLink = DOKUMENT_HILFE_LINKS[dt.typ];

            return (
              <div
                key={dt.typ}
                className="flex items-center justify-between rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)]/50 px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[var(--c-foreground)]">
                    {dt.label}
                  </span>
                  {!vorhanden && hilfeLink && (
                    <a
                      href={hilfeLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--c-primary)] hover:text-[var(--c-primary-dark)] transition-colors"
                    >
                      {hilfeLink.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {vorhanden ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: Zahlungen */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--c-foreground)] mb-1 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[var(--c-primary)]" />
          Zahlungen
        </h2>
        {offeneZahlungen.length > 0 && (
          <p className="text-sm text-[var(--c-muted)] mb-4">
            Offener Betrag:{" "}
            <span className="font-semibold text-orange-400">
              {formatCurrency(offenerBetrag)}
            </span>
          </p>
        )}

        {zahlungen.length === 0 ? (
          <p className="text-[var(--c-muted)] text-sm py-4 text-center">
            Keine Zahlungen vorhanden.
          </p>
        ) : (
          <div className="space-y-2 mt-3">
            {zahlungen.map((z) => (
              <div
                key={z.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)]/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--c-foreground)]">
                    {z.beschreibung}
                  </p>
                  <p className="text-xs text-[var(--c-muted)]">
                    F&auml;llig: {formatDate(z.faellig_am)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[var(--c-foreground)]">
                    {formatCurrency(Number(z.betrag))}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ZAHLUNG_STATUS_COLORS[z.status] ||
                      "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {ZAHLUNG_STATUS_LABELS[z.status] || z.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 5: Ausbildungsnachweis */}
      {schueler && (
        <section className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--c-foreground)] mb-2 flex items-center gap-2">
            <Download className="h-5 w-5 text-[var(--c-primary)]" />
            Ausbildungsnachweis
          </h2>
          <p className="text-sm text-[var(--c-muted)] mb-4">
            Lade deinen vollst&auml;ndigen Ausbildungsnachweis als PDF herunter.
            Er enth&auml;lt alle Fahrstunden, Dokumente und Pr&uuml;fungsergebnisse.
          </p>
          <button
            onClick={handleDownloadAusbildungsnachweis}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--c-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {downloadingPdf
              ? "Wird erstellt..."
              : "Ausbildungsnachweis herunterladen"}
          </button>
        </section>
      )}

      {/* Section 6: Theorie-Fortschritt */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--c-foreground)] mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[var(--c-primary)]" />
          Theorie-Fortschritt
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 rounded-full bg-[var(--c-surface-light)] border border-[var(--c-border)]/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--c-primary)] transition-all duration-500"
                style={{ width: "0%" }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-[var(--c-muted)]">
            &mdash;
          </span>
        </div>

        <Link
          href="/theorie"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--c-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--c-primary)] hover:bg-[var(--c-primary)]/20 transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          Zum Theorie-Trainer
        </Link>
      </section>
    </div>
  );
}
