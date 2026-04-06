export interface CaseStudyResult {
  label: string;
  before: string;
  after: string;
  saved: string;
  savedColor: string;
}

export interface CaseStudy {
  title: string;
  subtitle: string;
  location: string;
  plan: string;
  color: string;
  accentColor: string;
  results: CaseStudyResult[];
  totalSaved: string;
  totalTime: string;
  roi: string;
  challenge: string;
  solution: string;
  narrative: string;
  disclaimer: string;
}

const CASE_STUDY_DISCLAIMER =
  "Diese Fallstudie ist ein fiktives Beispiel basierend auf typischen Ergebnissen. Namen und Details wurden zum Schutz der Privatsphäre geändert.";

export const caseStudies: CaseStudy[] = [
  {
    title: "Mittelgroße Fahrschule",
    subtitle: "3 Fahrlehrer, 75 aktive Schüler",
    location: "Bayern",
    plan: "Pro-Paket (€249/Mo)",
    color: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    accentColor: "text-blue-400",
    results: [
      {
        label: "No-Shows reduziert",
        before: "5 pro Woche",
        after: "1 pro Woche",
        saved: "€1.120/Mo gespart",
        savedColor: "text-emerald-400",
      },
      {
        label: "Google-Bewertungen",
        before: "18 Bewertungen (3 Jahre)",
        after: "+35 in 2 Monaten",
        saved: "~5 Neukunden/Mo extra",
        savedColor: "text-yellow-400",
      },
      {
        label: "Offene Rechnungen",
        before: "€3.200 ausstehend",
        after: "€400 ausstehend",
        saved: "€2.800 schneller kassiert",
        savedColor: "text-emerald-400",
      },
      {
        label: "Büroarbeit",
        before: "10h pro Woche",
        after: "2h pro Woche",
        saved: "8h/Woche für Fahrstunden",
        savedColor: "text-purple-400",
      },
    ],
    totalSaved: "€1.850",
    totalTime: "8h",
    roi: "7x",
    challenge:
      "Die Fahrschule verlor durch No-Shows und verspätete Zahlungen über €2.000 pro Monat. Google-Bewertungen stagnierte seit 3 Jahren bei 18 Stück mit 3.9 Sternen. Der Inhaber verbrachte 10 Stunden pro Woche mit reiner Büroarbeit statt Fahrstunden zu geben.",
    solution:
      "WhatsApp-Erinnerungen 24h und 2h vor jeder Fahrstunde, automatische 3-stufige Zahlungserinnerungen, Google-Bewertungsanfragen nach jeder bestandenen Prüfung und ein AI-Chatbot für wiederkehrende Schülerfragen.",
    narrative:
      "Innerhalb von 2 Monaten sank die No-Show-Rate von 5 auf 1 pro Woche. Die Google-Bewertungen stiegen von 18 auf 53, der Schnitt von 3.9 auf 4.6 Sterne. Offene Rechnungen reduzierten sich um 87%. Der Inhaber nutzt die gewonnenen 8 Stunden pro Woche für zusätzliche Fahrstunden — das sind ca. €1.600 Mehreinnahmen.",
    disclaimer: CASE_STUDY_DISCLAIMER,
  },
  {
    title: "Kleine Fahrschule",
    subtitle: "1 Inhaber, 40 aktive Schüler",
    location: "Süddeutschland",
    plan: "Starter-Paket (€99/Mo)",
    color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20",
    accentColor: "text-emerald-400",
    results: [
      {
        label: "No-Shows reduziert",
        before: "3 pro Woche",
        after: "1 pro Woche",
        saved: "€560/Mo gespart",
        savedColor: "text-emerald-400",
      },
      {
        label: "Google-Bewertungen",
        before: "8 Bewertungen total",
        after: "+22 in 2 Monaten",
        saved: "Von 3.8 auf 4.7 Sterne",
        savedColor: "text-yellow-400",
      },
    ],
    totalSaved: "€560",
    totalTime: "3h",
    roi: "5x",
    challenge:
      "Als Ein-Mann-Betrieb hatte der Inhaber keine Zeit für Verwaltung. Schüler erschienen nicht zu Terminen, Google-Bewertungen waren kaum vorhanden, und Neukunden gingen an die größere Konkurrenz mit besseren Online-Bewertungen.",
    solution:
      "Automatische Termin-Erinnerungen per WhatsApp und gezielte Bewertungsanfragen nach bestandener Prüfung. Einfach, fokussiert, ohne technischen Aufwand.",
    narrative:
      "Die No-Shows sanken um 67%. Nach nur 2 Monaten hatte die Fahrschule 30 Google-Bewertungen mit 4.7 Sternen und erschien erstmals in den Top 3 der lokalen Google-Suche. Drei Neukunden pro Monat kamen allein durch die bessere Online-Präsenz — Wert: ca. €3.000 Jahresumsatz extra.",
    disclaimer: CASE_STUDY_DISCLAIMER,
  },
  {
    title: "Große Fahrschule",
    subtitle: "5 Fahrlehrer, 120 aktive Schüler",
    location: "Baden-Württemberg",
    plan: "Premium-Paket (€499/Mo)",
    color: "from-purple-500/10 to-purple-600/5 border-purple-500/20",
    accentColor: "text-purple-400",
    results: [
      {
        label: "No-Shows reduziert",
        before: "8 pro Woche",
        after: "2 pro Woche",
        saved: "€1.680/Mo gespart",
        savedColor: "text-emerald-400",
      },
      {
        label: "Google-Bewertungen",
        before: "32 Bewertungen",
        after: "+48 in 3 Monaten",
        saved: "Nr. 1 in Google Maps",
        savedColor: "text-yellow-400",
      },
      {
        label: "Büroarbeit",
        before: "15h pro Woche",
        after: "3h pro Woche",
        saved: "12h/Woche gespart",
        savedColor: "text-purple-400",
      },
      {
        label: "Neue Website + SEO",
        before: "0 Online-Anfragen",
        after: "8-12 pro Monat",
        saved: "~€4.000 Neukunden-Wert",
        savedColor: "text-emerald-400",
      },
    ],
    totalSaved: "€3.200",
    totalTime: "12h",
    roi: "9x",
    challenge:
      "Trotz 5 Fahrlehrern und gutem Ruf litt die Fahrschule unter massiven No-Shows (8/Woche), keiner Online-Präsenz und 15 Stunden Büroarbeit pro Woche. Neukunden kamen ausschließlich durch Mundpropaganda.",
    solution:
      "Komplettes Premium-Paket: WhatsApp-Automationen, AI-Chatbot, professionelle Website mit SEO, AI Telefon-Assistent, Theorie-Trainer und automatisches Bewertungsmanagement.",
    narrative:
      "Nach 3 Monaten war die Fahrschule Nr. 1 in Google Maps für ihre Stadt. 80 Bewertungen mit 4.8 Sternen. 8-12 Online-Anfragen pro Monat — vorher null. Die Büroarbeit sank um 80%. Der ROI von 9x bedeutet: Für jeden investierten Euro kommen 9 Euro zurück.",
    disclaimer: CASE_STUDY_DISCLAIMER,
  },
];
