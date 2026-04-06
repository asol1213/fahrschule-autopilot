import { NextRequest, NextResponse } from "next/server";
import { kommunikationDb } from "@/lib/db/store";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-kommunikation", 60, 60_000);

/**
 * GET /api/crm/kommunikation?schuelerId=xxx&tenantId=xxx
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  if (schuelerId) {
    return NextResponse.json({ data: await kommunikationDb.getBySchueler(schuelerId, tenantId) });
  }

  return NextResponse.json({ error: "schuelerId required" }, { status: 400 });
}

/**
 * POST /api/crm/kommunikation
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "schuelerId", "kanal", "richtung", "inhalt"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Pflichtfelder fehlen", missing }, { status: 400 });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const kommunikation = await kommunikationDb.create({
      tenantId: body.tenantId,
      schuelerId: body.schuelerId,
      kanal: body.kanal,
      richtung: body.richtung,
      betreff: body.betreff,
      inhalt: body.inhalt,
      datum: body.datum || new Date().toISOString(),
    });

    if (!kommunikation) {
      return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
    }

    return NextResponse.json({ data: kommunikation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}
