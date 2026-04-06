import { NextRequest, NextResponse } from "next/server";
import { zahlungenDb } from "@/lib/db/store";
import { emitEvent } from "@/lib/events/emit";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { apiError, serverError } from "@/lib/api-errors";

const checkLimit = rateLimit("crm-zahlungen", 60, 60_000);

/**
 * GET /api/crm/zahlungen?tenantId=xxx&schuelerId=xxx&status=offen
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");
  const status = req.nextUrl.searchParams.get("status");

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  if (schuelerId && tenantId) {
    return NextResponse.json({ data: await zahlungenDb.getBySchueler(schuelerId, tenantId) });
  }
  if (tenantId && status === "offen") {
    return NextResponse.json({ data: await zahlungenDb.getOffene(tenantId) });
  }
  if (tenantId) {
    const [data, summeOffen, summeBezahlt, summeGesamt] = await Promise.all([
      zahlungenDb.getByTenant(tenantId, { limit: 500 }),
      zahlungenDb.summe(tenantId, "offen"),
      zahlungenDb.summe(tenantId, "bezahlt"),
      zahlungenDb.summe(tenantId),
    ]);
    return NextResponse.json({ data, summeOffen, summeBezahlt, summeGesamt });
  }

  return apiError("VALIDATION_ERROR", "tenantId or schuelerId required");
}

/**
 * POST /api/crm/zahlungen
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "schuelerId", "betrag", "beschreibung", "faelligAm"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return apiError("VALIDATION_ERROR", "Pflichtfelder fehlen", { missing });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const zahlung = await zahlungenDb.create({
      tenantId: body.tenantId,
      schuelerId: body.schuelerId,
      betrag: body.betrag,
      beschreibung: body.beschreibung,
      status: body.status || "offen",
      faelligAm: body.faelligAm,
      bezahltAm: body.bezahltAm,
      mahnungsStufe: body.mahnungsStufe || 0,
    });

    if (!zahlung) {
      return apiError("SERVER_ERROR", "Fehler beim Anlegen");
    }

    return NextResponse.json({ data: zahlung }, { status: 201 });
  } catch (err) {
    return serverError(err, { component: "crm-zahlungen", action: "create" });
  }
}

/**
 * PATCH /api/crm/zahlungen
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

    // Get current state + tenant validation
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("zahlungen")
      .select("status, schueler_id, tenant_id, betrag")
      .eq("id", body.id)
      .eq("tenant_id", auth.tenantId)
      .single();

    if (!current) {
      return apiError("NOT_FOUND", "Zahlung nicht gefunden");
    }

    const updated = await zahlungenDb.update(body.id, body, auth.tenantId);
    if (!updated) {
      return apiError("SERVER_ERROR", "Fehler beim Aktualisieren");
    }

    // Emit events on status change
    if (current && body.status && body.status !== current.status) {
      if (body.status === "bezahlt") {
        emitEvent("zahlung.bezahlt", current.tenant_id, {
          zahlungId: body.id,
          schuelerId: current.schueler_id,
          betrag: current.betrag,
        });
      } else if (body.status === "ueberfaellig") {
        emitEvent("zahlung.ueberfaellig", current.tenant_id, {
          zahlungId: body.id,
          schuelerId: current.schueler_id,
          betrag: current.betrag,
        });
      }
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return serverError(err, { component: "crm-zahlungen", action: "update" });
  }
}
