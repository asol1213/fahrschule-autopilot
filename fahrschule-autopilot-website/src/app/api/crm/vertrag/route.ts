import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

const checkLimit = rateLimit("crm-vertrag", 60, 60_000);

/**
 * GET /api/crm/vertrag?schuelerId=xxx&tenantId=xxx
 * Returns contract status for a student
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

  const supabase = await createClient();

  if (schuelerId) {
    const { data, error } = await supabase
      .from("vertraege")
      .select("*, schueler(vorname, nachname, fuehrerscheinklasse)")
      .eq("tenant_id", auth.tenantId)
      .eq("schueler_id", schuelerId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  // All contracts for tenant
  const { data, error } = await supabase
    .from("vertraege")
    .select("*, schueler(vorname, nachname, fuehrerscheinklasse)")
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

/**
 * POST /api/crm/vertrag
 * Generate a new contract for a student
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const required = ["tenantId", "schuelerId", "vertragstyp"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Pflichtfelder fehlen", missing }, { status: 400 });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("vertraege")
      .insert({
        tenant_id: auth.tenantId,
        schueler_id: body.schuelerId,
        vertragstyp: body.vertragstyp,
        status: body.status || "entwurf",
        vertragsdaten: body.vertragsDaten || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

/**
 * PATCH /api/crm/vertrag
 * Sign a contract (saves signature data + timestamp)
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

    const supabase = await createClient();

    // Build update payload
    const update: Record<string, unknown> = {};
    if (body.status) update.status = body.status;
    if (body.unterschriftUrl) {
      update.unterschrift_url = body.unterschriftUrl;
      update.unterschrieben_am = new Date().toISOString();
      update.status = "unterschrieben";
    }
    if (body.vertragsDaten) update.vertragsdaten = body.vertragsDaten;

    const { data, error } = await supabase
      .from("vertraege")
      .update(update)
      .eq("id", body.id)
      .eq("tenant_id", auth.tenantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Vertrag nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
