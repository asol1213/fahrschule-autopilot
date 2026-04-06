import { describe, it, expect } from "vitest";
import {
  AnmeldungSchema,
  ChatbotMessageSchema,
  WebhookEventSchema,
  OutreachSchema,
  StornierungSchema,
  MahnwesenSchema,
  NewsletterSchema,
  GmbPostSchema,
  validateBody,
  isValidationError,
} from "@/lib/validation";

describe("AnmeldungSchema", () => {
  const valid = {
    vorname: "Max",
    nachname: "Mustermann",
    geburtsdatum: "2000-01-15",
    email: "max@example.com",
    telefon: "+49 171 1234567",
    plz: "90766",
    ort: "Fürth",
    fuehrerscheinklasse: "B" as const,
    dsgvo: true as const,
    kontaktEinwilligung: true as const,
  };

  it("accepts valid registration", () => {
    const result = AnmeldungSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects missing vorname", () => {
    const result = AnmeldungSchema.safeParse({ ...valid, vorname: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = AnmeldungSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid PLZ", () => {
    const result = AnmeldungSchema.safeParse({ ...valid, plz: "1234" });
    expect(result.success).toBe(false);
  });

  it("rejects dsgvo false", () => {
    const result = AnmeldungSchema.safeParse({ ...valid, dsgvo: false });
    expect(result.success).toBe(false);
  });

  it("rejects invalid fuehrerscheinklasse", () => {
    const result = AnmeldungSchema.safeParse({ ...valid, fuehrerscheinklasse: "Z" });
    expect(result.success).toBe(false);
  });

  it("accepts optional tenantId as UUID", () => {
    const result = AnmeldungSchema.safeParse({
      ...valid,
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID tenantId", () => {
    const result = AnmeldungSchema.safeParse({ ...valid, tenantId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("ChatbotMessageSchema", () => {
  it("accepts valid message", () => {
    const result = ChatbotMessageSchema.safeParse({ message: "Was kostet der Führerschein?" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = ChatbotMessageSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message > 1000 chars", () => {
    const result = ChatbotMessageSchema.safeParse({ message: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("accepts message with history", () => {
    const result = ChatbotMessageSchema.safeParse({
      message: "Noch eine Frage",
      history: [
        { role: "user", content: "Hallo" },
        { role: "assistant", content: "Wie kann ich helfen?" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects history > 20 entries", () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg ${i}`,
    }));
    const result = ChatbotMessageSchema.safeParse({ message: "test", history });
    expect(result.success).toBe(false);
  });
});

describe("WebhookEventSchema", () => {
  it("accepts valid event", () => {
    const result = WebhookEventSchema.safeParse({
      type: "anmeldung.neu",
      tenantId: "tenant-1",
      data: { vorname: "Max" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown event type", () => {
    const result = WebhookEventSchema.safeParse({
      type: "unknown.event",
      tenantId: "t1",
      data: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("OutreachSchema", () => {
  it("accepts valid outreach", () => {
    const result = OutreachSchema.safeParse({
      fahrschulName: "Fahrschule Müller",
      stadt: "Nürnberg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing stadt", () => {
    const result = OutreachSchema.safeParse({ fahrschulName: "Test" });
    expect(result.success).toBe(false);
  });

  it("validates googleBewertung range", () => {
    expect(OutreachSchema.safeParse({
      fahrschulName: "Test", stadt: "Test", googleBewertung: 4.5,
    }).success).toBe(true);
    expect(OutreachSchema.safeParse({
      fahrschulName: "Test", stadt: "Test", googleBewertung: 6,
    }).success).toBe(false);
  });
});

describe("StornierungSchema", () => {
  it("accepts valid UUID", () => {
    const result = StornierungSchema.safeParse({
      fahrstundeId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID", () => {
    const result = StornierungSchema.safeParse({ fahrstundeId: "not-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("MahnwesenSchema", () => {
  it("accepts tenantId", () => {
    expect(MahnwesenSchema.safeParse({ tenantId: "t1" }).success).toBe(true);
  });
  it("rejects empty", () => {
    expect(MahnwesenSchema.safeParse({ tenantId: "" }).success).toBe(false);
  });
});

describe("NewsletterSchema", () => {
  it("accepts valid email", () => {
    expect(NewsletterSchema.safeParse({ email: "test@example.com" }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(NewsletterSchema.safeParse({ email: "invalid" }).success).toBe(false);
  });
});

describe("GmbPostSchema", () => {
  it("accepts review_link type", () => {
    const result = GmbPostSchema.safeParse({ type: "review_link", placeId: "ChIJ..." });
    expect(result.success).toBe(true);
  });
  it("rejects invalid type", () => {
    const result = GmbPostSchema.safeParse({ type: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("validateBody helper", () => {
  it("returns data for valid input", () => {
    const result = validateBody(NewsletterSchema, { email: "test@example.com" });
    expect(isValidationError(result)).toBe(false);
    if (!isValidationError(result)) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("returns error for invalid input", () => {
    const result = validateBody(NewsletterSchema, { email: "invalid" });
    expect(isValidationError(result)).toBe(true);
  });
});
