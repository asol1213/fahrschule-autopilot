import { NextRequest, NextResponse } from "next/server";
import { pruefungenDb, schuelerDb } from "@/lib/db/store";
import { emitEvent } from "@/lib/events/emit";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-pruefungen", 60, 60_000);

/**
 * GET /api/crm/pruefungen?tenantId=xxx&schuelerId=xxx
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  if (schuelerId && tenantId) {
    return NextResponse.json({ data: await pruefungenDb.getBySchueler(schuelerId, tenantId) });
  }
  if (tenantId) {
    const [data, bestehensquote] = await Promise.all([
      pruefungenDb.getByTenant(tenantId, { limit: 500 }),
      pruefungenDb.bestehensquote(tenantId),
    ]);
    return NextResponse.json({ data, bestehensquote });
  }

  return NextResponse.json({ error: "tenantId or schuelerId required" }, { status: 400 });
}

/**
 * POST /api/crm/pruefungen
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "schuelerId", "typ", "datum"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Pflichtfelder fehlen", missing }, { status: 400 });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const pruefung = await pruefungenDb.create({
      tenantId: body.tenantId,
      schuelerId: body.schuelerId,
      typ: body.typ,
      datum: body.datum,
      ergebnis: body.ergebnis,
      fehlerpunkte: body.fehlerpunkte,
      notizen: body.notizen,
    });

    if (!pruefung) {
      return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
    }

    emitEvent("pruefung.geplant", body.tenantId, {
      pruefungId: pruefung.id,
      schuelerId: body.schuelerId,
      typ: body.typ,
      datum: body.datum,
    });

    return NextResponse.json({ data: pruefung }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

/**
 * PATCH /api/crm/pruefungen — Update with event triggers
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

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get current state + tenant validation
    const { data: current } = await supabase
      .from("pruefungen")
      .select("ergebnis, schueler_id, tenant_id, typ")
      .eq("id", body.id)
      .eq("tenant_id", auth.tenantId)
      .is("deleted_at", null)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Prüfung nicht gefunden" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.ergebnis !== undefined) updateData.ergebnis = body.ergebnis;
    if (body.fehlerpunkte !== undefined) updateData.fehlerpunkte = body.fehlerpunkte;
    if (body.notizen !== undefined) updateData.notizen = body.notizen;

    const { data, error } = await supabase
      .from("pruefungen")
      .update(updateData)
      .eq("id", body.id)
      .eq("tenant_id", auth.tenantId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Prüfung nicht gefunden" }, { status: 404 });
    }

    // Event: Prüfung bestanden — auto-update Schüler-Status
    if (body.ergebnis === "bestanden" && current?.ergebnis !== "bestanden") {
      emitEvent("pruefung.bestanden", current!.tenant_id, {
        pruefungId: body.id,
        schuelerId: current!.schueler_id,
        typ: current!.typ,
      });

      // If Praxis bestanden → set Schüler to "bestanden"
      if (current!.typ === "praxis") {
        await schuelerDb.update(current!.schueler_id, { status: "bestanden" }, auth.tenantId);
        emitEvent("schueler.bestanden", current!.tenant_id, {
          schuelerId: current!.schueler_id,
        });
      }
    }

    if (body.ergebnis === "nicht_bestanden" && current?.ergebnis !== "nicht_bestanden") {
      emitEvent("pruefung.nicht_bestanden", current!.tenant_id, {
        pruefungId: body.id,
        schuelerId: current!.schueler_id,
        typ: current!.typ,
      });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
