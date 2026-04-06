export type FAQCategory = "allgemein" | "preise" | "technik" | "datenschutz" | "theorie";

export interface FAQ {
  q: string;
  a: string;
  category: FAQCategory;
}

export const CATEGORY_LABELS: Record<FAQCategory, string> = {
  allgemein: "Allgemein",
  preise: "Preise & Abrechnung",
  technik: "Technik & Setup",
  datenschutz: "Datenschutz & DSGVO",
  theorie: "Theorie-Trainer",
};

export const faqs: FAQ[] = [
  // ---- ALLGEMEIN (Homepage FAQs) ----
  {
    q: "Muss ich meine aktuelle Software wechseln?",
    a: "Nein, auf keinen Fall. Fahrschule Autopilot funktioniert mit jeder bestehenden Software — AUTOVIO, Fahrschulcockpit, ClickClickDrive oder sogar Excel. Wir bauen die Automationen drumherum, nicht als Ersatz.",
    category: "allgemein",
  },
  {
    q: "Wie lange dauert die Einrichtung?",
    a: "Unter 24 Stunden. Wir richten alles für Sie ein. Sie müssen nur einmal kurz Ihre WhatsApp Business-Nummer verbinden und uns Zugang zu Ihrem Google-Profil geben. Den Rest machen wir.",
    category: "allgemein",
  },
  {
    q: "Was passiert, wenn ein Schüler sich von den Nachrichten gestört fühlt?",
    a: "Unsere Nachrichten sind freundlich, persönlich und professionell formuliert. Jeder Schüler kann sich jederzeit mit einem Wort abmelden. In der Praxis bekommen wir fast ausschließlich positives Feedback.",
    category: "allgemein",
  },
  {
    q: "Was ist mit der Führerscheinreform? Lohnt sich das noch?",
    a: "Gerade jetzt lohnt es sich besonders. Weniger Anmeldungen bedeutet: Jeder einzelne Schüler ist wertvoller. No-Shows, verpasste Bewertungen und offene Zahlungen können Sie sich nicht mehr leisten. Genau das lösen wir.",
    category: "allgemein",
  },
  {
    q: "Brauche ich technisches Wissen?",
    a: "Null. Wenn Sie WhatsApp bedienen können, reicht das. Wir richten alles ein, testen alles und zeigen Ihnen in 10 Minuten wie Sie den monatlichen Report lesen. Das war's.",
    category: "allgemein",
  },
  {
    q: "Wie schnell sehe ich Ergebnisse?",
    a: "Die meisten Fahrschulen sehen bereits in der ersten Woche weniger No-Shows. Google-Bewertungen steigen typischerweise innerhalb von 2-4 Wochen deutlich an. Den vollen ROI sehen Sie nach ca. 30 Tagen.",
    category: "allgemein",
  },
  {
    q: "Funktioniert das auch für kleine Fahrschulen mit nur einem Fahrlehrer?",
    a: "Ja, besonders gut sogar. Gerade Ein-Mann-Betriebe profitieren am meisten, weil jede eingesparte Verwaltungsstunde direkt in Fahrstunden umgewandelt werden kann. Unser Starter-Paket ist genau dafür gemacht.",
    category: "allgemein",
  },

  // ---- PREISE ----
  {
    q: "Was kostet es wirklich? Gibt es versteckte Gebühren?",
    a: "Nein, keine versteckten Kosten. Der monatliche Preis deckt alles ab — Einrichtung, WhatsApp-Nachrichten, Chatbot, Support. Die einzigen variablen Kosten sind WhatsApp-Nachrichten (ca. €0,05-0,11 pro Nachricht), die direkt an Meta gehen.",
    category: "preise",
  },
  {
    q: "Kann ich monatlich kündigen?",
    a: "Ja, jederzeit. Keine Mindestlaufzeit, keine Kündigungsfrist. Wenn Sie nach 30 Tagen keine Ergebnisse sehen, bekommen Sie Ihr Geld zurück. Wir glauben an unser Produkt.",
    category: "preise",
  },
  {
    q: "Gibt es eine Einrichtungsgebühr?",
    a: "Nein. Setup, Konfiguration und Einweisung sind im monatlichen Preis enthalten. Sie zahlen nur den gewählten Monatspreis — keine versteckten Einmalkosten.",
    category: "preise",
  },
  {
    q: "Kann ich den Plan jederzeit wechseln?",
    a: "Ja, Sie können jederzeit upgraden oder downgraden. Bei einem Upgrade werden die zusätzlichen Features sofort freigeschaltet. Bei einem Downgrade gilt der neue Preis ab dem nächsten Abrechnungszeitraum.",
    category: "preise",
  },
  {
    q: "Was passiert nach der Kündigung mit meinen Daten?",
    a: "Nach Kündigung haben Sie 30 Tage Zeit, Ihre Daten zu exportieren. Danach werden alle Daten DSGVO-konform gelöscht. Ihre Google-Bewertungen und WhatsApp-Kontakte bleiben natürlich erhalten — die gehören Ihnen.",
    category: "preise",
  },
  {
    q: "Gibt es einen Mengenrabatt für mehrere Standorte?",
    a: "Ja. Ab 3 Standorten bieten wir individuelle Konditionen an. Kontaktieren Sie uns für ein maßgeschneidertes Angebot.",
    category: "preise",
  },

  // ---- TECHNIK ----
  {
    q: "Welche WhatsApp-Version brauche ich?",
    a: "Sie benötigen WhatsApp Business (kostenlos im App Store). Wir verbinden Ihre Business-Nummer mit unserer Automation — Ihre normale WhatsApp-Nutzung bleibt unberührt.",
    category: "technik",
  },
  {
    q: "Funktioniert der AI Telefon-Assistent mit meiner Nummer?",
    a: "Ja. Wir richten eine Weiterleitung ein: Wenn Sie nicht abheben (nach 3x Klingeln), übernimmt der AI-Assistent. Sie können auch eine eigene Nummer für den Assistenten nutzen.",
    category: "technik",
  },
  {
    q: "Was passiert bei einem technischen Problem?",
    a: "Wir überwachen alle Systeme 24/7. Bei Störungen werden Sie sofort informiert und wir beheben das Problem — in der Regel innerhalb von 1 Stunde. Im Notfall leiten alle Nachrichten und Anrufe direkt an Sie weiter.",
    category: "technik",
  },
  {
    q: "Kann ich die automatischen Nachrichten anpassen?",
    a: "Ja. Alle Texte — Erinnerungen, Bewertungsanfragen, Zahlungserinnerungen — können individuell angepasst werden. Wir schlagen optimierte Vorlagen vor, aber Sie haben das letzte Wort.",
    category: "technik",
  },
  {
    q: "Brauche ich einen speziellen Browser oder Computer?",
    a: "Nein. Alles läuft in der Cloud. Sie können das Dashboard von jedem Gerät mit Internetzugang aufrufen — Computer, Tablet oder Smartphone.",
    category: "technik",
  },

  // ---- DATENSCHUTZ ----
  {
    q: "Ist das DSGVO-konform?",
    a: "Ja, zu 100%. Alle Daten werden auf europäischen Servern gespeichert. WhatsApp Business API ist DSGVO-konform. Wir haben eine Auftragsverarbeitungsvereinbarung (AVV) vorbereitet.",
    category: "datenschutz",
  },
  {
    q: "Wo werden die Daten gespeichert?",
    a: "Alle Daten liegen auf Servern in Frankfurt (Deutschland) bei Supabase/AWS. Keine Daten verlassen die EU. Die WhatsApp-Nachrichten laufen über die offizielle Meta Business API.",
    category: "datenschutz",
  },
  {
    q: "Haben meine Schüler dem zugestimmt?",
    a: "Ja, die Einwilligung wird im Anmeldeformular eingeholt. Schüler können sich jederzeit per 'STOPP' von den automatischen Nachrichten abmelden. Wir dokumentieren alle Einwilligungen.",
    category: "datenschutz",
  },
  {
    q: "Wer hat Zugriff auf die Schülerdaten?",
    a: "Nur Sie und autorisierte Mitarbeiter Ihrer Fahrschule. Unsere Techniker haben nur bei aktiven Supportanfragen temporären Zugriff. Alles ist in der AVV geregelt.",
    category: "datenschutz",
  },

  // ---- THEORIE-TRAINER ----
  {
    q: "Wie viele Prüfungsfragen sind enthalten?",
    a: "Über 2.300 offizielle Prüfungsfragen aus dem aktuellen Fragenkatalog, davon 760 mit Verkehrsbildern. Alle Fragen werden regelmäßig aktualisiert.",
    category: "theorie",
  },
  {
    q: "Kann der AI-Tutor wirklich Fragen erklären?",
    a: "Ja. Der AI-Tutor erklärt jede Antwort auf Deutsch in einfacher Sprache, gibt Merkregeln und Praxisbeispiele. Schüler können Rückfragen stellen wie bei einem echten Nachhilfelehrer.",
    category: "theorie",
  },
  {
    q: "Funktioniert der Theorie-Trainer auch auf dem Handy?",
    a: "Ja, komplett responsive. Die meisten Schüler nutzen den Trainer auf dem Smartphone — unterwegs, in der Bahn oder zwischen den Fahrstunden.",
    category: "theorie",
  },
  {
    q: "Gibt es eine Prüfungssimulation?",
    a: "Ja. 30 Fragen (20 Grundstoff + 10 Zusatzstoff B), 30 Minuten Zeit, maximal 10 Fehlerpunkte — genau wie in der echten Prüfung. Inklusive Auswertung und Erklärung falscher Antworten.",
    category: "theorie",
  },
];

/** Get only the homepage FAQs (allgemein category, first 8) */
export function getHomepageFAQs() {
  return faqs.filter((f) => f.category === "allgemein").slice(0, 8);
}

/** Get FAQs by category */
export function getFAQsByCategory(category: FAQCategory) {
  return faqs.filter((f) => f.category === category);
}
