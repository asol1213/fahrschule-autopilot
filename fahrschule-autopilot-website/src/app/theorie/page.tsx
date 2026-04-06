import type { Metadata } from "next";
import TheorieApp from "@/components/theorie/TheorieApp";

export const metadata: Metadata = {
  title: "Theorie-Trainer | Fahrschule Autopilot — Kostenlos üben",
  description:
    "Kostenloser Theorie-Trainer für die Führerscheinprüfung. 2.300+ Übungsfragen aus dem offiziellen Fragenkatalog mit Erklärungen und AI-Tutor. Jetzt online üben!",
  keywords: [
    "Führerschein Theorie lernen",
    "Fahrschule Theorie online",
    "Führerschein Übungsfragen",
    "Theorie Prüfung üben",
    "Fahrschule Fragenkatalog",
    "Führerschein Test kostenlos",
  ],
  openGraph: {
    title: "Theorie-Trainer | Fahrschule Autopilot",
    description: "2.300+ Übungsfragen aus dem offiziellen Fragenkatalog. Mit AI-Tutor.",
    type: "website",
    locale: "de_DE",
    images: [{ url: "https://fahrschulautopilot.de/opengraph-image" }],
  },
};

export default function TheoriePage() {
  return (
    <main className="min-h-screen bg-background">
      <TheorieApp demo />
    </main>
  );
}
