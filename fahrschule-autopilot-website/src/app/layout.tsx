import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fahrschulautopilot.de"),
  title: "Fahrschule Autopilot | AI-Automation für Fahrschulen in Deutschland",
  description:
    "Weniger No-Shows, mehr Google-Bewertungen, automatische Zahlungserinnerungen. Fahrschule Autopilot automatisiert Ihren Fahrschulbetrieb — im Hintergrund, ohne dass jemand etwas tun muss. Ab €99/Monat.",
  keywords: [
    "Fahrschule Automation",
    "Fahrschule Software",
    "Fahrschule No-Shows reduzieren",
    "Fahrschule Google Bewertungen",
    "Fahrschule Management Software",
    "Fahrschulsoftware Deutschland",
    "Fahrschule digitalisieren",
    "Fahrschule Terminverwaltung",
    "Fahrschule WhatsApp Erinnerungen",
    "Fahrschule Schüler verwalten",
  ],
  openGraph: {
    title: "Fahrschule Autopilot | AI-Automation für Fahrschulen",
    description:
      "€1.400+/Monat durchschnittlich gespart durch weniger No-Shows, mehr Bewertungen und automatische Zahlungen. Die AI-Lösung für deutsche Fahrschulen.",
    type: "website",
    locale: "de_DE",
    siteName: "Fahrschule Autopilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fahrschule Autopilot | AI-Automation für Fahrschulen",
    description:
      "€1.400+/Monat durchschnittlich gespart. Weniger No-Shows, mehr Bewertungen. Setup in 24 Stunden.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Fahrschule Autopilot",
              description:
                "AI-Automation für deutsche Fahrschulen. Weniger No-Shows, mehr Bewertungen, automatische Zahlungen.",
              url: "https://fahrschulautopilot.de",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+491714774026",
                contactType: "sales",
                availableLanguage: "German",
              },
              founder: {
                "@type": "Person",
                name: "Andrew Arbo",
              },
            }),
          }}
        />
        {/* Software Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Fahrschule Autopilot",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI-Automation für deutsche Fahrschulen. Automatische Termin-Erinnerungen, Google-Bewertungen, Zahlungserinnerungen und mehr.",
              offers: [
                {
                  "@type": "Offer",
                  name: "Starter",
                  price: "99",
                  priceCurrency: "EUR",
                  priceValidUntil: "2028-12-31",
                },
                {
                  "@type": "Offer",
                  name: "Pro",
                  price: "249",
                  priceCurrency: "EUR",
                  priceValidUntil: "2028-12-31",
                },
                {
                  "@type": "Offer",
                  name: "Premium",
                  price: "499",
                  priceCurrency: "EUR",
                  priceValidUntil: "2028-12-31",
                },
              ],
            }),
          }}
        />
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Muss ich meine aktuelle Fahrschulsoftware wechseln?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Nein. Fahrschule Autopilot funktioniert mit jeder bestehenden Software — AUTOVIO, Fahrschulcockpit, ClickClickDrive oder Excel. Wir bauen die Automationen drumherum.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Wie lange dauert die Einrichtung?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Unter 24 Stunden. Wir richten alles für Sie ein. Sie müssen nur Ihre WhatsApp Business-Nummer verbinden und uns Zugang zu Ihrem Google-Profil geben.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Was passiert, wenn ein Schüler sich von den Nachrichten gestört fühlt?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Unsere Nachrichten sind freundlich, persönlich und professionell formuliert. Jeder Schüler kann sich jederzeit mit einem Wort abmelden.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Ist Fahrschule Autopilot DSGVO-konform?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ja, zu 100%. Alle Daten werden auf europäischen Servern gespeichert. WhatsApp Business API ist DSGVO-konform. Wir haben eine Auftragsverarbeitungsvereinbarung (AVV) vorbereitet.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Was kostet Fahrschule Autopilot?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Starter ab €99/Monat, Pro €249/Monat, Premium €499/Monat. Keine Einrichtungsgebühr, monatlich kündbar, 30-Tage Geld-zurück-Garantie.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Was ist mit der Führerscheinreform? Lohnt sich das noch?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Gerade jetzt lohnt es sich besonders. Weniger Anmeldungen bedeutet: Jeder einzelne Schüler ist wertvoller. No-Shows, verpasste Bewertungen und offene Zahlungen können Sie sich nicht mehr leisten.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Kann ich monatlich kündigen?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ja, jederzeit. Keine Mindestlaufzeit, keine Kündigungsfrist. Wenn Sie nach 30 Tagen keine Ergebnisse sehen, bekommen Sie Ihr Geld zurück.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Brauche ich technisches Wissen?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Null. Wenn Sie WhatsApp bedienen können, reicht das. Wir richten alles ein, testen alles und zeigen Ihnen in 10 Minuten wie Sie den monatlichen Report lesen.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
