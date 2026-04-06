/**
 * Stadtdaten für lokale SEO-Landingpages
 * Jede Stadt bekommt eine eigene Seite mit lokalen Keywords
 */

export interface CityData {
  slug: string;
  name: string;
  bundesland: string;
  einwohner: string;
  fahrschulen: string;
  besonderheiten: string[];
  keywords: string[];
  localFacts: string[];
}

export const CITIES: CityData[] = [
  {
    slug: "nuernberg",
    name: "Nürnberg",
    bundesland: "Bayern",
    einwohner: "520.000",
    fahrschulen: "ca. 120",
    besonderheiten: [
      "Altstadtring mit komplexen Vorfahrtsregeln",
      "Viele Baustellen durch U-Bahn-Ausbau",
      "Frankenschnellweg als Prüfungsstrecke",
    ],
    keywords: ["Fahrschule Nürnberg", "Führerschein Nürnberg", "Fahrschule Nürnberg Preise", "Beste Fahrschule Nürnberg"],
    localFacts: [
      "In Nürnberg gibt es ca. 120 Fahrschulen für 520.000 Einwohner",
      "Die durchschnittlichen Führerscheinkosten liegen bei 3.200-3.800€",
      "Beliebte Prüfungsstrecken führen über den Frankenschnellweg und durch die Südstadt",
    ],
  },
  {
    slug: "muenchen",
    name: "München",
    bundesland: "Bayern",
    einwohner: "1.500.000",
    fahrschulen: "ca. 350",
    besonderheiten: [
      "Dichter Stadtverkehr mit Tramlinien",
      "Mittlerer Ring als Prüfungsstrecke",
      "Hohe Führerscheinkosten (3.500-4.500€)",
    ],
    keywords: ["Fahrschule München", "Führerschein München", "Fahrschule München Kosten", "Beste Fahrschule München"],
    localFacts: [
      "München hat mit ca. 350 Fahrschulen die höchste Dichte in Bayern",
      "Der Führerschein kostet in München durchschnittlich 3.500-4.500€",
      "Prüfungsstrecken führen häufig über den Mittleren Ring und durch Schwabing",
    ],
  },
  {
    slug: "stuttgart",
    name: "Stuttgart",
    bundesland: "Baden-Württemberg",
    einwohner: "635.000",
    fahrschulen: "ca. 180",
    besonderheiten: [
      "Steile Hanglagen erfordern Anfahren am Berg",
      "Viele Tunnel und Unterführungen",
      "B14/B27 als häufige Prüfungsstrecke",
    ],
    keywords: ["Fahrschule Stuttgart", "Führerschein Stuttgart", "Fahrschule Stuttgart Preise", "Beste Fahrschule Stuttgart"],
    localFacts: [
      "Stuttgart hat ca. 180 Fahrschulen für 635.000 Einwohner",
      "Besonderheit: Viele Hanglage-Strecken erfordern sicheres Anfahren am Berg",
      "Die Durchfallquote bei der praktischen Prüfung liegt bei ca. 30%",
    ],
  },
  {
    slug: "berlin",
    name: "Berlin",
    bundesland: "Berlin",
    einwohner: "3.700.000",
    fahrschulen: "ca. 800",
    besonderheiten: [
      "Komplexe Kreuzungen mit Straßenbahnen",
      "Viele Radfahrer im Straßenverkehr",
      "Stadtautobahn A100 als Prüfungsstrecke",
    ],
    keywords: ["Fahrschule Berlin", "Führerschein Berlin", "Fahrschule Berlin günstig", "Beste Fahrschule Berlin"],
    localFacts: [
      "Berlin hat mit ca. 800 Fahrschulen die meisten in Deutschland",
      "Die Durchfallquote liegt in Berlin bei ca. 40% — höher als der Bundesdurchschnitt",
      "Beliebte Prüfungsstrecken: Kurfürstendamm, Stadtautobahn A100",
    ],
  },
  {
    slug: "hamburg",
    name: "Hamburg",
    bundesland: "Hamburg",
    einwohner: "1.900.000",
    fahrschulen: "ca. 400",
    besonderheiten: [
      "Hafen- und Brückenverkehr",
      "Viele Einbahnstraßen in der Innenstadt",
      "Elbtunnel als Prüfungsstrecke",
    ],
    keywords: ["Fahrschule Hamburg", "Führerschein Hamburg", "Fahrschule Hamburg Kosten", "Beste Fahrschule Hamburg"],
    localFacts: [
      "Hamburg hat ca. 400 Fahrschulen für 1,9 Millionen Einwohner",
      "Führerscheinkosten: durchschnittlich 3.000-3.800€",
      "Besonderheit: Elbtunnel und Hafengebiet als Prüfungsstrecken",
    ],
  },
  {
    slug: "koeln",
    name: "Köln",
    bundesland: "Nordrhein-Westfalen",
    einwohner: "1.080.000",
    fahrschulen: "ca. 280",
    besonderheiten: [
      "Rheinbrücken und Ringstraßen",
      "Dichter Verkehr in der Innenstadt",
      "Kölner Ringe als typische Prüfungsstrecke",
    ],
    keywords: ["Fahrschule Köln", "Führerschein Köln", "Fahrschule Köln Preise", "Beste Fahrschule Köln"],
    localFacts: [
      "Köln hat ca. 280 Fahrschulen — eine der höchsten Dichten in NRW",
      "Führerscheinkosten liegen bei 2.800-3.500€",
      "Die Kölner Ringe und Rheinbrücken gehören zu den häufigsten Prüfungsstrecken",
    ],
  },
  {
    slug: "frankfurt",
    name: "Frankfurt am Main",
    bundesland: "Hessen",
    einwohner: "760.000",
    fahrschulen: "ca. 200",
    besonderheiten: [
      "Schneller Stadtverkehr mit vielen Pendlern",
      "Autobahn-Kreuz als Prüfungsherausforderung",
      "Viele internationale Fahrschüler",
    ],
    keywords: ["Fahrschule Frankfurt", "Führerschein Frankfurt", "Fahrschule Frankfurt Preise", "Beste Fahrschule Frankfurt"],
    localFacts: [
      "Frankfurt hat ca. 200 Fahrschulen für 760.000 Einwohner",
      "Besonderheit: Viele internationale Schüler durch den Flughafen-Standort",
      "Führerscheinkosten: 3.000-3.800€ im Durchschnitt",
    ],
  },
  {
    slug: "duesseldorf",
    name: "Düsseldorf",
    bundesland: "Nordrhein-Westfalen",
    einwohner: "620.000",
    fahrschulen: "ca. 160",
    besonderheiten: [
      "Rheinufer-Tunnel und Brückenverkehr",
      "Königsallee als beliebte Übungsstrecke",
      "Viele Einbahnstraßen in der Altstadt",
    ],
    keywords: ["Fahrschule Düsseldorf", "Führerschein Düsseldorf", "Fahrschule Düsseldorf Kosten", "Beste Fahrschule Düsseldorf"],
    localFacts: [
      "Düsseldorf hat ca. 160 Fahrschulen für 620.000 Einwohner",
      "Führerscheinkosten: 2.800-3.500€",
      "Prüfungsstrecken führen oft über die Rheinkniebrücke und durch Bilk",
    ],
  },
];

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return CITIES.map((c) => c.slug);
}
