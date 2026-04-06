import { describe, it, expect } from "vitest";
import { detectAnomalies, getISOWeek } from "@/lib/analytics/anomalies";

describe("getISOWeek", () => {
  it("returns correct ISO week for 2026-01-01 (Thursday → KW 1)", () => {
    expect(getISOWeek(new Date("2026-01-01"))).toBe(1);
  });

  it("returns correct ISO week for 2025-12-29 (Monday → KW 1 of 2026)", () => {
    expect(getISOWeek(new Date("2025-12-29"))).toBe(1);
  });

  it("returns KW 13 for late March 2026", () => {
    expect(getISOWeek(new Date("2026-03-30"))).toBe(14);
  });
});

describe("detectAnomalies", () => {
  it("returns empty array for normal data", () => {
    const noShows = [
      { rate: 5, count: 1 },
      { rate: 6, count: 1 },
      { rate: 4, count: 1 },
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
    ];
    const result = detectAnomalies(noShows, [], [], []);
    expect(result).toEqual([]);
  });

  it("detects high no-show rate anomaly", () => {
    const noShows = [
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
      { rate: 15, count: 3 }, // spike: 15% vs avg 5%
    ];
    const result = detectAnomalies(noShows, [], [], []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("warning");
    expect(result[0].title).toBe("Erhöhte No-Show-Rate");
    expect(result[0].metric).toBe("15%");
  });

  it("does NOT trigger no-show anomaly when rate <= 5%", () => {
    const noShows = [
      { rate: 2, count: 1 },
      { rate: 2, count: 1 },
      { rate: 2, count: 1 },
      { rate: 2, count: 1 },
      { rate: 4, count: 1 }, // above 20% increase but still <= 5%
    ];
    const result = detectAnomalies(noShows, [], [], []);
    expect(result).toEqual([]);
  });

  it("does NOT trigger with less than 5 data points", () => {
    const noShows = [
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
      { rate: 50, count: 10 },
    ];
    const result = detectAnomalies(noShows, [], [], []);
    expect(result).toEqual([]);
  });

  it("detects overdue payments > 500 EUR", () => {
    const zahlungen = [
      { status: "ueberfaellig", betrag: 300 },
      { status: "ueberfaellig", betrag: 400 },
      { status: "offen", betrag: 1000 }, // offen, not ueberfaellig
    ];
    const result = detectAnomalies([], zahlungen, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("danger");
    expect(result[0].title).toBe("Überfällige Zahlungen");
  });

  it("does NOT trigger for overdue < 500 EUR", () => {
    const zahlungen = [
      { status: "ueberfaellig", betrag: 200 },
      { status: "ueberfaellig", betrag: 100 },
    ];
    const result = detectAnomalies([], zahlungen, [], []);
    expect(result).toEqual([]);
  });

  it("detects pruefungsreif students (single)", () => {
    const result = detectAnomalies([], [], [], [{ name: "Max Müller", id: "1" }]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("info");
    expect(result[0].title).toBe("Prüfungskandidaten");
    expect(result[0].message).toContain("1 Schüler ist prüfungsreif");
    expect(result[0].message).toContain("Max Müller");
  });

  it("detects pruefungsreif students (multiple, shows max 5)", () => {
    const students = Array.from({ length: 7 }, (_, i) => ({
      name: `Schüler ${i + 1}`,
      id: String(i + 1),
    }));
    const result = detectAnomalies([], [], [], students);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain("7 Schüler sind prüfungsreif");
    expect(result[0].message).toContain("und 2 weitere");
  });

  it("detects high training count", () => {
    const schueler = Array.from({ length: 15 }, () => ({ status: "theorie" }));
    const result = detectAnomalies([], [], schueler, []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("info");
    expect(result[0].title).toBe("Schüler in Ausbildung");
  });

  it("does NOT trigger training count for <= 10", () => {
    const schueler = Array.from({ length: 10 }, () => ({ status: "praxis" }));
    const result = detectAnomalies([], [], schueler, []);
    expect(result).toEqual([]);
  });

  it("detects multiple anomalies simultaneously", () => {
    const noShows = [
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
      { rate: 5, count: 1 },
      { rate: 20, count: 5 },
    ];
    const zahlungen = [{ status: "ueberfaellig", betrag: 1000 }];
    const pruefungsreif = [{ name: "Anna Schmidt", id: "1" }];

    const result = detectAnomalies(noShows, zahlungen, [], pruefungsreif);
    expect(result).toHaveLength(3);
    expect(result.map((a) => a.type)).toEqual(["warning", "danger", "info"]);
  });
});
