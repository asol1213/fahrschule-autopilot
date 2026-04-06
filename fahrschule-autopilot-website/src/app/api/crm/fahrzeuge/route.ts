import { NextRequest, NextResponse } from "next/server";
import { fahrzeugeDb } from "@/lib/db/store";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-fahrzeuge", 60, 60_000);

/**
 * GET /api/crm/fahrzeuge?tenantId=xxx
 */
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

  const data = await fahrzeugeDb.getByTenant(tenantId);
  return NextResponse.json({ data });
}

/**
 * POST /api/crm/fahrzeuge
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "kennzeichen", "marke", "modell", "baujahr", "tuevBis"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Pflichtfelder fehlen", missing }, { status: 400 });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const fahrzeug = await fahrzeugeDb.create({
      tenantId: body.tenantId,
      kennzeichen: body.kennzeichen,
      marke: body.marke,
      modell: body.modell,
      baujahr: body.baujahr,
      fuehrerscheinklasse: body.fuehrerscheinklasse || "B",
      tuevBis: body.tuevBis,
      kilometerstand: body.kilometerstand ?? 0,
      status: body.status || "aktiv",
      notizen: body.notizen,
    });

    if (!fahrzeug) {
      return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
    }

    return NextResponse.json({ data: fahrzeug }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

/**
 * PATCH /api/crm/fahrzeuge
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Input validation
    if (body.kennzeichen !== undefined) {
      const kennzeichenPattern = /^[A-ZÄÖÜ]{1,3}-[A-ZÄÖÜ]{1,2}\s?\d{1,4}[A-Z]?$/;
      if (!kennzeichenPattern.test(body.kennzeichen)) {
        return NextResponse.json({ error: "Ungültiges Kennzeichen-Format (z.B. M-AB 1234)" }, { status: 400 });
      }
    }
    if (body.baujahr !== undefined) {
      const currentYear = new Date().getFullYear();
      if (body.baujahr < 1950 || body.baujahr > currentYear + 1) {
        return NextResponse.json({ error: `Baujahr muss zwischen 1950 und ${currentYear + 1} liegen` }, { status: 400 });
      }
    }
    if (body.kilometerstand !== undefined) {
      if (body.kilometerstand < 0) {
        return NextResponse.json({ error: "Kilometerstand darf nicht negativ sein" }, { status: 400 });
      }
    }

    // Get tenantId from body or look up from existing fahrzeug
    const tenantId = body.tenantId;

    const auth = await requireAuth(tenantId);
    if (!isAuthed(auth)) return auth;

    // Tenant validation: verify fahrzeug belongs to user's tenant
    const current = await fahrzeugeDb.getById(body.id, auth.tenantId);
    if (!current) {
      return NextResponse.json({ error: "Fahrzeug nicht gefunden" }, { status: 404 });
    }

    const updated = await fahrzeugeDb.update(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
