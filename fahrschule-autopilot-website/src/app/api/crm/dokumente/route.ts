import { NextRequest, NextResponse } from "next/server";
import { dokumenteDb, schuelerDb } from "@/lib/db/store";
import { emitEvent } from "@/lib/events/emit";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-dokumente", 60, 60_000);

/**
 * GET /api/crm/dokumente?schuelerId=xxx&tenantId=xxx&fehlend=true
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const fehlend = req.nextUrl.searchParams.get("fehlend");

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  if (schuelerId && tenantId) {
    return NextResponse.json({ data: await dokumenteDb.getBySchueler(schuelerId, tenantId) });
  }
  if (tenantId && fehlend === "true") {
    return NextResponse.json({ data: await dokumenteDb.getFehlende(tenantId) });
  }

  return NextResponse.json({ error: "schuelerId or tenantId required" }, { status: 400 });
}

/**
 * POST /api/crm/dokumente
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "schuelerId", "typ"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Pflichtfelder fehlen", missing }, { status: 400 });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const dokument = await dokumenteDb.create({
      tenantId: body.tenantId,
      schuelerId: body.schuelerId,
      typ: body.typ,
      dateiname: body.dateiname,
      uploadDatum: body.uploadDatum,
      ablaufDatum: body.ablaufDatum,
      vorhanden: body.vorhanden ?? false,
    });

    if (!dokument) {
      return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
    }

    return NextResponse.json({ data: dokument }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

/**
 * PATCH /api/crm/dokumente
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

    // Tenant validation: verify document belongs to user's tenant
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("dokumente")
      .select("id, tenant_id")
      .eq("id", body.id)
      .eq("tenant_id", auth.tenantId)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    const updated = await dokumenteDb.update(body.id, body, auth.tenantId);
    if (!updated) {
      return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
    }

    // Auto-status transition: When all docs are present, advance student to "theorie"
    if (body.vorhanden === true && updated.schuelerId) {
      const allDocs = await dokumenteDb.getBySchueler(updated.schuelerId, updated.tenantId);
      const requiredTypes = ["sehtest", "erste_hilfe", "passfoto", "ausweis", "fuehrerschein_antrag"];
      const allPresent = requiredTypes.every((typ) =>
        allDocs.some((d) => d.typ === typ && d.vorhanden)
      );

      if (allPresent) {
        const schueler = await schuelerDb.getById(updated.schuelerId, auth.tenantId);
        if (schueler && (schueler.status === "angemeldet" || schueler.status === "dokumente_ausstehend")) {
          await schuelerDb.update(updated.schuelerId, { status: "theorie" }, auth.tenantId);
          emitEvent("schueler.status_geaendert", updated.tenantId, {
            schuelerId: updated.schuelerId,
            alterStatus: schueler.status,
            neuerStatus: "theorie",
            grund: "Alle Dokumente vollständig",
          });
        }
      }
    }

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
