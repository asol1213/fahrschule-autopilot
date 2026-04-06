import { describe, it, expect } from "vitest";
import { DEFAULT_PREISE, FAHRSTUNDEN_LABELS } from "@/lib/events/emit";

describe("CRM Event System", () => {
  describe("DEFAULT_PREISE", () => {
    it("has prices for all 5 lesson types", () => {
      expect(DEFAULT_PREISE).toHaveProperty("normal");
      expect(DEFAULT_PREISE).toHaveProperty("sonderfahrt_ueberlandfahrt");
      expect(DEFAULT_PREISE).toHaveProperty("sonderfahrt_autobahnfahrt");
      expect(DEFAULT_PREISE).toHaveProperty("sonderfahrt_nachtfahrt");
      expect(DEFAULT_PREISE).toHaveProperty("pruefungsvorbereitung");
    });

    it("all prices are positive numbers", () => {
      for (const [, price] of Object.entries(DEFAULT_PREISE)) {
        expect(price).toBeGreaterThan(0);
        expect(typeof price).toBe("number");
      }
    });

    it("Sonderfahrten are more expensive than normal", () => {
      expect(DEFAULT_PREISE.sonderfahrt_ueberlandfahrt).toBeGreaterThanOrEqual(DEFAULT_PREISE.normal);
      expect(DEFAULT_PREISE.sonderfahrt_autobahnfahrt).toBeGreaterThanOrEqual(DEFAULT_PREISE.normal);
      expect(DEFAULT_PREISE.sonderfahrt_nachtfahrt).toBeGreaterThanOrEqual(DEFAULT_PREISE.normal);
    });
  });

  describe("FAHRSTUNDEN_LABELS", () => {
    it("has German labels for all 5 lesson types", () => {
      expect(FAHRSTUNDEN_LABELS).toHaveProperty("normal");
      expect(FAHRSTUNDEN_LABELS).toHaveProperty("sonderfahrt_ueberlandfahrt");
      expect(FAHRSTUNDEN_LABELS).toHaveProperty("sonderfahrt_autobahnfahrt");
      expect(FAHRSTUNDEN_LABELS).toHaveProperty("sonderfahrt_nachtfahrt");
      expect(FAHRSTUNDEN_LABELS).toHaveProperty("pruefungsvorbereitung");
    });

    it("all labels are non-empty strings", () => {
      for (const [, label] of Object.entries(FAHRSTUNDEN_LABELS)) {
        expect(typeof label).toBe("string");
        expect(label.length).toBeGreaterThan(0);
      }
    });
  });
});
