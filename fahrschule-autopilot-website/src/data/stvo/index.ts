/**
 * StVO-Referenzdatenbank für den AI-Tutor
 *
 * Verhindert Halluzinationen bei Paragraphen-Angaben.
 * Der AI-Tutor kann diese Daten als Kontext nutzen, um korrekte
 * StVO-Referenzen in seinen Antworten zu verwenden.
 *
 * Quellen: StVO (Straßenverkehrs-Ordnung), StVZO, FeV
 */

export interface StVOParagraph {
  /** z.B. "§ 3 StVO" */
  ref: string;
  /** Kurztitel */
  title: string;
  /** Kerninhalt in 1-2 Sätzen */
  summary: string;
  /** Relevante Kategorien im Theorie-Trainer */
  categories: string[];
  /** Wichtige Zahlenwerte/Grenzwerte */
  keyFacts?: string[];
}

export const stvoParagraphs: StVOParagraph[] = [
  // ─── Geschwindigkeit ────────────────────────────────────────────
  {
    ref: "§ 3 StVO",
    title: "Geschwindigkeit",
    summary:
      "Geschwindigkeit muss den Straßen-, Verkehrs-, Sicht- und Wetterverhältnissen angepasst werden.",
    categories: ["gefahrenlehre", "verhalten"],
    keyFacts: [
      "Innerorts: 50 km/h",
      "Außerorts: 100 km/h",
      "Autobahn Richtgeschwindigkeit: 130 km/h",
      "Bei Nebel (Sichtweite < 50m): max. 50 km/h",
    ],
  },

  // ─── Abstand ────────────────────────────────────────────────────
  {
    ref: "§ 4 StVO",
    title: "Abstand",
    summary:
      "Der Abstand zum Vorausfahrenden muss so groß sein, dass man auch bei plötzlichem Bremsen rechtzeitig halten kann.",
    categories: ["gefahrenlehre", "verhalten"],
    keyFacts: [
      "Faustformel: halber Tacho in Metern (bei 100 km/h = 50m)",
      "Bei Nebel (Sichtweite < 50m): mindestens 50m Abstand",
      "LKW über 3,5t auf Autobahn: mind. 50m Abstand",
    ],
  },

  // ─── Überholen ──────────────────────────────────────────────────
  {
    ref: "§ 5 StVO",
    title: "Überholen",
    summary:
      "Überholt wird grundsätzlich links. Überholen ist nur erlaubt, wenn die Verkehrslage es zulässt und niemand gefährdet wird.",
    categories: ["verhalten", "vorfahrt"],
    keyFacts: [
      "Rechts überholen nur innerorts bei mehreren Fahrstreifen",
      "Nicht überholen: an Fußgängerüberwegen, unübersichtlichen Stellen",
      "Seitenabstand zu Radfahrern: innerorts 1,5m, außerorts 2,0m",
    ],
  },

  // ─── Vorbeifahren ───────────────────────────────────────────────
  {
    ref: "§ 6 StVO",
    title: "Vorbeifahren",
    summary:
      "An haltenden Fahrzeugen und Hindernissen muss mit ausreichendem Seitenabstand vorbeigefahren werden.",
    categories: ["verhalten"],
  },

  // ─── Benutzung von Fahrstreifen ────────────────────────────────
  {
    ref: "§ 7 StVO",
    title: "Benutzung von Fahrstreifen durch Kraftfahrzeuge",
    summary:
      "Auf Fahrbahnen mit mehreren Fahrstreifen in eine Richtung gilt das Rechtsfahrgebot. Der linke Fahrstreifen darf nur zum Überholen benutzt werden.",
    categories: ["verhalten"],
    keyFacts: [
      "Rechtsfahrgebot gilt auf Autobahnen und Kraftfahrstraßen",
      "Innerorts bei mehreren Fahrstreifen: freie Fahrstreifenwahl für Kfz bis 3,5t",
    ],
  },

  // ─── Vorfahrt ───────────────────────────────────────────────────
  {
    ref: "§ 8 StVO",
    title: "Vorfahrt",
    summary:
      "An Kreuzungen und Einmündungen ohne Vorfahrtsregelung gilt rechts vor links.",
    categories: ["vorfahrt"],
    keyFacts: [
      "Rechts vor links gilt an gleichrangigen Kreuzungen",
      "Gilt NICHT an Einmündungen aus Feld-/Waldwegen, verkehrsberuhigten Bereichen oder von Grundstücken",
      "Abknickende Vorfahrt: Zeichen 306 mit Zusatzzeichen",
    ],
  },

  // ─── Abbiegen, Wenden, Rückwärtsfahren ─────────────────────────
  {
    ref: "§ 9 StVO",
    title: "Abbiegen, Wenden und Rückwärtsfahren",
    summary:
      "Beim Abbiegen muss rechtzeitig und deutlich geblinkt werden. Auf den Gegenverkehr, Fußgänger und Radfahrer ist besonders zu achten.",
    categories: ["verhalten", "vorfahrt"],
    keyFacts: [
      "Rechtsabbieger: auf Radfahrer und Fußgänger achten",
      "Linksabbieger müssen Gegenverkehr Vorfahrt gewähren",
      "Beim Wenden darf niemand gefährdet werden",
    ],
  },

  // ─── Einfahren und Anfahren ─────────────────────────────────────
  {
    ref: "§ 10 StVO",
    title: "Einfahren und Anfahren",
    summary:
      "Wer aus einem Grundstück, Fußgängerbereich oder verkehrsberuhigtem Bereich auf die Straße einfahren will, muss sich so verhalten, dass eine Gefährdung anderer ausgeschlossen ist.",
    categories: ["vorfahrt", "verhalten"],
  },

  // ─── Besondere Verkehrslagen ───────────────────────────────────
  {
    ref: "§ 11 StVO",
    title: "Besondere Verkehrslagen",
    summary:
      "Bei stockendem Verkehr muss eine Rettungsgasse gebildet werden. Auf Autobahnen: zwischen dem linken und dem rechts daneben liegenden Fahrstreifen.",
    categories: ["verhalten", "gefahrenlehre"],
    keyFacts: [
      "Rettungsgasse: bei 2 Spuren — zwischen links und rechts",
      "Bei 3+ Spuren: zwischen der linken und der mittleren Spur",
    ],
  },

  // ─── Halten und Parken ──────────────────────────────────────────
  {
    ref: "§ 12 StVO",
    title: "Halten und Parken",
    summary:
      "Halten ist eine gewollte Fahrtunterbrechung. Parken bedeutet, das Fahrzeug zu verlassen oder länger als 3 Minuten zu halten.",
    categories: ["verkehrszeichen", "verhalten"],
    keyFacts: [
      "Halteverbot: 5m vor/10m nach Ampel, 10m vor Andreaskreuz",
      "Parkverbot: vor Grundstücksein-/-ausfahrten, 5m vor/nach Kreuzungen",
      "Parken auf Gehwegen nur mit Zeichen 315",
      "Auf schmalen Straßen: mind. 3m Restfahrbahnbreite",
    ],
  },

  // ─── Sorgfaltspflichten beim Ein-/Aussteigen ──────────────────
  {
    ref: "§ 14 StVO",
    title: "Sorgfaltspflichten beim Ein- und Aussteigen",
    summary:
      "Beim Öffnen der Fahrzeugtür darf niemand gefährdet werden (z.B. Radfahrer!).",
    categories: ["gefahrenlehre", "verhalten"],
    keyFacts: ["Holländischer Griff: Tür mit rechter Hand öffnen → automatischer Schulterblick"],
  },

  // ─── Liegenbleiben von Fahrzeugen ──────────────────────────────
  {
    ref: "§ 15 StVO",
    title: "Liegenbleiben von Fahrzeugen",
    summary:
      "Bleibt ein Fahrzeug auf der Fahrbahn liegen, muss es schnellstmöglich entfernt werden. Warnblinkanlage einschalten, Warndreieck aufstellen.",
    categories: ["gefahrenlehre"],
    keyFacts: [
      "Warndreieck: innerorts 50m, außerorts 100m, Autobahn 150m entfernt aufstellen",
    ],
  },

  // ─── Fußgängerüberwege ──────────────────────────────────────────
  {
    ref: "§ 26 StVO",
    title: "Fußgängerüberwege (Zebrastreifen)",
    summary:
      "An Fußgängerüberwegen haben Fußgänger und Rollstuhlfahrer Vorrang. Fahrzeuge müssen mit mäßiger Geschwindigkeit heranfahren.",
    categories: ["vorfahrt", "verhalten"],
    keyFacts: [
      "Nicht überholen an Fußgängerüberwegen",
      "Auf Fußgängerüberweg nicht halten/parken (+ 5m davor)",
    ],
  },

  // ─── Verkehrszeichen ────────────────────────────────────────────
  {
    ref: "§ 36-43 StVO",
    title: "Verkehrszeichen und Verkehrseinrichtungen",
    summary:
      "Rangfolge: 1. Polizeibeamte, 2. Lichtzeichen (Ampel), 3. Verkehrszeichen, 4. Rechts-vor-Links-Regel.",
    categories: ["verkehrszeichen", "vorfahrt"],
    keyFacts: [
      "Polizeibeamte haben höchste Priorität (vor Ampeln!)",
      "Vorfahrtszeichen brechen Rechts-vor-Links",
    ],
  },

  // ─── Autobahnen ─────────────────────────────────────────────────
  {
    ref: "§ 18 StVO",
    title: "Autobahnen und Kraftfahrstraßen",
    summary:
      "Nur Kraftfahrzeuge mit bauartbedingter Höchstgeschwindigkeit über 60 km/h dürfen Autobahnen und Kraftfahrstraßen benutzen.",
    categories: ["verhalten"],
    keyFacts: [
      "Auf dem Beschleunigungsstreifen auf Autobahngeschwindigkeit beschleunigen",
      "Halten und Wenden auf Autobahnen verboten",
      "Bei Stau: Rettungsgasse bilden",
    ],
  },

  // ─── Beleuchtung ────────────────────────────────────────────────
  {
    ref: "§ 17 StVO",
    title: "Beleuchtung",
    summary:
      "Bei Dämmerung, Dunkelheit oder schlechter Sicht müssen die vorgeschriebenen Beleuchtungseinrichtungen benutzt werden.",
    categories: ["technik", "gefahrenlehre"],
    keyFacts: [
      "Fernlicht: außerorts bei schlechter Beleuchtung, sofort abblenden bei Gegenverkehr",
      "Nebelschlussleuchte: nur bei Sichtweite unter 50m",
      "Standlicht allein reicht nicht bei Dunkelheit",
    ],
  },

  // ─── Ladung ─────────────────────────────────────────────────────
  {
    ref: "§ 22 StVO",
    title: "Ladung",
    summary:
      "Ladung muss so verstaut und gesichert sein, dass sie bei einer Vollbremsung oder plötzlicher Ausweichbewegung nicht verrutschen kann.",
    categories: ["technik"],
    keyFacts: [
      "Ladung darf max. 1,50m nach hinten hinausragen (mit Kennzeichnung)",
      "Ab 1m Überstand: Kennzeichnung erforderlich, bei Dunkelheit rotes Licht",
    ],
  },

  // ─── Alkohol & Drogen ───────────────────────────────────────────
  {
    ref: "§ 24a StVG",
    title: "0,5-Promille-Grenze",
    summary:
      "Ordnungswidrigkeit ab 0,5 Promille BAK. Für Fahranfänger in der Probezeit und unter 21 Jahren gilt die 0,0-Promille-Grenze.",
    categories: ["gefahrenlehre", "persoenlich"],
    keyFacts: [
      "Ab 0,3 ‰ + Auffälligkeiten: Straftat (§ 316 StGB)",
      "Ab 0,5 ‰: Ordnungswidrigkeit — 500€, 1 Monat Fahrverbot, 2 Punkte",
      "Ab 1,1 ‰: absolute Fahruntüchtigkeit — Straftat",
      "Probezeit / unter 21: 0,0 ‰",
    ],
  },

  // ─── Probezeit ──────────────────────────────────────────────────
  {
    ref: "§ 2a StVG",
    title: "Probezeit",
    summary:
      "Die Probezeit dauert 2 Jahre. Bei einem A-Verstoß oder zwei B-Verstößen: Aufbauseminar und Probezeitverlängerung auf 4 Jahre.",
    categories: ["persoenlich"],
    keyFacts: [
      "Probezeitdauer: 2 Jahre",
      "A-Verstoß: z.B. Geschwindigkeitsüberschreitung > 20 km/h, Rotlichtverstoß",
      "B-Verstoß: z.B. abgefahrene Reifen, Handy am Steuer",
      "0,0 ‰ Alkoholgrenze in der Probezeit",
    ],
  },

  // ─── Umwelt ─────────────────────────────────────────────────────
  {
    ref: "§ 30 StVO",
    title: "Umweltschutz, Sonn-/Feiertagsfahrverbot",
    summary:
      "Unnötiges Laufenlassen des Motors, unnötiger Lärm und unnötige Abgasbelastung sind verboten.",
    categories: ["umwelt"],
    keyFacts: [
      "Motor im Stand abstellen (z.B. Bahnübergang, Stau)",
      "LKW-Fahrverbot: Sonn-/Feiertags 0-22 Uhr für LKW > 7,5t",
    ],
  },

  // ─── Reifen ─────────────────────────────────────────────────────
  {
    ref: "§ 36 StVZO",
    title: "Bereifung",
    summary:
      "Reifen müssen den Anforderungen entsprechen. Mindestprofiltiefe 1,6 mm. Winterreifenpflicht bei Glatteis, Schneeglätte, Schneematsch.",
    categories: ["technik"],
    keyFacts: [
      "Mindestprofiltiefe: 1,6 mm (empfohlen: 3mm Sommer, 4mm Winter)",
      "Winterreifen: M+S oder Alpine-Symbol (Schneeflocke)",
      "O bis O Regel: Oktober bis Ostern",
    ],
  },

  // ─── Bremsen ────────────────────────────────────────────────────
  {
    ref: "§ 29 StVZO",
    title: "Bremsen",
    summary:
      "Jedes Kraftfahrzeug muss zwei voneinander unabhängige Bremsanlagen haben (Betriebsbremse + Feststellbremse).",
    categories: ["technik"],
    keyFacts: [
      "Bremsweg-Formel: (Geschwindigkeit/10)² = Bremsweg in Metern",
      "Reaktionsweg: (Geschwindigkeit/10) × 3",
      "Gefahrbremsung: Bremsweg halbiert sich",
      "Anhalteweg = Reaktionsweg + Bremsweg",
      "Bei 100 km/h: Reaktionsweg 30m + Bremsweg 100m = 130m Anhalteweg",
    ],
  },

  // ─── Sicherheitsgurt ───────────────────────────────────────────
  {
    ref: "§ 21a StVO",
    title: "Sicherheitsgurte, Schutzhelme",
    summary:
      "Alle Insassen müssen während der Fahrt angeschnallt sein. Motorradfahrer müssen einen Schutzhelm tragen.",
    categories: ["verhalten", "persoenlich"],
    keyFacts: [
      "Kinder unter 12 Jahren und kleiner als 150 cm: Kindersitz Pflicht",
      "Bußgeld ohne Gurt: 30€, bei Kindern ohne Sicherung: 60€ + 1 Punkt",
    ],
  },

  // ─── Handy am Steuer ───────────────────────────────────────────
  {
    ref: "§ 23 StVO",
    title: "Sonstige Pflichten — Handy-Verbot",
    summary:
      "Ein Mobiltelefon darf während der Fahrt nur benutzt werden, wenn es nicht in der Hand gehalten wird (Freisprechanlage erlaubt).",
    categories: ["verhalten", "gefahrenlehre"],
    keyFacts: [
      "Bußgeld: 100€ + 1 Punkt (beim Fahrrad: 55€)",
      "In der Probezeit: B-Verstoß + Aufbauseminar",
    ],
  },

  // ─── Bahnübergänge ──────────────────────────────────────────────
  {
    ref: "§ 19 StVO",
    title: "Bahnübergänge",
    summary:
      "An Bahnübergängen hat der Schienenverkehr immer Vorrang. Rotlicht und geschlossene Schranken dürfen nicht überfahren werden.",
    categories: ["vorfahrt", "verkehrszeichen"],
    keyFacts: [
      "Andreaskreuz: Schienenverkehr hat Vorfahrt",
      "Bei Rotlicht: sofort anhalten, auch wenn Schranke noch offen",
      "Halte- und Parkverbot: 10m vor Andreaskreuz",
    ],
  },
];

/**
 * Find relevant StVO paragraphs for a category
 */
export function getStVOForCategory(categoryId: string): StVOParagraph[] {
  return stvoParagraphs.filter((p) => p.categories.includes(categoryId));
}

/**
 * Find StVO paragraphs matching a search term
 */
export function searchStVO(query: string): StVOParagraph[] {
  const q = query.toLowerCase();
  return stvoParagraphs.filter(
    (p) =>
      p.ref.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.keyFacts?.some((f) => f.toLowerCase().includes(q))
  );
}

/**
 * Format StVO context for the AI-Tutor system prompt
 */
export function formatStVOContext(paragraphs: StVOParagraph[]): string {
  if (paragraphs.length === 0) return "";
  const lines = paragraphs.map((p) => {
    const facts = p.keyFacts?.map((f) => `  - ${f}`).join("\n") ?? "";
    return `${p.ref} — ${p.title}: ${p.summary}${facts ? "\n" + facts : ""}`;
  });
  return `Relevante StVO-Paragraphen:\n${lines.join("\n\n")}`;
}
