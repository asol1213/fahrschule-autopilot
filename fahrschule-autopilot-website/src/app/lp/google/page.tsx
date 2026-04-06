import type { Metadata } from "next";
import { CheckCircle, ArrowRight, Shield, Clock, Star } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fahrschule Autopilot — Weniger No-Shows, mehr Bewertungen",
  description:
    "Automatische Termin-Erinnerungen, Google-Bewertungen und Zahlungserinnerungen für Ihre Fahrschule. Setup in 24h. Ab €99/Monat.",
  robots: { index: false, follow: false },
};

const benefits = [
  "25–40% weniger Terminausfälle durch automatische Erinnerungen",
  "15–20 neue Google-Bewertungen pro Monat — automatisch",
  "80% schnellere Zahlungen durch 3-stufige Erinnerungen",
  "24/7 AI-Telefon-Assistent beantwortet Anrufe",
  "Setup in unter 24 Stunden — wir richten alles ein",
  "DSGVO-konform, monatlich kündbar, Geld-zurück-Garantie",
];

export default function GoogleAdsLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Minimal header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold">
            Fahrschule <span className="gradient-text">Autopilot</span>
          </span>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Shield className="h-3.5 w-3.5 text-accent" />
            DSGVO-konform
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm text-accent mb-6">
            <Star className="h-3.5 w-3.5" />
            Für Fahrschulen in Deutschland
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            €1.400/Monat mehr Umsatz durch{" "}
            <span className="gradient-text">intelligente Automation</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Weniger No-Shows, mehr Google-Bewertungen, automatische Zahlungserinnerungen.
            Alles läuft im Hintergrund — Sie müssen nichts tun.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-4 mb-12">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border">
              <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <a
            href="https://calendly.com/andrewarbohq/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            Kostenlose Demo buchen
            <ArrowRight className="h-5 w-5" />
          </a>
          <p className="text-sm text-muted">
            15 Minuten, unverbindlich. Wir zeigen Ihnen wie es für Ihre Fahrschule funktioniert.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Setup in 24h
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              30-Tage Geld-zurück
            </span>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold gradient-text">35%</div>
              <div className="text-xs text-muted mt-1">weniger No-Shows</div>
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text">20+</div>
              <div className="text-xs text-muted mt-1">Bewertungen/Monat</div>
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text">€1.400+</div>
              <div className="text-xs text-muted mt-1">gespart/Monat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-4 flex items-center justify-between text-xs text-muted">
          <span>&copy; {new Date().getFullYear()} Fahrschule Autopilot</span>
          <div className="flex gap-4">
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
