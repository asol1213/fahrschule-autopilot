export interface DemoConfig {
  slug: "starter" | "pro" | "premium";
  fahrschulName: string;
  inhaber: string;
  stadt: string;
  adresse: string;
  telefon: string;
  email: string;
  primaryColor: string; // tailwind color name
  plan: string;
  preis: string;
  ersparnis: string;
  zeitErsparnis: string;
  features: Record<string, boolean>;
}

export const demos: Record<string, DemoConfig> = {
  starter: {
    slug: "starter",
    fahrschulName: "Fahrschule Müller",
    inhaber: "Thomas Müller",
    stadt: "Musterstadt",
    adresse: "Hauptstraße 42, 90402 Musterstadt",
    telefon: "+49 911 123 4567",
    email: "info@fahrschule-mueller.de",
    primaryColor: "blue",
    plan: "Starter",
    preis: "€99",
    ersparnis: "~€800",
    zeitErsparnis: "~10h",
    features: {
      erinnerungen: true,
      bewertungen: true,
      reporting: true,
      zahlungen: false,
      chatbot: false,
      onboarding: false,
      empfehlungen: false,
      anmeldung: false,
      telefon: false,
      website: false,
      theorie: false,
      crm: false,
      blog: false,
    },
  },
  pro: {
    slug: "pro",
    fahrschulName: "Fahrschule Schmidt",
    inhaber: "Michael Schmidt",
    stadt: "München",
    adresse: "Leopoldstraße 88, 80802 München",
    telefon: "+49 89 987 6543",
    email: "info@fahrschule-schmidt.de",
    primaryColor: "green",
    plan: "Pro",
    preis: "€249",
    ersparnis: "~€1.500",
    zeitErsparnis: "~25h",
    features: {
      erinnerungen: true,
      bewertungen: true,
      reporting: true,
      zahlungen: true,
      chatbot: true,
      onboarding: true,
      empfehlungen: true,
      anmeldung: true,
      telefon: false,
      website: false,
      theorie: false,
      crm: false,
      blog: false,
    },
  },
  premium: {
    slug: "premium",
    fahrschulName: "Fahrschule Weber",
    inhaber: "Andreas Weber",
    stadt: "Stuttgart",
    adresse: "Königstraße 15, 70173 Stuttgart",
    telefon: "+49 711 456 7890",
    email: "info@fahrschule-weber.de",
    primaryColor: "purple",
    plan: "Premium",
    preis: "€499",
    ersparnis: "~€2.500",
    zeitErsparnis: "~40h",
    features: {
      erinnerungen: true,
      bewertungen: true,
      reporting: true,
      zahlungen: true,
      chatbot: true,
      onboarding: true,
      empfehlungen: true,
      anmeldung: true,
      telefon: true,
      website: true,
      theorie: true,
      crm: true,
      blog: true,
    },
  },
};

export function getDemoConfig(plan: string): DemoConfig | null {
  return demos[plan] || null;
}

export const allFeatures = [
  { id: "erinnerungen", name: "Termin-Erinnerungen", desc: "Automatische WhatsApp-Erinnerungen 24h + 2h vor jeder Fahrstunde", icon: "Bell", minPlan: "starter", color: "blue" },
  { id: "bewertungen", name: "Google-Bewertungen", desc: "Automatische Bewertungsanfragen nach bestandener Prüfung", icon: "Star", minPlan: "starter", color: "yellow" },
  { id: "reporting", name: "Basis-Reporting", desc: "Monatlicher Report über alle Automationen und Ergebnisse", icon: "BarChart3", minPlan: "starter", color: "orange" },
  { id: "zahlungen", name: "Zahlungserinnerungen", desc: "Automatische Zahlungserinnerungen bei offenen Rechnungen", icon: "CreditCard", minPlan: "pro", color: "green" },
  { id: "chatbot", name: "AI-Chatbot", desc: "24/7 Chatbot auf Ihrer Website beantwortet Schülerfragen", icon: "MessageCircle", minPlan: "pro", color: "purple" },
  { id: "onboarding", name: "Schüler-Onboarding", desc: "Automatischer Willkommensprozess für neue Schüler", icon: "Users", minPlan: "pro", color: "cyan" },
  { id: "empfehlungen", name: "Empfehlungssystem", desc: "Schüler werden automatisch gebeten, Freunde zu empfehlen", icon: "Repeat", minPlan: "pro", color: "pink" },
  { id: "anmeldung", name: "Online Anmeldung", desc: "Digitales Anmeldeformular direkt auf Ihrer Website", icon: "FileText", minPlan: "pro", color: "blue" },
  { id: "telefon", name: "AI Telefon-Assistent", desc: "AI-Stimme beantwortet Anrufe, bucht Termine, leitet weiter", icon: "Phone", minPlan: "premium", color: "purple" },
  { id: "website", name: "Professionelle Website", desc: "SEO-optimierte Website im Premium-Design für Ihre Fahrschule", icon: "Globe", minPlan: "premium", color: "blue" },
  { id: "theorie", name: "Theorie-Trainer", desc: "2.300+ Übungsfragen mit AI-Tutor für Ihre Schüler", icon: "BookOpen", minPlan: "premium", color: "green" },
  { id: "crm", name: "CRM & Datenbank", desc: "Komplette Schülerverwaltung mit Fortschritts-Tracking", icon: "Database", minPlan: "premium", color: "orange" },
  { id: "blog", name: "Blog-Erstellung", desc: "Regelmäßige Blog-Artikel für SEO und Schüler-Information", icon: "PenTool", minPlan: "premium", color: "cyan" },
];
