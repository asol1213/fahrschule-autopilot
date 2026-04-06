import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { caseStudies } from "@/data/case-studies";
import { MapPin, Users, TrendingUp, Clock, ArrowRight, CheckCircle2, Target, Lightbulb, BarChart3, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Fallstudien — Fahrschule Autopilot | Beispielhafte Ergebnisse",
  description:
    "Wie Fahrschulen mit Autopilot No-Shows reduzieren, Google-Bewertungen steigern und Büroarbeit automatisieren. 3 beispielhafte Fallstudien basierend auf typischen Ergebnissen.",
  keywords: [
    "Fahrschule Fallstudie",
    "Fahrschule Automatisierung Ergebnisse",
    "No-Shows reduzieren Fahrschule",
    "Google Bewertungen Fahrschule",
  ],
  alternates: { canonical: "https://fahrschulautopilot.de/fallstudien" },
  openGraph: {
    title: "Fallstudien — Fahrschule Autopilot",
    description: "Beispielhafte Ergebnisse: So sparen Fahrschulen mit Autopilot bis zu €3.200/Monat.",
    url: "https://fahrschulautopilot.de/fallstudien",
    images: [{ url: "https://fahrschulautopilot.de/opengraph-image" }],
  },
};

export default function FallstudienPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Fallstudien</span>
          </nav>

          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-accent bg-accent/10 rounded-full px-4 py-1.5 mb-4">
              Beispielhafte Ergebnisse
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Fallstudien aus der Praxis
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted">
              Drei Fahrschulen, drei Größen, ein Ergebnis: Weniger Ausfälle, mehr Bewertungen,
              weniger Büroarbeit. Mit typischen Zahlen und messbarem ROI.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-12 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted leading-relaxed">
              <strong className="text-foreground">Hinweis:</strong> Die dargestellten Fallstudien basieren auf typischen Ergebnissen unserer Automatisierungslösungen. Namen und Details wurden zum Schutz der Privatsphäre geändert.
            </p>
          </div>

          {/* Case Studies */}
          <div className="space-y-12">
            {caseStudies.map((cs) => (
              <article
                key={cs.title}
                className={`rounded-2xl border bg-gradient-to-br ${cs.color} p-6 sm:p-8 lg:p-10`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold">{cs.title}</h2>
                    <p className="text-sm text-muted flex items-center gap-2 mt-1">
                      <Users className="h-3.5 w-3.5" />
                      {cs.subtitle}
                      <span className="text-muted/40">|</span>
                      <MapPin className="h-3.5 w-3.5" />
                      {cs.location}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold rounded-full px-3 py-1.5 border border-current/20 ${cs.accentColor} bg-current/5 whitespace-nowrap`}
                  >
                    {cs.plan}
                  </span>
                </div>

                {/* Challenge / Solution / Narrative */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="rounded-xl bg-background/50 border border-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-red-400" />
                      <h3 className="text-sm font-semibold">Herausforderung</h3>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{cs.challenge}</p>
                  </div>
                  <div className="rounded-xl bg-background/50 border border-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-yellow-400" />
                      <h3 className="text-sm font-semibold">Lösung</h3>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{cs.solution}</p>
                  </div>
                  <div className="rounded-xl bg-background/50 border border-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold">Ergebnis</h3>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{cs.narrative}</p>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {cs.results.map((r) => (
                    <div key={r.label} className="rounded-xl bg-background/50 border border-border p-4">
                      <p className="text-xs text-muted uppercase tracking-wider mb-2">{r.label}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-red-400 line-through">{r.before}</span>
                        <ArrowRight className="h-3 w-3 text-muted" />
                        <span className="text-sm font-semibold text-emerald-400">{r.after}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={`h-3.5 w-3.5 ${r.savedColor}`} />
                        <span className={`text-xs font-medium ${r.savedColor}`}>{r.saved}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Summary */}
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">
                      <span className="font-bold text-emerald-400">{cs.totalSaved}/Mo</span>{" "}
                      <span className="text-muted">gespart</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span className="text-sm">
                      <span className="font-bold text-purple-400">{cs.totalTime}/Woche</span>{" "}
                      <span className="text-muted">Zeit gewonnen</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-muted">ROI:</span>
                    <span className="text-lg font-bold gradient-text">{cs.roi}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16 rounded-2xl border border-border bg-surface p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Bereit für ähnliche Ergebnisse?
            </h2>
            <p className="text-muted mb-8 max-w-xl mx-auto">
              Buchen Sie eine kostenlose 15-Minuten-Demo und sehen Sie, wie Autopilot für Ihre Fahrschule funktioniert.
            </p>
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Kostenlose Demo buchen
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>
      <Footer />

      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://fahrschulautopilot.de" },
              { "@type": "ListItem", position: 2, name: "Fallstudien", item: "https://fahrschulautopilot.de/fallstudien" },
            ],
          }),
        }}
      />
    </>
  );
}
