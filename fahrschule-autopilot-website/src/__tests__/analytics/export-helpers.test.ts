import { describe, it, expect } from "vitest";
import { statusLabel, typLabel, formatDate } from "@/lib/analytics/export-helpers";

describe("statusLabel", () => {
  it("maps all schueler statuses", () => {
    expect(statusLabel("angemeldet")).toBe("Angemeldet");
    expect(statusLabel("dokumente_ausstehend")).toBe("Dokumente ausstehend");
    expect(statusLabel("theorie")).toBe("In Theorie");
    expect(statusLabel("praxis")).toBe("In Praxis");
    expect(statusLabel("pruefung")).toBe("Prüfung geplant");
    expect(statusLabel("bestanden")).toBe("Bestanden");
    expect(statusLabel("abgebrochen")).toBe("Abgebrochen");
  });

  it("maps all zahlung statuses", () => {
    expect(statusLabel("offen")).toBe("Offen");
    expect(statusLabel("teilbezahlt")).toBe("Teilbezahlt");
    expect(statusLabel("bezahlt")).toBe("Bezahlt");
    expect(statusLabel("ueberfaellig")).toBe("Überfällig");
    expect(statusLabel("storniert")).toBe("Storniert");
  });

  it("maps fahrstunden statuses", () => {
    expect(statusLabel("geplant")).toBe("Geplant");
    expect(statusLabel("abgeschlossen")).toBe("Abgeschlossen");
    expect(statusLabel("abgesagt")).toBe("Abgesagt");
    expect(statusLabel("no_show")).toBe("No-Show");
  });

  it("returns raw string for unknown status", () => {
    expect(statusLabel("unknown_status")).toBe("unknown_status");
  });

  it("returns empty string for null/undefined", () => {
    expect(statusLabel(null)).toBe("");
    expect(statusLabel(undefined)).toBe("");
  });
});

describe("typLabel", () => {
  it("maps all fahrstunden types", () => {
    expect(typLabel("normal")).toBe("Normal");
    expect(typLabel("sonderfahrt_ueberlandfahrt")).toBe("Überlandfahrt");
    expect(typLabel("sonderfahrt_autobahnfahrt")).toBe("Autobahnfahrt");
    expect(typLabel("sonderfahrt_nachtfahrt")).toBe("Nachtfahrt");
    expect(typLabel("pruefungsvorbereitung")).toBe("Prüfungsvorbereitung");
  });

  it("returns raw string for unknown type", () => {
    expect(typLabel("custom")).toBe("custom");
  });

  it("returns empty string for null/undefined", () => {
    expect(typLabel(null)).toBe("");
    expect(typLabel(undefined)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats valid ISO date", () => {
    const result = formatDate("2026-03-15");
    expect(result).toMatch(/15/);
    expect(result).toMatch(/3/);
    expect(result).toMatch(/2026/);
  });

  it("formats ISO datetime", () => {
    const result = formatDate("2026-06-01T10:30:00Z");
    expect(result).toMatch(/1/);
    expect(result).toMatch(/6/);
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatDate("")).toBe("");
  });
});
