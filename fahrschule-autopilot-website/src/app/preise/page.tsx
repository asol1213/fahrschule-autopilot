import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import { CheckCircle, Shield, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Preise — Fahrschule Autopilot | Ab €99/Monat",
  description:
    "Fahrschule Autopilot Preise: Starter ab €99/Monat, Pro €249/Monat, Premium €499/Monat. Keine Einrichtungsgebühr, monatlich kündbar, 30-Tage Geld-zurück-Garantie.",
  keywords: [
    "Fahrschule Autopilot Preise",
    "Fahrschule Software Kosten",
    "Fahrschule Automation Preise",
  ],
  alternates: { canonical: "https://fahrschulautopilot.de/preise" },
};

const comparisonFeatures = [
  { feature: "Automatische Termin-Erinnerungen", starter: true, pro: true, premium: true },
  { feature: "Google-Bewertungen Automation", starter: true, pro: true, premium: true },
  { feature: "Basis-Reporting", starter: true, pro: true, premium: true },
  { feature: "Zahlungserinnerungen (3-stufig)", starter: false, pro: true, premium: true },
  { feature: "AI-Chatbot (24/7)", starter: false, pro: true, premium: true },
  { feature: "Schüler-Onboarding", starter: false, pro: true, premium: true },
  { feature: "Online-Anmeldeformular", starter: false, pro: true, premium: true },
  { feature: "AI Telefon-Assistent (24/7)", starter: false, pro: false, premium: true },
  { feature: "Professionelle Website", starter: false, pro: false, premium: true },
  { feature: "CRM & Schülerverwaltung", starter: false, pro: false, premium: true },
  { feature: "KI-Blog-Erstellung", starter: false, pro: false, premium: true },
];

export default function PreisePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        {/* Pricing Cards (reuse existing component) */}
        <PricingSection />

        <div className="mx-auto max-w-5xl px-4 mt-16">
          {/* Feature Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Feature-<span className="gradient-text">Vergleich</span>
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-light">
                    <th className="text-left px-4 py-3 font-medium text-muted">Feature</th>
                    <th className="text-center px-4 py-3 font-medium">Starter</th>
                    <th className="text-center px-4 py-3 font-medium text-primary">Pro</th>
                    <th className="text-center px-4 py-3 font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row) => (
                    <tr key={row.feature} className="border-t border-border">
                      <td className="px-4 py-3 text-muted">{row.feature}</td>
                      <td className="px-4 py-3 text-center">
                        {row.starter ? <CheckCircle className="h-4 w-4 text-accent mx-auto" /> : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center bg-primary/5">
                        {row.pro ? <CheckCircle className="h-4 w-4 text-accent mx-auto" /> : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.premium ? <CheckCircle className="h-4 w-4 text-accent mx-auto" /> : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-surface-light">
                    <td className="px-4 py-3 font-medium">Preis/Monat</td>
                    <td className="px-4 py-3 text-center font-bold">€99</td>
                    <td className="px-4 py-3 text-center font-bold text-primary bg-primary/5">€249</td>
                    <td className="px-4 py-3 text-center font-bold">€499</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            <div className="p-5 rounded-xl border border-border bg-surface text-center">
              <Shield className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold mb-1">30-Tage Geld-zurück</h3>
              <p className="text-xs text-muted">Kein Risiko. Wenn Sie keine Ergebnisse sehen, Geld zurück.</p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Monatlich kündbar</h3>
              <p className="text-xs text-muted">Keine Mindestlaufzeit. Keine Kündigungsfrist.</p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface text-center">
              <CheckCircle className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Setup in 24h</h3>
              <p className="text-xs text-muted">Wir richten alles für Sie ein. Keine technischen Kenntnisse nötig.</p>
            </div>
          </div>

          {/* FAQ-style Pricing questions */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Häufige Fragen zu den Preisen</h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                { q: "Gibt es eine Einrichtungsgebühr?", a: "Nein. Setup, Konfiguration und Einweisung sind im Monatspreis enthalten." },
                { q: "Kann ich den Plan jederzeit wechseln?", a: "Ja, Upgrades und Downgrades sind jederzeit möglich. Die Änderung wird zum nächsten Monat wirksam." },
                { q: "Was passiert nach der Kündigung?", a: "Alle Automationen stoppen sofort. Ihre Daten werden 30 Tage aufbewahrt und dann DSGVO-konform gelöscht." },
                { q: "Gibt es einen Mengenrabatt für mehrere Standorte?", a: "Ja, ab 3 Standorten bieten wir individuelle Konditionen. Kontaktieren Sie uns für ein Angebot." },
              ].map(({ q, a }) => (
                <div key={q} className="p-4 rounded-xl border border-border bg-surface">
                  <h3 className="font-medium mb-1">{q}</h3>
                  <p className="text-sm text-muted">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Kostenlose Demo buchen
              <ArrowRight className="h-5 w-5" />
            </a>
            <p className="text-sm text-muted mt-3">
              15 Minuten, unverbindlich. Wir zeigen Ihnen welcher Plan am besten passt.
            </p>
          </div>
        </div>
      </main>
      <Footer />

      {/* Pricing Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://fahrschulautopilot.de" },
              { "@type": "ListItem", position: 2, name: "Preise", item: "https://fahrschulautopilot.de/preise" },
            ],
          }),
        }}
      />
    </>
  );
}
