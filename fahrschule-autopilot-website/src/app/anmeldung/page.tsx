import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AnmeldungForm from "@/components/AnmeldungForm";

export const metadata: Metadata = {
  title: "Online Anmeldung | Fahrschule Autopilot",
  description:
    "Melden Sie sich jetzt online bei Ihrer Fahrschule an. Einfach, schnell und digital — Führerscheinklasse wählen, Daten eingeben, fertig. Antwort innerhalb von 24 Stunden.",
  openGraph: {
    title: "Online Anmeldung | Fahrschule Autopilot",
    description:
      "Digitale Fahrschul-Anmeldung in wenigen Minuten. Wählen Sie Ihre Führerscheinklasse und melden Sie sich bequem online an.",
    type: "website",
    locale: "de_DE",
    siteName: "Fahrschule Autopilot",
    images: [{ url: "https://fahrschulautopilot.de/opengraph-image" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Online Anmeldung — Fahrschule Autopilot",
  description:
    "Digitale Anmeldung für die Fahrschule. Führerscheinklassen B, A, A1, A2, AM, BE, Mofa, B96 und L.",
  url: "https://fahrschulautopilot.de/anmeldung",
  provider: {
    "@type": "Organization",
    name: "Fahrschule Autopilot",
    url: "https://fahrschulautopilot.de",
  },
  potentialAction: {
    "@type": "RegisterAction",
    target: "https://fahrschulautopilot.de/anmeldung",
    name: "Fahrschul-Anmeldung",
  },
};

export default function AnmeldungPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="relative min-h-screen hero-gradient">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

        <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <Link
              href="/"
              className="inline-block mb-8 text-sm text-muted hover:text-foreground transition-colors"
            >
              &larr; Zurück zur Startseite
            </Link>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              <span className="gradient-text">Online Anmeldung</span>
            </h1>
            <p className="text-muted text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              In wenigen Schritten zur Fahrschule — einfach, digital und
              unverbindlich.
            </p>
          </div>

          {/* Form (liest ?fahrschule= aus der URL) */}
          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20 animate-pulse">
              <div className="h-8 bg-surface-lighter rounded w-2/3 mx-auto mb-4" />
              <div className="h-4 bg-surface-lighter rounded w-1/2 mx-auto mb-8" />
              <div className="space-y-4">
                <div className="h-12 bg-surface-lighter rounded" />
                <div className="h-12 bg-surface-lighter rounded" />
                <div className="h-12 bg-surface-lighter rounded" />
              </div>
            </div>
          }>
            <AnmeldungForm />
          </Suspense>

          {/* Footer hint */}
          <p className="text-center text-xs text-muted/60 mt-10">
            Ihre Daten werden DSGVO-konform verarbeitet und nicht an Dritte
            weitergegeben.
          </p>
        </div>
      </div>
    </>
  );
}
