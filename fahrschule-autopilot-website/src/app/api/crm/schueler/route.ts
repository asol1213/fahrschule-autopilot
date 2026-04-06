import { NextRequest, NextResponse } from "next/server";
import { schuelerDb } from "@/lib/db/store";
import { emitEvent } from "@/lib/events/emit";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { apiError, serverError } from "@/lib/api-errors";

const checkLimit = rateLimit("crm-schueler", 60, 60_000);

/**
 * GET /api/crm/schueler?tenantId=xxx&status=xxx&search=xxx
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return apiError("VALIDATION_ERROR", "tenantId required");
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  let schueler;
  if (search) {
    schueler = await schuelerDb.search(tenantId, search);
  } else if (status) {
    schueler = await schuelerDb.getByStatus(tenantId, status);
  } else {
    schueler = await schuelerDb.getByTenant(tenantId, { limit: 500 });
  }

  return NextResponse.json({
    data: schueler,
    total: schueler.length,
  });
}

/**
 * POST /api/crm/schueler
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "vorname", "nachname", "email", "telefon", "geburtsdatum", "fuehrerscheinklasse"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return apiError("VALIDATION_ERROR", "Pflichtfelder fehlen", { missing });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const schueler = await schuelerDb.create({
      tenantId: body.tenantId,
      vorname: body.vorname,
      nachname: body.nachname,
      email: body.email,
      telefon: body.telefon,
      geburtsdatum: body.geburtsdatum,
      adresse: body.adresse || "",
      plz: body.plz || "",
      ort: body.ort || "",
      fuehrerscheinklasse: body.fuehrerscheinklasse,
      vorbesitz: body.vorbesitz,
      status: body.status || "angemeldet",
      fahrlehrerId: body.fahrlehrerId,
      anmeldungsDatum: body.anmeldungsDatum || new Date().toISOString().split("T")[0],
      notizen: body.notizen,
    });

    if (!schueler) {
      return apiError("SERVER_ERROR", "Fehler beim Anlegen");
    }

    return NextResponse.json({ data: schueler }, { status: 201 });
  } catch (err) {
    return serverError(err, { component: "crm-schueler", action: "create" });
  }
}

/**
 * PATCH /api/crm/schueler
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

    // Get current status for event detection + tenant validation
    const current = await schuelerDb.getById(body.id, auth.tenantId);
    if (!current) {
      return apiError("NOT_FOUND", "Schüler nicht gefunden");
    }

    const updated = await schuelerDb.update(body.id, body, auth.tenantId);
    if (!updated) {
      return apiError("SERVER_ERROR", "Fehler beim Aktualisieren");
    }

    // Emit status change event
    if (current && body.status && body.status !== current.status) {
      emitEvent("schueler.status_geaendert", updated.tenantId, {
        schuelerId: body.id,
        alterStatus: current.status,
        neuerStatus: body.status,
      });

      if (body.status === "bestanden") {
        emitEvent("schueler.bestanden", updated.tenantId, {
          schuelerId: body.id,
          name: `${updated.vorname} ${updated.nachname}`,
        });
      }
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    return serverError(err, { component: "crm-schueler", action: "update" });
  }
}
