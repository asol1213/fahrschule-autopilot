export interface Answer {
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  category: string;
  question: string;
  image: string | null;
  answers: Answer[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  questionCount: number;
}

export const categories: Category[] = [
  { id: "gefahrenlehre", name: "Gefahrenlehre", icon: "AlertTriangle", color: "red", description: "Bremsweg, Abstand, Überholen, Gefahrensituationen", questionCount: 518 },
  { id: "verhalten", name: "Verhalten im Straßenverkehr", icon: "Car", color: "blue", description: "Geschwindigkeit, Ampeln, Rettungsgasse, Reißverschluss", questionCount: 736 },
  { id: "vorfahrt", name: "Vorfahrt & Vorrang", icon: "Signpost", color: "yellow", description: "Rechts-vor-Links, Kreisverkehr, Vorfahrtsschilder", questionCount: 54 },
  { id: "verkehrszeichen", name: "Verkehrszeichen", icon: "ShieldCheck", color: "purple", description: "Gefahrzeichen, Vorschriftszeichen, Richtzeichen", questionCount: 228 },
  { id: "umwelt", name: "Umweltschutz", icon: "Leaf", color: "green", description: "Spritsparen, Emissionen, Umweltzone", questionCount: 99 },
  { id: "technik", name: "Fahrzeugtechnik", icon: "Wrench", color: "orange", description: "Reifen, Bremsen, Licht, Ölstand, TÜV", questionCount: 478 },
  { id: "persoenlich", name: "Persönliche Voraussetzungen", icon: "User", color: "cyan", description: "Alkohol, Drogen, Müdigkeit, Probezeit", questionCount: 17 },
  { id: "zusatzstoff_b", name: "Zusatzstoff Klasse B", icon: "FileText", color: "pink", description: "Anhänger, Autobahn, Tunnel, Ladung", questionCount: 179 },
];

/**
 * Load questions for a single category (lazy, code-split per chunk).
 */
export async function loadCategory(categoryId: string): Promise<Question[]> {
  switch (categoryId) {
    case "gefahrenlehre": return (await import("./gefahrenlehre.json")).default as Question[];
    case "verhalten": return (await import("./verhalten.json")).default as Question[];
    case "vorfahrt": return (await import("./vorfahrt.json")).default as Question[];
    case "verkehrszeichen": return (await import("./verkehrszeichen.json")).default as Question[];
    case "umwelt": return (await import("./umwelt.json")).default as Question[];
    case "technik": return (await import("./technik.json")).default as Question[];
    case "persoenlich": return (await import("./persoenlich.json")).default as Question[];
    case "zusatzstoff_b": return (await import("./zusatzstoff_b.json")).default as Question[];
    default: return [];
  }
}

/**
 * Load all questions across all categories (parallel, lazy).
 */
export async function loadAllQuestions(): Promise<Question[]> {
  const results = await Promise.all(categories.map((cat) => loadCategory(cat.id)));
  return results.flat();
}
