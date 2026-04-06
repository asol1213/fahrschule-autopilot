import { z } from "zod";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// Shared primitives
// ──────────────────────────────────────────────

const germanPhone = z.string().regex(/^[\d\s+\-()]{6,20}$/, "Ungültige Telefonnummer");
const germanPLZ = z.string().regex(/^\d{5}$/, "Ungültige PLZ (5 Ziffern)");
const email = z.string().email("Ungültige E-Mail-Adresse").max(200);
const fuehrerscheinklasse = z.enum(["B", "B96", "BE", "A", "A2", "A1", "AM", "Mofa", "L"]);

// ──────────────────────────────────────────────
// Anmeldung (Registration form)
// ──────────────────────────────────────────────

export const AnmeldungSchema = z.object({
  vorname: z.string().min(1).max(100),
  nachname: z.string().min(1).max(100),
  geburtsdatum: z.string().min(8).max(12),
  email,
  telefon: germanPhone,
  plz: germanPLZ,
  ort: z.string().min(1).max(100),
  strasse: z.string().max(200).optional(),
  adresse: z.string().max(200).optional(),
  fuehrerscheinklasse,
  dsgvo: z.literal(true, { error: "DSGVO-Einwilligung erforderlich" }),
  kontaktEinwilligung: z.literal(true, { error: "Kontakt-Einwilligung erforderlich" }),
  tenantId: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  // Optional fields
  vorbesitz: z.string().max(100).optional(),
  sehtest: z.boolean().optional(),
  ersteHilfe: z.boolean().optional(),
  theorieSprache: z.string().max(50).optional(),
  wochentage: z.array(z.string()).optional(),
  uhrzeiten: z.array(z.string()).optional(),
  anmerkungen: z.string().max(1000).optional(),
});

// ──────────────────────────────────────────────
// Lead from Call (Agent 2 → Agent 5)
// ──────────────────────────────────────────────

export const LeadFromCallSchema = z.object({
  tenantId: z.string().min(1),
  callId: z.string().optional(),
  callerName: z.string().max(200).optional(),
  callerPhone: z.string().max(30).optional(),
  callerEmail: z.string().email().max(200).optional(),
  intent: z.string().max(50).optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  summary: z.string().max(2000).optional(),
  licenseClass: z.string().max(10).optional(),
  isNewLead: z.boolean().optional(),
  needsFollowUp: z.boolean().optional(),
});

// ──────────────────────────────────────────────
// Webhook Event (inter-agent)
// ──────────────────────────────────────────────

export const WebhookEventSchema = z.object({
  type: z.enum(["anmeldung.neu", "anruf.beendet", "whatsapp.empfangen", "zahlung.eingang"]),
  tenantId: z.string().min(1),
  data: z.record(z.string(), z.any()),
  timestamp: z.string().optional(),
});

// ──────────────────────────────────────────────
// Chatbot message
// ──────────────────────────────────────────────

export const ChatbotMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(20).optional(),
});

// ──────────────────────────────────────────────
// Newsletter
// ──────────────────────────────────────────────

export const NewsletterSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse erforderlich").max(200),
});

// ──────────────────────────────────────────────
// Stornierung
// ──────────────────────────────────────────────

export const StornierungSchema = z.object({
  fahrstundeId: z.string().uuid(),
});

// ──────────────────────────────────────────────
// Mahnwesen
// ──────────────────────────────────────────────

export const MahnwesenSchema = z.object({
  tenantId: z.string().min(1),
});

// ──────────────────────────────────────────────
// Calendar Sync
// ──────────────────────────────────────────────

export const CalendarSyncSchema = z.object({
  tenantId: z.string().min(1),
  calendarId: z.string().max(200).optional(),
  accessToken: z.string().max(2000).optional(),
  refreshToken: z.string().max(2000).optional(),
});

// ──────────────────────────────────────────────
// Social / GMB
// ──────────────────────────────────────────────

export const SocialPostSchema = z.object({
  title: z.string().min(1).max(300),
  excerpt: z.string().min(1).max(500),
  slug: z.string().max(200).optional(),
});

export const GmbPostSchema = z.object({
  type: z.enum(["post", "review_link", "update"]),
  placeId: z.string().max(200).optional(),
  fahrschulName: z.string().max(200).optional(),
  stadt: z.string().max(100).optional(),
  topic: z.string().max(500).optional(),
});

// ──────────────────────────────────────────────
// Sales Outreach
// ──────────────────────────────────────────────

export const OutreachSchema = z.object({
  fahrschulName: z.string().min(1).max(200),
  stadt: z.string().min(1).max(100),
  inhaber: z.string().max(200).optional(),
  schuelerZahl: z.number().int().positive().optional(),
  googleBewertung: z.number().min(0).max(5).optional(),
  typ: z.enum(["erstansprache", "follow_up_3", "follow_up_7"]).optional(),
});

// ──────────────────────────────────────────────
// Validation helper
// ──────────────────────────────────────────────

/**
 * Parse and validate request body against a Zod schema.
 * Returns typed data on success or a 400 NextResponse on failure.
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  const issues = result.error.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
  return {
    error: NextResponse.json(
      { error: "Validierungsfehler", issues },
      { status: 400 }
    ),
  };
}

/**
 * Type guard for validateBody result.
 */
export function isValidationError<T>(
  result: { data: T } | { error: NextResponse }
): result is { error: NextResponse } {
  return "error" in result;
}
