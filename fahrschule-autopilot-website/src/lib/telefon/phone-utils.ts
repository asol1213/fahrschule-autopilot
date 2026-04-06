/**
 * Deutsche Telefonnummern — Normalisierung & Vergleich
 *
 * Deutsche Nummern können in verschiedenen Formaten ankommen:
 * - International: +49 176 12345678, 0049 176 12345678
 * - National: 0176 12345678, 0176/12345678
 * - Ohne Prefix: 176 12345678
 *
 * Normalisiert auf nationales Format: 017612345678
 */

/**
 * Normalisiert eine deutsche Telefonnummer auf nationales Format (0xxx...).
 * Entfernt Leerzeichen, Bindestriche, Schrägstriche, Klammern.
 */
export function normalizeGermanPhone(raw: string | null | undefined): string {
  if (!raw) return "";

  // Alle nicht-numerischen Zeichen entfernen, außer führendes +
  let cleaned = raw.trim();
  const hasPlus = cleaned.startsWith("+");
  cleaned = cleaned.replace(/[^\d]/g, "");

  // +49 Prefix → nationale Vorwahl mit 0
  if (hasPlus && cleaned.startsWith("49")) {
    cleaned = "0" + cleaned.slice(2);
  }
  // 0049 Prefix → nationale Vorwahl mit 0
  else if (cleaned.startsWith("0049")) {
    cleaned = "0" + cleaned.slice(4);
  }
  // Keine Vorwahl → 0 voranstellen (z.B. "17612345678" → "017612345678")
  else if (!cleaned.startsWith("0") && cleaned.length >= 10) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

/**
 * Vergleicht zwei Telefonnummern nach Normalisierung.
 * Prüft ob die letzten 9+ Ziffern übereinstimmen (deckt regionale Varianten ab).
 */
export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const normA = normalizeGermanPhone(a);
  const normB = normalizeGermanPhone(b);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Suffix-Vergleich: mindestens 9 Ziffern müssen übereinstimmen
  const minSuffix = 9;
  const suffixA = normA.slice(-minSuffix);
  const suffixB = normB.slice(-minSuffix);

  return suffixA.length >= minSuffix && suffixA === suffixB;
}

/**
 * Extrahiert einen ILIKE-kompatiblen Suffix für Supabase-Queries.
 * Gibt die letzten 9 Ziffern zurück für flexible Suche.
 */
export function phoneSearchSuffix(raw: string | null | undefined): string {
  const normalized = normalizeGermanPhone(raw);
  if (normalized.length < 9) return normalized;
  return normalized.slice(-9);
}
