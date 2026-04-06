import { describe, it, expect } from "vitest";
import { AnmeldungSchema, validateBody, isValidationError } from "@/lib/validation";

/**
 * Integration-style tests for the Anmeldung (registration) validation.
 *
 * Tests mirror the validation logic in both:
 * - The Zod schema (AnmeldungSchema)
 * - The route-level checks in /api/anmeldung/route.ts (REQUIRED_FIELDS, email regex, PLZ regex)
 */

const validAnmeldung = {
  vorname: "Max",
  nachname: "Mustermann",
  geburtsdatum: "2000-01-15",
  email: "max@fahrschule.de",
  telefon: "+49 171 1234567",
  plz: "90766",
  ort: "Fuerth",
  fuehrerscheinklasse: "B" as const,
  dsgvo: true as const,
  kontaktEinwilligung: true as const,
};

// ---------------------------------------------------------------------------
// Route-level REQUIRED_FIELDS mirror (same list as in route.ts)
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
  "vorname",
  "nachname",
  "geburtsdatum",
  "email",
  "telefon",
  "plz",
  "ort",
  "fuehrerscheinklasse",
  "dsgvo",
  "kontaktEinwilligung",
];

/**
 * Route-level validation: checks that required fields are present and non-empty.
 * Boolean fields must be truthy.
 */
function validateRequiredFields(body: Record<string, unknown>): string[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    if (typeof value === "boolean") return !value;
    return !value || (typeof value === "string" && value.trim() === "");
  });
}

// ---------------------------------------------------------------------------
// Tests: Required fields
// ---------------------------------------------------------------------------

describe("Anmeldung required fields", () => {
  it("all required fields present passes validation", () => {
    const missing = validateRequiredFields(validAnmeldung);
    expect(missing).toEqual([]);
  });

  it.each(REQUIRED_FIELDS)("missing '%s' is detected", (field) => {
    const body = { ...validAnmeldung, [field]: undefined };
    const missing = validateRequiredFields(body);
    expect(missing).toContain(field);
  });

  it("empty string vorname is detected as missing", () => {
    const body = { ...validAnmeldung, vorname: "" };
    const missing = validateRequiredFields(body);
    expect(missing).toContain("vorname");
  });

  it("whitespace-only nachname is detected as missing", () => {
    const body = { ...validAnmeldung, nachname: "   " };
    const missing = validateRequiredFields(body);
    expect(missing).toContain("nachname");
  });

  it("dsgvo=false is detected as missing (must be true)", () => {
    const body = { ...validAnmeldung, dsgvo: false };
    const missing = validateRequiredFields(body);
    expect(missing).toContain("dsgvo");
  });

  it("kontaktEinwilligung=false is detected as missing", () => {
    const body = { ...validAnmeldung, kontaktEinwilligung: false };
    const missing = validateRequiredFields(body);
    expect(missing).toContain("kontaktEinwilligung");
  });
});

// ---------------------------------------------------------------------------
// Tests: Email format (route-level regex)
// ---------------------------------------------------------------------------

describe("Anmeldung email validation", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it("accepts standard email", () => {
    expect(emailRegex.test("max@example.com")).toBe(true);
  });

  it("accepts email with subdomain", () => {
    expect(emailRegex.test("user@mail.fahrschule.de")).toBe(true);
  });

  it("rejects email without @", () => {
    expect(emailRegex.test("maxexample.com")).toBe(false);
  });

  it("rejects email without domain", () => {
    expect(emailRegex.test("max@")).toBe(false);
  });

  it("rejects email with spaces", () => {
    expect(emailRegex.test("max @example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(emailRegex.test("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: PLZ format (5 digits)
// ---------------------------------------------------------------------------

describe("Anmeldung PLZ validation", () => {
  const plzRegex = /^\d{5}$/;

  it("accepts valid 5-digit PLZ", () => {
    expect(plzRegex.test("90766")).toBe(true);
    expect(plzRegex.test("10115")).toBe(true);
    expect(plzRegex.test("01067")).toBe(true);
  });

  it("rejects 4-digit PLZ", () => {
    expect(plzRegex.test("1234")).toBe(false);
  });

  it("rejects 6-digit PLZ", () => {
    expect(plzRegex.test("123456")).toBe(false);
  });

  it("rejects PLZ with letters", () => {
    expect(plzRegex.test("9076A")).toBe(false);
  });

  it("rejects PLZ with spaces", () => {
    expect(plzRegex.test("90 766")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(plzRegex.test("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: DSGVO consent requirement (Zod schema level)
// ---------------------------------------------------------------------------

describe("Anmeldung DSGVO consent (schema)", () => {
  it("rejects dsgvo: false via schema", () => {
    const result = AnmeldungSchema.safeParse({ ...validAnmeldung, dsgvo: false });
    expect(result.success).toBe(false);
  });

  it("rejects missing dsgvo via schema", () => {
    const { dsgvo: _, ...noDsgvo } = validAnmeldung;
    void _;
    const result = AnmeldungSchema.safeParse(noDsgvo);
    expect(result.success).toBe(false);
  });

  it("rejects dsgvo: 'true' (string) via schema", () => {
    const result = AnmeldungSchema.safeParse({ ...validAnmeldung, dsgvo: "true" });
    expect(result.success).toBe(false);
  });

  it("accepts dsgvo: true via schema", () => {
    const result = AnmeldungSchema.safeParse(validAnmeldung);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: tenantId UUID format
// ---------------------------------------------------------------------------

describe("Anmeldung tenantId format", () => {
  it("accepts valid UUID v4", () => {
    const result = AnmeldungSchema.safeParse({
      ...validAnmeldung,
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts omitted tenantId (optional field)", () => {
    const result = AnmeldungSchema.safeParse(validAnmeldung);
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID tenantId", () => {
    const result = AnmeldungSchema.safeParse({
      ...validAnmeldung,
      tenantId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects partial UUID tenantId", () => {
    const result = AnmeldungSchema.safeParse({
      ...validAnmeldung,
      tenantId: "550e8400-e29b",
    });
    expect(result.success).toBe(false);
  });

  it("also validates tenant_id field as UUID", () => {
    const result = AnmeldungSchema.safeParse({
      ...validAnmeldung,
      tenant_id: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: validateBody helper with AnmeldungSchema
// ---------------------------------------------------------------------------

describe("validateBody with AnmeldungSchema", () => {
  it("returns data for valid input", () => {
    const result = validateBody(AnmeldungSchema, validAnmeldung);
    expect(isValidationError(result)).toBe(false);
    if (!isValidationError(result)) {
      expect(result.data.vorname).toBe("Max");
      expect(result.data.email).toBe("max@fahrschule.de");
    }
  });

  it("returns error response for invalid input", () => {
    const result = validateBody(AnmeldungSchema, { vorname: "" });
    expect(isValidationError(result)).toBe(true);
  });

  it("returns error response that includes field-level issues", () => {
    const result = validateBody(AnmeldungSchema, {
      ...validAnmeldung,
      email: "not-valid",
      plz: "123",
    });
    expect(isValidationError(result)).toBe(true);
  });
});
