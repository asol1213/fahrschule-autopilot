import type { Metadata } from "next";
import { ArrowRight, Shield, Zap, MessageCircle, Phone, BarChart3 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fahrschule Autopilot — AI-Automation für Fahrschulen",
  description:
    "Automatische WhatsApp-Erinnerungen, AI-Telefon-Assistent und Google-Bewertungen. Spare 10-40 Stunden/Monat. Ab €99/Monat.",
  robots: { index: false, follow: false },
};

const features = [
  {
    icon: MessageCircle,
    title: "Automatische WhatsApp-Erinnerungen",
    desc: "24h + 2h vor jeder Fahrstunde. 35% weniger No-Shows.",
    color: "text-[#25D366]",
  },
  {
    icon: Phone,
    title: "AI-Telefon-Assistent",
    desc: "Beantwortet Anrufe 24/7 — Preise, Öffnungszeiten, Anmeldung.",
    color: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Google-Bewertungen automatisch",
    desc: "15-20 neue Bewertungen/Monat nach bestandener Prüfung.",
    color: "text-accent",
  },
  {
    icon: Zap,
    title: "Zahlungserinnerungen",
    desc: "3-stufig, automatisch. 80% schnellere Zahlung.",
    color: "text-orange-400",
  },
];

export default function SocialAdsLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {/* Hero — emotional, direkt */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            Ihre Fahrschule verdient{" "}
            <span className="gradient-text">keinen einzigen Ausfall</span> mehr
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto mb-8">
            3-5 verpasste Fahrstunden pro Woche = bis zu €1.400 verlorener Umsatz.
            Fahrschule Autopilot macht Schluss damit — automatisch, im Hintergrund.
          </p>
          <a
            href="https://calendly.com/andrewarbohq/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            In 15 Min zeigen lassen
            <ArrowRight className="h-5 w-5" />
          </a>
          <p className="text-xs text-muted mt-3">Kostenlos & unverbindlich. Keine Kreditkarte nötig.</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {features.map((f) => (
            <div key={f.title} className="p-5 rounded-xl border border-border bg-surface">
              <f.icon className={`h-6 w-6 ${f.color} mb-3`} />
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Testimonial Quote */}
        <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 mb-12">
          <p className="text-sm italic text-muted leading-relaxed mb-3">
            &ldquo;Seit wir Fahrschule Autopilot nutzen, haben wir 85% weniger Terminausfälle.
            Das spart uns über €1.200 pro Monat. Und die Google-Bewertungen haben sich verdreifacht.&rdquo;
          </p>
          <p className="text-xs font-medium">— Thomas K., Fahrschulinhaber</p>
        </div>

        {/* Pricing teaser */}
        <div className="text-center mb-12">
          <p className="text-sm text-muted mb-2">Ab nur</p>
          <p className="text-4xl font-bold">€99<span className="text-lg text-muted font-normal">/Monat</span></p>
          <p className="text-xs text-muted mt-2">Monatlich kündbar. 30-Tage Geld-zurück-Garantie.</p>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <a
            href="https://calendly.com/andrewarbohq/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white hover:bg-accent-light transition-all"
          >
            Jetzt kostenlose Demo buchen
            <ArrowRight className="h-5 w-5" />
          </a>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              DSGVO-konform
            </span>
            <span>Kein Risiko</span>
            <span>Setup in 24h</span>
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
