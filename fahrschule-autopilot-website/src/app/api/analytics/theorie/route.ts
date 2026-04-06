import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("analytics-theorie", 30, 60_000);

/**
 * GET /api/analytics/theorie?tenantId=xxx
 * Theorie-Trainer Analytics: Aktive Nutzer, Durchschnittsergebnis, Kategorien
 * Auth: Session (Dashboard)
 *
 * POST /api/analytics/theorie
 * Speichert Theorie-Events (einzeln oder als Batch)
 * Auth: None (public client tracking — validated by tenantId + userId)
 */

/* ------------------------------------------------------------------ */
/*  Validation helpers                                                 */
/* ------------------------------------------------------------------ */
const VALID_EVENT_TYPES = new Set([
  "question_answered", "quiz_completed", "session_started", "ai_tutor_used",
]);

const VALID_CATEGORIES = new Set([
  "gefahrenlehre", "verhalten", "vorfahrt", "verkehrszeichen",
  "umwelt", "technik", "persoenlich", "zusatzstoff_b",
]);

function sanitizeStr(val: unknown, maxLen: number): string | null {
  if (typeof val !== "string") return null;
  return val.slice(0, maxLen).trim() || null;
}

interface ValidatedEvent {
  event_type: string;
  kategorie: string | null;
  richtig: boolean | null;
  fehlerpunkte: number | null;
  dauer_sekunden: number | null;
}

function validateEvent(raw: Record<string, unknown>): ValidatedEvent | null {
  const eventType = typeof raw.eventType === "string" ? raw.eventType : null;
  if (!eventType || !VALID_EVENT_TYPES.has(eventType)) return null;

  const kategorie = sanitizeStr(raw.kategorie, 50);
  if (kategorie && !VALID_CATEGORIES.has(kategorie)) return null;

  return {
    event_type: eventType,
    kategorie,
    richtig: typeof raw.richtig === "boolean" ? raw.richtig : null,
    fehlerpunkte: typeof raw.fehlerpunkte === "number" && raw.fehlerpunkte >= 0
      ? Math.floor(raw.fehlerpunkte) : null,
    dauer_sekunden: typeof raw.dauer === "number" && raw.dauer >= 0
      ? Math.floor(raw.dauer) : null,
  };
}

/* ------------------------------------------------------------------ */
/*  GET handler                                                        */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const supabase = await createClient();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  // Only select needed columns instead of SELECT *
  const cols = "user_identifier, event_type, kategorie, richtig, created_at";

  const [
    { data: events30 },
    { data: events7 },
  ] = await Promise.all([
    supabase
      .from("theorie_events")
      .select(cols)
      .eq("tenant_id", tenantId)
      .gte("created_at", since30.toISOString()),
    supabase
      .from("theorie_events")
      .select(cols)
      .eq("tenant_id", tenantId)
      .gte("created_at", since7.toISOString()),
  ]);

  const all30 = events30 || [];
  const all7 = events7 || [];

  // Aktive Nutzer (unique user_identifier)
  const activeUsers30 = new Set(all30.map((e) => e.user_identifier)).size;
  const activeUsers7 = new Set(all7.map((e) => e.user_identifier)).size;

  // Fragen beantwortet
  const questions30 = all30.filter((e) => e.event_type === "question_answered");
  const questions7 = all7.filter((e) => e.event_type === "question_answered");

  // Richtig-Quote
  const richtig30 = questions30.filter((e) => e.richtig).length;
  const richtigRate30 = questions30.length > 0 ? Math.round((richtig30 / questions30.length) * 100) : 0;
  const richtig7 = questions7.filter((e) => e.richtig).length;
  const richtigRate7 = questions7.length > 0 ? Math.round((richtig7 / questions7.length) * 100) : 0;

  // Quizzes abgeschlossen
  const quizzes30 = all30.filter((e) => e.event_type === "quiz_completed").length;

  // AI Tutor Nutzung
  const tutorUsage30 = all30.filter((e) => e.event_type === "ai_tutor_used").length;

  // Kategorie-Verteilung
  const kategorien: Record<string, { total: number; richtig: number }> = {};
  questions30.forEach((e) => {
    const kat = (e.kategorie as string) || "Sonstige";
    if (!kategorien[kat]) kategorien[kat] = { total: 0, richtig: 0 };
    kategorien[kat].total++;
    if (e.richtig) kategorien[kat].richtig++;
  });
  const kategorieStats = Object.entries(kategorien)
    .map(([name, data]) => ({
      name,
      total: data.total,
      richtig: data.richtig,
      rate: data.total > 0 ? Math.round((data.richtig / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Aktivität pro Tag (letzte 14 Tage)
  const aktivitaetMap = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    aktivitaetMap.set(d.toISOString().split("T")[0], 0);
  }
  all30.forEach((e) => {
    const day = (e.created_at as string).split("T")[0];
    if (aktivitaetMap.has(day)) aktivitaetMap.set(day, (aktivitaetMap.get(day) || 0) + 1);
  });
  const aktivitaetProTag = Array.from(aktivitaetMap.entries())
    .map(([tag, count]) => ({
      tag,
      label: new Date(tag).toLocaleDateString("de-DE", { weekday: "short", day: "numeric" }),
      count,
    }))
    .reverse();

  return NextResponse.json({
    tenantId,
    monat: {
      aktiveNutzer: activeUsers30,
      fragenBeantwortet: questions30.length,
      richtigRate: richtigRate30,
      quizzesAbgeschlossen: quizzes30,
      aiTutorNutzung: tutorUsage30,
    },
    woche: {
      aktiveNutzer: activeUsers7,
      fragenBeantwortet: questions7.length,
      richtigRate: richtigRate7,
    },
    kategorieStats,
    aktivitaetProTag,
  });
}

/* ------------------------------------------------------------------ */
/*  POST handler — supports batch and single-event formats             */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const supabase = await createClient();

    const tenantId = sanitizeStr(body.tenantId, 100);
    const userId = sanitizeStr(body.userId, 100);
    if (!tenantId || !userId) {
      return NextResponse.json({ error: "tenantId and userId required" }, { status: 400 });
    }

    // Support batch format: { tenantId, userId, events: [...] }
    // and legacy single-event format: { tenantId, userId, eventType, ... }
    const rawEvents: Record<string, unknown>[] = Array.isArray(body.events)
      ? body.events.slice(0, 100) // Cap at 100 events per batch
      : [body];

    const rows: Array<{
      tenant_id: string;
      user_identifier: string;
      event_type: string;
      kategorie: string | null;
      richtig: boolean | null;
      fehlerpunkte: number | null;
      dauer_sekunden: number | null;
    }> = [];

    for (const raw of rawEvents) {
      const validated = validateEvent(raw);
      if (!validated) continue;
      rows.push({
        tenant_id: tenantId,
        user_identifier: userId,
        ...validated,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid events" }, { status: 400 });
    }

    const { error } = await supabase.from("theorie_events").insert(rows);

    if (error) {
      console.error("Analytics insert error:", error.code);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: rows.length });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
