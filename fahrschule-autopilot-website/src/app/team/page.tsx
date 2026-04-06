import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Star, Code2, Headphones, Shield, Cpu, Phone, Bot, BarChart3 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Über uns — Fahrschule Autopilot",
  description: "Lernen Sie das Team hinter Fahrschule Autopilot kennen. Persönliche Betreuung durch den Gründer, kombiniert mit einem erfahrenen Entwicklungsteam.",
  openGraph: {
    title: "Über uns — Fahrschule Autopilot",
    description: "Persönliche Betreuung durch den Gründer, kombiniert mit einem erfahrenen Entwicklungsteam.",
    images: [{ url: "https://fahrschulautopilot.de/opengraph-image" }],
  },
};

export default function TeamPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              Wer steckt dahinter?
            </span>
            <h1 className="text-4xl font-bold mb-4">
              Persönlich betreut, <span className="gradient-text">professionell umgesetzt</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Bei Fahrschule Autopilot haben Sie immer einen direkten Ansprechpartner —
              unterstützt von einem Entwicklungsteam, das Ihre Lösung implementiert und
              kontinuierlich weiterentwickelt.
            </p>
          </div>

          {/* Andrew - Gründer */}
          <div className="rounded-2xl border-2 border-primary/30 bg-surface p-8 mb-8">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Andrew Arbo</h2>
                <p className="text-primary-light font-medium mb-3">Gründer & Ihr persönlicher Ansprechpartner</p>
                <p className="text-muted leading-relaxed mb-4">
                  Data Engineer und Automation-Spezialist mit Erfahrung bei Deloitte.
                  Ich bin derjenige, den Sie anrufen, wenn Sie eine Frage haben — 24/7.
                  Ich kenne Ihre Fahrschule, Ihre Schüler und Ihre Ziele persönlich.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary-light">
                    24/7 erreichbar
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary-light">
                    Direkter Draht — kein Callcenter
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary-light">
                    5+ Jahre AI & Automation
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Entwicklungsteam */}
          <div className="rounded-2xl border border-border bg-surface p-8 mb-8">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Code2 className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Entwicklungsteam</h2>
                <p className="text-accent font-medium mb-3">Implementierung & Weiterentwicklung</p>
                <p className="text-muted leading-relaxed">
                  Unser Entwicklungsteam implementiert Ihre individuelle Lösung und
                  entwickelt die Plattform kontinuierlich weiter. Neue Features,
                  Sicherheitsupdates und Optimierungen — alles im Hintergrund,
                  ohne dass Sie etwas tun müssen.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-surface-lighter p-3 text-center">
                <Shield className="h-5 w-5 text-muted mx-auto mb-1.5" />
                <p className="text-xs text-muted">Sicherheit &<br/>DSGVO</p>
              </div>
              <div className="rounded-xl bg-surface-lighter p-3 text-center">
                <Cpu className="h-5 w-5 text-muted mx-auto mb-1.5" />
                <p className="text-xs text-muted">AI & Machine<br/>Learning</p>
              </div>
              <div className="rounded-xl bg-surface-lighter p-3 text-center">
                <BarChart3 className="h-5 w-5 text-muted mx-auto mb-1.5" />
                <p className="text-xs text-muted">Analytics &<br/>Reporting</p>
              </div>
              <div className="rounded-xl bg-surface-lighter p-3 text-center">
                <Headphones className="h-5 w-5 text-muted mx-auto mb-1.5" />
                <p className="text-xs text-muted">Integration &<br/>Support</p>
              </div>
            </div>
          </div>

          {/* Was uns antreibt */}
          <div className="rounded-2xl border border-border bg-surface p-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Was uns antreibt</h2>
            <p className="text-muted leading-relaxed mb-4">
              Fahrschulinhaber verbringen zu viel Zeit mit Verwaltung und zu wenig Zeit
              mit dem, was sie lieben — Menschen das Fahren beizubringen. Wir automatisieren
              den ganzen Rest: Erinnerungen, Zahlungen, Bewertungen, Kommunikation.
            </p>
            <p className="text-muted leading-relaxed">
              Unsere Mission: <strong className="text-foreground">Jede Fahrschule in Deutschland soll sich auf ihre
              Schüler konzentrieren können — nicht auf Papierkram.</strong>
            </p>
          </div>

          {/* Die Technologie */}
          <div className="rounded-2xl border border-border bg-surface p-8 mb-12">
            <h2 className="text-xl font-bold mb-6">Die Technologie hinter Autopilot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border p-4">
                <Bot className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">KI-Assistenten</h3>
                <p className="text-xs text-muted">WhatsApp FAQ-Bot, Theorie-Tutor und Telefon-Assistent — alle auf Deutsch, alle DSGVO-konform.</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <Phone className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">17 Automationen</h3>
                <p className="text-xs text-muted">Von Termin-Erinnerungen über Zahlungsmanagement bis DSGVO-Archivierung — alles läuft automatisch.</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <Shield className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-1">Deutsche Server</h3>
                <p className="text-xs text-muted">Datenbank in Frankfurt (AWS), DSGVO-konform, verschlüsselt, mit täglichen Backups.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Lernen Sie uns kennen</h3>
            <p className="text-sm text-muted mb-6 max-w-lg mx-auto">
              In einem kostenlosen 30-Minuten-Gespräch zeige ich Ihnen persönlich,
              wie Fahrschule Autopilot Ihren Alltag vereinfacht.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://calendly.com/andrewarbohq/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Kostenlose Demo buchen
              </a>
              <Link
                href="/preise"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-light transition-colors"
              >
                Preise ansehen
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
