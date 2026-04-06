import { describe, it, expect } from "vitest";
import {
  LeadFromCallSchema,
  WebhookEventSchema,
  ChatbotMessageSchema,
  NewsletterSchema,
  StornierungSchema,
  MahnwesenSchema,
  CalendarSyncSchema,
  SocialPostSchema,
  GmbPostSchema,
  OutreachSchema,
  AnmeldungSchema,
  validateBody,
  isValidationError,
} from "@/lib/validation";

// ===================================================================
// LeadFromCallSchema
// ===================================================================
describe("LeadFromCallSchema", () => {
  const validLead = {
    tenantId: "tenant-123",
    callId: "call-456",
    callerName: "Max Mustermann",
    callerPhone: "+491234567890",
    callerEmail: "max@test.de",
    intent: "anmeldung",
    sentiment: "positive" as const,
    summary: "Interessent moechte Fuehrerschein machen",
    licenseClass: "B",
    isNewLead: true,
    needsFollowUp: false,
  };

  it("accepts valid lead with all fields", () => {
    expect(LeadFromCallSchema.safeParse(validLead).success).toBe(true);
  });

  it("accepts minimal lead with only tenantId", () => {
    expect(LeadFromCallSchema.safeParse({ tenantId: "t1" }).success).toBe(true);
  });

  it("rejects missing tenantId", () => {
    const { tenantId, ...rest } = validLead;
    expect(LeadFromCallSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty tenantId", () => {
    expect(LeadFromCallSchema.safeParse({ ...validLead, tenantId: "" }).success).toBe(false);
  });

  it("rejects invalid sentiment value", () => {
    expect(
      LeadFromCallSchema.safeParse({ ...validLead, sentiment: "angry" }).success
    ).toBe(false);
  });

  it("accepts all valid sentiment values", () => {
    for (const sentiment of ["positive", "neutral", "negative"]) {
      expect(
        LeadFromCallSchema.safeParse({ tenantId: "t1", sentiment }).success
      ).toBe(true);
    }
  });

  it("rejects callerEmail with invalid format", () => {
    expect(
      LeadFromCallSchema.safeParse({ ...validLead, callerEmail: "not-email" }).success
    ).toBe(false);
  });

  it("rejects callerName exceeding max length", () => {
    expect(
      LeadFromCallSchema.safeParse({ ...validLead, callerName: "x".repeat(201) }).success
    ).toBe(false);
  });

  it("rejects summary exceeding 2000 chars", () => {
    expect(
      LeadFromCallSchema.safeParse({ ...validLead, summary: "x".repeat(2001) }).success
    ).toBe(false);
  });
});

// ===================================================================
// WebhookEventSchema
// ===================================================================
describe("WebhookEventSchema (complete)", () => {
  it("accepts all valid event types", () => {
    const types = ["anmeldung.neu", "anruf.beendet", "whatsapp.empfangen", "zahlung.eingang"];
    for (const type of types) {
      expect(
        WebhookEventSchema.safeParse({ type, tenantId: "t1", data: {} }).success
      ).toBe(true);
    }
  });

  it("rejects unknown event type", () => {
    expect(
      WebhookEventSchema.safeParse({ type: "unknown.type", tenantId: "t1", data: {} }).success
    ).toBe(false);
  });

  it("rejects missing data field", () => {
    expect(
      WebhookEventSchema.safeParse({ type: "anmeldung.neu", tenantId: "t1" }).success
    ).toBe(false);
  });

  it("rejects empty tenantId", () => {
    expect(
      WebhookEventSchema.safeParse({ type: "anmeldung.neu", tenantId: "", data: {} }).success
    ).toBe(false);
  });

  it("accepts optional timestamp", () => {
    const result = WebhookEventSchema.safeParse({
      type: "anmeldung.neu",
      tenantId: "t1",
      data: { name: "Max" },
      timestamp: "2026-04-01T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts arbitrary data values", () => {
    const result = WebhookEventSchema.safeParse({
      type: "zahlung.eingang",
      tenantId: "t1",
      data: { betrag: 100, nested: { key: "value" } },
    });
    expect(result.success).toBe(true);
  });
});

// ===================================================================
// ChatbotMessageSchema
// ===================================================================
describe("ChatbotMessageSchema (complete)", () => {
  it("accepts message at exactly 1 character", () => {
    expect(ChatbotMessageSchema.safeParse({ message: "A" }).success).toBe(true);
  });

  it("accepts message at exactly 1000 characters", () => {
    expect(ChatbotMessageSchema.safeParse({ message: "x".repeat(1000) }).success).toBe(true);
  });

  it("rejects empty message", () => {
    expect(ChatbotMessageSchema.safeParse({ message: "" }).success).toBe(false);
  });

  it("rejects message at 1001 characters", () => {
    expect(ChatbotMessageSchema.safeParse({ message: "x".repeat(1001) }).success).toBe(false);
  });

  it("rejects history with invalid role", () => {
    const result = ChatbotMessageSchema.safeParse({
      message: "Hi",
      history: [{ role: "system", content: "You are helpful" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts history with exactly 20 entries", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `msg ${i}`,
    }));
    expect(ChatbotMessageSchema.safeParse({ message: "Hi", history }).success).toBe(true);
  });

  it("rejects history entry with content > 2000 chars", () => {
    const result = ChatbotMessageSchema.safeParse({
      message: "Hi",
      history: [{ role: "user", content: "x".repeat(2001) }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts message without history", () => {
    expect(ChatbotMessageSchema.safeParse({ message: "Hallo" }).success).toBe(true);
  });
});

// ===================================================================
// NewsletterSchema
// ===================================================================
describe("NewsletterSchema (complete)", () => {
  it("accepts valid email", () => {
    expect(NewsletterSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects missing email", () => {
    expect(NewsletterSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid email format", () => {
    expect(NewsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects email exceeding 200 chars", () => {
    const longEmail = "a".repeat(190) + "@example.com";
    expect(NewsletterSchema.safeParse({ email: longEmail }).success).toBe(false);
  });

  it("rejects empty string email", () => {
    expect(NewsletterSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

// ===================================================================
// StornierungSchema
// ===================================================================
describe("StornierungSchema (complete)", () => {
  it("accepts valid UUID", () => {
    expect(
      StornierungSchema.safeParse({ fahrstundeId: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    expect(StornierungSchema.safeParse({ fahrstundeId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects missing fahrstundeId", () => {
    expect(StornierungSchema.safeParse({}).success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(StornierungSchema.safeParse({ fahrstundeId: "" }).success).toBe(false);
  });
});

// ===================================================================
// MahnwesenSchema
// ===================================================================
describe("MahnwesenSchema (complete)", () => {
  it("accepts valid tenantId", () => {
    expect(MahnwesenSchema.safeParse({ tenantId: "tenant-123" }).success).toBe(true);
  });

  it("rejects empty tenantId", () => {
    expect(MahnwesenSchema.safeParse({ tenantId: "" }).success).toBe(false);
  });

  it("rejects missing tenantId", () => {
    expect(MahnwesenSchema.safeParse({}).success).toBe(false);
  });
});

// ===================================================================
// CalendarSyncSchema
// ===================================================================
describe("CalendarSyncSchema", () => {
  it("accepts minimal valid input", () => {
    expect(CalendarSyncSchema.safeParse({ tenantId: "t1" }).success).toBe(true);
  });

  it("accepts full input with all optional fields", () => {
    const result = CalendarSyncSchema.safeParse({
      tenantId: "t1",
      calendarId: "cal-123",
      accessToken: "ya29.token",
      refreshToken: "1//refresh",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty tenantId", () => {
    expect(CalendarSyncSchema.safeParse({ tenantId: "" }).success).toBe(false);
  });

  it("rejects missing tenantId", () => {
    expect(CalendarSyncSchema.safeParse({}).success).toBe(false);
  });

  it("rejects calendarId exceeding 200 chars", () => {
    expect(
      CalendarSyncSchema.safeParse({ tenantId: "t1", calendarId: "x".repeat(201) }).success
    ).toBe(false);
  });

  it("rejects accessToken exceeding 2000 chars", () => {
    expect(
      CalendarSyncSchema.safeParse({ tenantId: "t1", accessToken: "x".repeat(2001) }).success
    ).toBe(false);
  });

  it("rejects refreshToken exceeding 2000 chars", () => {
    expect(
      CalendarSyncSchema.safeParse({ tenantId: "t1", refreshToken: "x".repeat(2001) }).success
    ).toBe(false);
  });
});

// ===================================================================
// SocialPostSchema
// ===================================================================
describe("SocialPostSchema", () => {
  it("accepts valid post", () => {
    const result = SocialPostSchema.safeParse({
      title: "Neue Kurse im Mai!",
      excerpt: "Ab sofort bieten wir neue Intensivkurse an.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(SocialPostSchema.safeParse({ title: "", excerpt: "text" }).success).toBe(false);
  });

  it("rejects empty excerpt", () => {
    expect(SocialPostSchema.safeParse({ title: "Title", excerpt: "" }).success).toBe(false);
  });

  it("rejects title exceeding 300 chars", () => {
    expect(
      SocialPostSchema.safeParse({ title: "x".repeat(301), excerpt: "text" }).success
    ).toBe(false);
  });

  it("rejects excerpt exceeding 500 chars", () => {
    expect(
      SocialPostSchema.safeParse({ title: "Title", excerpt: "x".repeat(501) }).success
    ).toBe(false);
  });

  it("accepts optional slug", () => {
    const result = SocialPostSchema.safeParse({
      title: "Test",
      excerpt: "Excerpt",
      slug: "test-post",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(SocialPostSchema.safeParse({}).success).toBe(false);
    expect(SocialPostSchema.safeParse({ title: "Only title" }).success).toBe(false);
  });
});

// ===================================================================
// GmbPostSchema
// ===================================================================
describe("GmbPostSchema (complete)", () => {
  it("accepts all valid types", () => {
    for (const type of ["post", "review_link", "update"]) {
      expect(GmbPostSchema.safeParse({ type }).success).toBe(true);
    }
  });

  it("rejects invalid type", () => {
    expect(GmbPostSchema.safeParse({ type: "invalid_type" }).success).toBe(false);
  });

  it("rejects missing type", () => {
    expect(GmbPostSchema.safeParse({}).success).toBe(false);
  });

  it("accepts optional placeId, fahrschulName, stadt, topic", () => {
    const result = GmbPostSchema.safeParse({
      type: "post",
      placeId: "ChIJ123",
      fahrschulName: "Fahrschule Mustermann",
      stadt: "Berlin",
      topic: "Sommerspecial",
    });
    expect(result.success).toBe(true);
  });

  it("rejects fahrschulName exceeding 200 chars", () => {
    expect(
      GmbPostSchema.safeParse({ type: "post", fahrschulName: "x".repeat(201) }).success
    ).toBe(false);
  });

  it("rejects topic exceeding 500 chars", () => {
    expect(
      GmbPostSchema.safeParse({ type: "post", topic: "x".repeat(501) }).success
    ).toBe(false);
  });
});

// ===================================================================
// OutreachSchema
// ===================================================================
describe("OutreachSchema (complete)", () => {
  const validOutreach = {
    fahrschulName: "Fahrschule Mueller",
    stadt: "Nuernberg",
  };

  it("accepts valid outreach with required fields only", () => {
    expect(OutreachSchema.safeParse(validOutreach).success).toBe(true);
  });

  it("accepts full outreach with all optional fields", () => {
    const result = OutreachSchema.safeParse({
      ...validOutreach,
      inhaber: "Hans Mueller",
      schuelerZahl: 150,
      googleBewertung: 4.5,
      typ: "erstansprache",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fahrschulName", () => {
    expect(OutreachSchema.safeParse({ stadt: "Berlin" }).success).toBe(false);
  });

  it("rejects empty fahrschulName", () => {
    expect(
      OutreachSchema.safeParse({ fahrschulName: "", stadt: "Berlin" }).success
    ).toBe(false);
  });

  it("rejects missing stadt", () => {
    expect(OutreachSchema.safeParse({ fahrschulName: "Test" }).success).toBe(false);
  });

  it("rejects empty stadt", () => {
    expect(
      OutreachSchema.safeParse({ fahrschulName: "Test", stadt: "" }).success
    ).toBe(false);
  });

  it("validates googleBewertung range 0-5", () => {
    expect(
      OutreachSchema.safeParse({ ...validOutreach, googleBewertung: 0 }).success
    ).toBe(true);
    expect(
      OutreachSchema.safeParse({ ...validOutreach, googleBewertung: 5 }).success
    ).toBe(true);
    expect(
      OutreachSchema.safeParse({ ...validOutreach, googleBewertung: -1 }).success
    ).toBe(false);
    expect(
      OutreachSchema.safeParse({ ...validOutreach, googleBewertung: 5.1 }).success
    ).toBe(false);
  });

  it("rejects negative schuelerZahl", () => {
    expect(
      OutreachSchema.safeParse({ ...validOutreach, schuelerZahl: -5 }).success
    ).toBe(false);
  });

  it("rejects non-integer schuelerZahl", () => {
    expect(
      OutreachSchema.safeParse({ ...validOutreach, schuelerZahl: 10.5 }).success
    ).toBe(false);
  });

  it("accepts all valid typ values", () => {
    for (const typ of ["erstansprache", "follow_up_3", "follow_up_7"]) {
      expect(OutreachSchema.safeParse({ ...validOutreach, typ }).success).toBe(true);
    }
  });

  it("rejects invalid typ value", () => {
    expect(
      OutreachSchema.safeParse({ ...validOutreach, typ: "invalid" }).success
    ).toBe(false);
  });

  it("rejects fahrschulName exceeding 200 chars", () => {
    expect(
      OutreachSchema.safeParse({ fahrschulName: "x".repeat(201), stadt: "Berlin" }).success
    ).toBe(false);
  });
});

// ===================================================================
// validateBody and isValidationError helpers
// ===================================================================
describe("validateBody and isValidationError", () => {
  it("returns data object for valid input", () => {
    const result = validateBody(NewsletterSchema, { email: "test@example.com" });
    expect(isValidationError(result)).toBe(false);
    if (!isValidationError(result)) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("returns error response for invalid input", () => {
    const result = validateBody(NewsletterSchema, { email: "bad" });
    expect(isValidationError(result)).toBe(true);
  });

  it("returns 400 status in error response", async () => {
    const result = validateBody(StornierungSchema, { fahrstundeId: "not-uuid" });
    if (isValidationError(result)) {
      expect(result.error.status).toBe(400);
    }
  });

  it("includes field-level issues in error response", async () => {
    const result = validateBody(AnmeldungSchema, { vorname: "" });
    if (isValidationError(result)) {
      const body = await result.error.json();
      expect(body.error).toBe("Validierungsfehler");
      expect(body.issues).toBeDefined();
      expect(Array.isArray(body.issues)).toBe(true);
    }
  });
});
