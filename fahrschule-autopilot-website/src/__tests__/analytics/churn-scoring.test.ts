import { describe, it, expect } from "vitest";

/**
 * Churn-Scoring-Logik, extrahiert aus /api/sales/churn für Testbarkeit.
 */

interface ChurnInput {
  aktiveSchueler: number;
  neueAnmeldungen30d: number;
  fahrstunden14d: number;
  totalSchueler: number;
}

interface ChurnResult {
  score: number;
  reasons: string[];
  empfohleneAktion: string;
}

function calculateChurnScore(input: ChurnInput): ChurnResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.aktiveSchueler === 0) {
    score += 40;
    reasons.push("Keine aktiven Schüler");
  } else if (input.aktiveSchueler <= 2) {
    score += 20;
    reasons.push("Nur " + input.aktiveSchueler + " aktive Schüler");
  }
  if (input.neueAnmeldungen30d === 0) {
    score += 25;
    reasons.push("Keine Neuanmeldungen (30 Tage)");
  }
  if (input.fahrstunden14d === 0) {
    score += 25;
    reasons.push("Keine Fahrstunden (14 Tage)");
  }
  if (input.totalSchueler === 0) {
    score += 10;
    reasons.push("Gar keine Schüler angelegt");
  }

  score = Math.min(score, 100);
  const empfohleneAktion =
    score >= 60 ? "Sofort anrufen" : score >= 30 ? "E-Mail senden" : "Beobachten";

  return { score, reasons, empfohleneAktion };
}

describe("calculateChurnScore", () => {
  it("returns max score for completely inactive tenant", () => {
    const result = calculateChurnScore({
      aktiveSchueler: 0,
      neueAnmeldungen30d: 0,
      fahrstunden14d: 0,
      totalSchueler: 0,
    });
    expect(result.score).toBe(100);
    expect(result.reasons).toHaveLength(4);
    expect(result.empfohleneAktion).toBe("Sofort anrufen");
  });

  it("returns 0 for healthy tenant", () => {
    const result = calculateChurnScore({
      aktiveSchueler: 15,
      neueAnmeldungen30d: 5,
      fahrstunden14d: 20,
      totalSchueler: 50,
    });
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
    expect(result.empfohleneAktion).toBe("Beobachten");
  });

  it("triggers for no new signups + no lessons", () => {
    const result = calculateChurnScore({
      aktiveSchueler: 10,
      neueAnmeldungen30d: 0,
      fahrstunden14d: 0,
      totalSchueler: 30,
    });
    expect(result.score).toBe(50);
    expect(result.reasons).toContain("Keine Neuanmeldungen (30 Tage)");
    expect(result.reasons).toContain("Keine Fahrstunden (14 Tage)");
    expect(result.empfohleneAktion).toBe("E-Mail senden");
  });

  it("distinguishes between 0 and <=2 active students", () => {
    const zero = calculateChurnScore({ aktiveSchueler: 0, neueAnmeldungen30d: 5, fahrstunden14d: 10, totalSchueler: 5 });
    const two = calculateChurnScore({ aktiveSchueler: 2, neueAnmeldungen30d: 5, fahrstunden14d: 10, totalSchueler: 5 });
    expect(zero.score).toBe(40);
    expect(two.score).toBe(20);
  });

  it("caps score at 100", () => {
    const result = calculateChurnScore({
      aktiveSchueler: 0,   // +40
      neueAnmeldungen30d: 0, // +25
      fahrstunden14d: 0,     // +25
      totalSchueler: 0,      // +10 = 100
    });
    expect(result.score).toBe(100);
  });

  it("recommends 'Sofort anrufen' for score >= 60", () => {
    const result = calculateChurnScore({ aktiveSchueler: 0, neueAnmeldungen30d: 0, fahrstunden14d: 0, totalSchueler: 10 });
    expect(result.score).toBe(90);
    expect(result.empfohleneAktion).toBe("Sofort anrufen");
  });

  it("recommends 'E-Mail senden' for score 30-59", () => {
    const result = calculateChurnScore({ aktiveSchueler: 1, neueAnmeldungen30d: 0, fahrstunden14d: 5, totalSchueler: 10 });
    expect(result.score).toBe(45);
    expect(result.empfohleneAktion).toBe("E-Mail senden");
  });

  it("recommends 'Beobachten' for score < 30", () => {
    const result = calculateChurnScore({ aktiveSchueler: 2, neueAnmeldungen30d: 3, fahrstunden14d: 10, totalSchueler: 20 });
    expect(result.score).toBe(20);
    expect(result.empfohleneAktion).toBe("Beobachten");
  });
});
