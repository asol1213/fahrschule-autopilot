import { NextRequest, NextResponse } from "next/server";
import { fahrstundenDb, zahlungenDb } from "@/lib/db/store";
import { emitEvent, DEFAULT_PREISE, FAHRSTUNDEN_LABELS } from "@/lib/events/emit";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { apiError, serverError } from "@/lib/api-errors";

const checkLimit = rateLimit("crm-fahrstunden", 60, 60_000);

/**
 * GET /api/crm/fahrstunden?tenantId=xxx&schuelerId=xxx&datum=xxx
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");
  const datum = req.nextUrl.searchParams.get("datum");
  const von = req.nextUrl.searchParams.get("von");
  const bis = req.nextUrl.searchParams.get("bis");

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  if (schuelerId && tenantId) {
    return NextResponse.json({ data: await fahrstundenDb.getBySchueler(schuelerId, tenantId) });
  }
  if (tenantId && von && bis) {
    return NextResponse.json({ data: await fahrstundenDb.getByDateRange(tenantId, von, bis) });
  }
  if (tenantId && datum) {
    return NextResponse.json({ data: await fahrstundenDb.getByDate(tenantId, datum) });
  }
  if (tenantId) {
    return NextResponse.json({ data: await fahrstundenDb.getByTenant(tenantId, { limit: 500 }) });
  }

  return apiError("VALIDATION_ERROR", "tenantId or schuelerId required");
}

/**
 * POST /api/crm/fahrstunden
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "schuelerId", "datum", "uhrzeit", "dauer"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return apiError("VALIDATION_ERROR", "Pflichtfelder fehlen", { missing });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const fahrstunde = await fahrstundenDb.create({
      tenantId: body.tenantId,
      schuelerId: body.schuelerId,
      fahrlehrerId: body.fahrlehrerId,
      datum: body.datum,
      uhrzeit: body.uhrzeit,
      dauer: body.dauer,
      typ: body.typ || "normal",
      status: body.status || "geplant",
      notizen: body.notizen,
    });

    if (!fahrstunde) {
      return apiError("SERVER_ERROR", "Fehler beim Anlegen");
    }

    // Event: Fahrstunde geplant
    emitEvent("fahrstunde.geplant", body.tenantId, {
      fahrstundeId: fahrstunde.id,
      schuelerId: body.schuelerId,
      datum: body.datum,
      uhrzeit: body.uhrzeit,
    });

    return NextResponse.json({ data: fahrstunde }, { status: 201 });
  } catch (err) {
    return serverError(err, { component: "crm-fahrstunden", action: "create" });
  }
}

/**
 * PATCH /api/crm/fahrstunden — Update (Bewertung, Status, etc.)
 * Auto-creates invoice when status changes to "abgeschlossen"
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    if (!body.id) {
      return apiError("VALIDATION_ERROR", "id required");
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    // Get current state before update + tenant validation
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("fahrstunden")
      .select("status, typ, schueler_id, tenant_id, dauer")
      .eq("id", body.id)
      .eq("tenant_id", auth.tenantId)
      .single();

    if (!current) {
      return apiError("NOT_FOUND", "Fahrstunde nicht gefunden");
    }

    const updated = await fahrstundenDb.update(body.id, body, auth.tenantId);
    if (!updated) {
      return apiError("SERVER_ERROR", "Fehler beim Aktualisieren");
    }

    // Auto-create invoice when lesson completed
    if (body.status === "abgeschlossen" && current?.status !== "abgeschlossen") {
      const typ = updated.typ || "normal";
      const preis = DEFAULT_PREISE[typ] || DEFAULT_PREISE.normal;
      const dauer = updated.dauer || 45;
      const multiplier = dauer > 45 ? 2 : 1;
      const betrag = preis * multiplier;

      const faelligAm = new Date();
      faelligAm.setDate(faelligAm.getDate() + 14); // 14 Tage Zahlungsziel

      await zahlungenDb.create({
        tenantId: updated.tenantId,
        schuelerId: updated.schuelerId,
        betrag,
        beschreibung: `${FAHRSTUNDEN_LABELS[typ] || typ} (${dauer} Min) — ${new Date(updated.datum).toLocaleDateString("de-DE")}`,
        status: "offen",
        faelligAm: faelligAm.toISOString().split("T")[0],
        mahnungsStufe: 0,
      });

      emitEvent("zahlung.erstellt", updated.tenantId, {
        schuelerId: updated.schuelerId,
        betrag,
        fahrstundeId: updated.id,
      });

      emitEvent("fahrstunde.abgeschlossen", updated.tenantId, {
        fahrstundeId: updated.id,
        schuelerId: updated.schuelerId,
        bewertung: updated.bewertung,
      });
    }

    // Event: No-Show
    if (body.status === "no_show" && current?.status !== "no_show") {
      emitEvent("fahrstunde.no_show", updated.tenantId, {
        fahrstundeId: updated.id,
        schuelerId: updated.schuelerId,
        datum: updated.datum,
      });
    }

    // Event: Cancelled
    if (body.status === "abgesagt" && current?.status !== "abgesagt") {
      emitEvent("fahrstunde.abgesagt", updated.tenantId, {
        fahrstundeId: updated.id,
        schuelerId: updated.schuelerId,
        datum: updated.datum,
      });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return serverError(err, { component: "crm-fahrstunden", action: "update" });
  }
}
