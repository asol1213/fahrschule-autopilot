import { describe, it, expect } from "vitest";
import { splitName, normalizeLicenseClass } from "@/lib/crm/lead-from-call";

describe("Lead from Call Utilities", () => {
  describe("splitName", () => {
    it("splits a full name into vorname and nachname", () => {
      expect(splitName("Max Mustermann")).toEqual({ vorname: "Max", nachname: "Mustermann" });
    });

    it("handles multiple first names", () => {
      expect(splitName("Hans Peter Müller")).toEqual({ vorname: "Hans Peter", nachname: "Müller" });
    });

    it("handles single name", () => {
      expect(splitName("Max")).toEqual({ vorname: "Max", nachname: "" });
    });

    it("handles empty string", () => {
      expect(splitName("")).toEqual({ vorname: "Unbekannt", nachname: "" });
    });

    it("handles whitespace-only string", () => {
      expect(splitName("   ")).toEqual({ vorname: "Unbekannt", nachname: "" });
    });

    it("trims extra whitespace", () => {
      expect(splitName("  Max   Mustermann  ")).toEqual({ vorname: "Max", nachname: "Mustermann" });
    });
  });

  describe("normalizeLicenseClass", () => {
    it("defaults to B when undefined", () => {
      expect(normalizeLicenseClass(undefined)).toBe("B");
    });

    it("defaults to B when empty", () => {
      expect(normalizeLicenseClass("")).toBe("B");
    });

    it("accepts valid classes", () => {
      expect(normalizeLicenseClass("B")).toBe("B");
      expect(normalizeLicenseClass("A")).toBe("A");
      expect(normalizeLicenseClass("A1")).toBe("A1");
      expect(normalizeLicenseClass("A2")).toBe("A2");
      expect(normalizeLicenseClass("AM")).toBe("AM");
      expect(normalizeLicenseClass("BE")).toBe("BE");
      expect(normalizeLicenseClass("B96")).toBe("B96");
      expect(normalizeLicenseClass("BF17")).toBe("BF17");
    });

    it("normalizes case", () => {
      expect(normalizeLicenseClass("b")).toBe("B");
      expect(normalizeLicenseClass("am")).toBe("AM");
      expect(normalizeLicenseClass("be")).toBe("BE");
    });

    it("handles BF17 variants", () => {
      expect(normalizeLicenseClass("BF 17")).toBe("BF17");
      expect(normalizeLicenseClass("B17")).toBe("BF17");
    });

    it("handles B96 variant", () => {
      expect(normalizeLicenseClass("B 96")).toBe("B96");
    });

    it("defaults unknown classes to B", () => {
      expect(normalizeLicenseClass("C")).toBe("B");
      expect(normalizeLicenseClass("XYZ")).toBe("B");
    });
  });
});
