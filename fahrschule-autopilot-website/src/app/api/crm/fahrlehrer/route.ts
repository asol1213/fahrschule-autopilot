import { NextRequest, NextResponse } from "next/server";
import { fahrlehrerDb } from "@/lib/db/store";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-fahrlehrer", 60, 60_000);

/**
 * GET /api/crm/fahrlehrer?tenantId=xxx
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

  const data = await fahrlehrerDb.getByTenant(tenantId);
  return NextResponse.json({ data });
}

/**
 * POST /api/crm/fahrlehrer
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "vorname", "nachname", "telefon"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Pflichtfelder fehlen", missing }, { status: 400 });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const fahrlehrer = await fahrlehrerDb.create({
      tenantId: body.tenantId,
      vorname: body.vorname,
      nachname: body.nachname,
      telefon: body.telefon,
      email: body.email,
      fuehrerscheinklassen: body.fuehrerscheinklassen || ["B"],
      aktiv: body.aktiv ?? true,
    });

    if (!fahrlehrer) {
      return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
    }

    return NextResponse.json({ data: fahrlehrer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

/**
 * PATCH /api/crm/fahrlehrer
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

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    // Tenant validation: verify fahrlehrer belongs to user's tenant
    const current = await fahrlehrerDb.getById(body.id, auth.tenantId);
    if (!current) {
      return NextResponse.json({ error: "Fahrlehrer nicht gefunden" }, { status: 404 });
    }

    const updated = await fahrlehrerDb.update(body.id, body, auth.tenantId);
    if (!updated) {
      return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
