import { notFound } from "next/navigation";
import { getCityBySlug, getAllCitySlugs, CITIES } from "@/data/cities";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ArrowRight, MapPin, Star, Shield, Clock } from "lucide-react";

type Params = Promise<{ city: string }>;

export function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};
  return {
    title: `Fahrschule Automation ${city.name} | Fahrschule Autopilot`,
    description: `Automatische Termin-Erinnerungen, Google-Bewertungen und Zahlungserinnerungen für Fahrschulen in ${city.name}. Weniger No-Shows, mehr Umsatz. Ab €99/Monat.`,
    keywords: city.keywords,
    openGraph: {
      title: `Fahrschule Autopilot für ${city.name}`,
      description: `AI-Automation für Fahrschulen in ${city.name}, ${city.bundesland}. 35% weniger No-Shows, 20+ Bewertungen/Monat.`,
      type: "website",
      locale: "de_DE",
      images: [{ url: "https://fahrschulautopilot.de/opengraph-image" }],
    },
    alternates: {
      canonical: `https://fahrschulautopilot.de/stadt/${slug}`,
    },
  };
}

export default async function CityPage({ params }: { params: Params }) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const benefits = [
    `25–40% weniger Terminausfälle für Fahrschulen in ${city.name}`,
    `15–20 neue Google-Bewertungen pro Monat — automatisch`,
    `80% schnellere Zahlungen durch 3-stufige Erinnerungen`,
    `24/7 AI-Telefon-Assistent beantwortet Anrufe`,
    `Setup in unter 24 Stunden — wir richten alles ein`,
    `DSGVO-konform, monatlich kündbar, Geld-zurück-Garantie`,
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground">Fahrschule Automation {city.name}</span>
          </nav>

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm text-accent mb-6">
              <MapPin className="h-3.5 w-3.5" />
              {city.name}, {city.bundesland}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
              AI-Automation für Fahrschulen in{" "}
              <span className="gradient-text">{city.name}</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              {city.name} hat {city.fahrschulen} Fahrschulen für {city.einwohner} Einwohner.
              Mit Fahrschule Autopilot sparen Sie bis zu €1.400/Monat — automatisch.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-12">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-border">
                <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </div>

          {/* Local Facts */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Führerschein in {city.name} — Fakten
            </h2>
            <ul className="space-y-3">
              {city.localFacts.map((fact) => (
                <li key={fact} className="flex items-start gap-3 text-sm text-muted">
                  <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          {/* Besonderheiten */}
          <div className="rounded-xl border border-border bg-surface p-6 mb-12">
            <h2 className="text-xl font-semibold mb-4">
              Besonderheiten beim Fahren in {city.name}
            </h2>
            <ul className="space-y-2">
              {city.besonderheiten.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-muted">
                  <span className="text-accent mt-1">•</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center mb-12">
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Kostenlose Demo für {city.name}
              <ArrowRight className="h-5 w-5" />
            </a>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted">
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

          {/* Other cities */}
          <div className="border-t border-border pt-8">
            <h3 className="text-sm font-semibold text-muted mb-4">Auch in anderen Städten verfügbar:</h3>
            <div className="flex flex-wrap gap-2">
              {CITIES.filter((c) => c.slug !== slug).map((c) => (
                <Link
                  key={c.slug}
                  href={`/stadt/${c.slug}`}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Local Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": `https://fahrschulautopilot.de/stadt/${slug}`,
              name: `Fahrschule Autopilot — ${city.name}`,
              description: `AI-Automation für Fahrschulen in ${city.name}. Automatische Erinnerungen, Bewertungen und Zahlungen.`,
              url: `https://fahrschulautopilot.de/stadt/${slug}`,
              address: {
                "@type": "PostalAddress",
                addressLocality: city.name,
                addressRegion: city.bundesland,
                addressCountry: "DE",
              },
              areaServed: {
                "@type": "City",
                name: city.name,
                containedInPlace: {
                  "@type": "State",
                  name: city.bundesland,
                },
              },
              parentOrganization: {
                "@type": "Organization",
                name: "Fahrschule Autopilot",
                url: "https://fahrschulautopilot.de",
              },
              priceRange: "€99-€499/Monat",
            }),
          }}
        />
      </main>
      <Footer />
    </>
  );
}
