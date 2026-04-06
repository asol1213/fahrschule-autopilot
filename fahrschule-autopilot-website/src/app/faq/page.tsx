import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQPageContent from "@/components/FAQPageContent";
import { faqs } from "@/data/faqs";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — Fahrschule Autopilot | Häufig gestellte Fragen",
  description:
    "Antworten auf alle Fragen zu Fahrschule Autopilot: Preise, Technik, Datenschutz, Theorie-Trainer und mehr. DSGVO-konform, ohne Vertragsbindung.",
  keywords: [
    "Fahrschule Autopilot FAQ",
    "Fahrschule Automatisierung Fragen",
    "WhatsApp Fahrschule DSGVO",
    "Theorie-Trainer FAQ",
  ],
  alternates: { canonical: "https://fahrschulautopilot.de/faq" },
  openGraph: {
    title: "FAQ — Fahrschule Autopilot",
    description: "Alle Antworten zu Preisen, Technik, DSGVO und Theorie-Trainer.",
    url: "https://fahrschulautopilot.de/faq",
    images: [{ url: "https://fahrschulautopilot.de/opengraph-image" }],
  },
};

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">FAQ</span>
          </nav>

          {/* Hero */}
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              Häufige Fragen
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Alles was Sie wissen müssen
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted">
              {faqs.length} Antworten zu Preisen, Technik, Datenschutz und dem Theorie-Trainer.
              Ihre Frage ist nicht dabei? Schreiben Sie uns per WhatsApp.
            </p>
          </div>

          {/* Interactive FAQ Content */}
          <FAQPageContent />

          {/* CTA */}
          <div className="text-center mt-12 rounded-2xl border border-border bg-surface p-8">
            <h2 className="text-xl font-bold mb-3">Noch Fragen?</h2>
            <p className="text-muted mb-6 text-sm">
              Schreiben Sie uns direkt — wir antworten in der Regel innerhalb von 30 Minuten.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/491714774026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors"
              >
                Per WhatsApp fragen
              </a>
              <a
                href="https://calendly.com/andrewarbohq/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Kostenlose Demo buchen
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* JSON-LD: FAQPage Schema (Google Rich Results) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />

      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://fahrschulautopilot.de" },
              { "@type": "ListItem", position: 2, name: "FAQ", item: "https://fahrschulautopilot.de/faq" },
            ],
          }),
        }}
      />
    </>
  );
}
