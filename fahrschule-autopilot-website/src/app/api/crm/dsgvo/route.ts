import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emitEvent } from "@/lib/events/emit";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-dsgvo", 10, 60_000);

/**
 * GET /api/crm/dsgvo?schuelerId=xxx
 * Export all data for a student (DSGVO Auskunftsersuchen)
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");
  if (!schuelerId) {
    return NextResponse.json({ error: "schuelerId required" }, { status: 400 });
  }

  const auth = await requireAuth();
  if (!isAuthed(auth)) return auth;

  try {
    const supabase = await createClient();

    const [
      { data: schueler },
      { data: fahrstunden },
      { data: zahlungen },
      { data: dokumente },
      { data: pruefungen },
      { data: kommunikation },
    ] = await Promise.all([
      supabase.from("schueler").select("*").eq("id", schuelerId).eq("tenant_id", auth.tenantId).is("deleted_at", null).single(),
      supabase.from("fahrstunden").select("*").eq("schueler_id", schuelerId).eq("tenant_id", auth.tenantId).is("deleted_at", null),
      supabase.from("zahlungen").select("*").eq("schueler_id", schuelerId).eq("tenant_id", auth.tenantId).is("deleted_at", null),
      supabase.from("dokumente").select("*").eq("schueler_id", schuelerId).eq("tenant_id", auth.tenantId).is("deleted_at", null),
      supabase.from("pruefungen").select("*").eq("schueler_id", schuelerId).eq("tenant_id", auth.tenantId).is("deleted_at", null),
      supabase.from("kommunikation").select("*").eq("schueler_id", schuelerId).eq("tenant_id", auth.tenantId).is("deleted_at", null),
    ]);

    return NextResponse.json({
      exportDatum: new Date().toISOString(),
      hinweis: "DSGVO Art. 15 Auskunftsersuchen — Alle gespeicherten Daten",
      schueler,
      fahrstunden: fahrstunden || [],
      zahlungen: zahlungen || [],
      dokumente: dokumente || [],
      pruefungen: pruefungen || [],
      kommunikation: kommunikation || [],
    });
  } catch {
    return NextResponse.json({ error: "Fehler beim Export" }, { status: 500 });
  }
}

/**
 * DELETE /api/crm/dsgvo — DSGVO-konformes Löschen
 * Body: { schuelerId, confirm: true }
 * Löscht Schüler + alle verknüpften Daten (CASCADE in DB)
 */
export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const authDelete = await requireAuth();
  if (!isAuthed(authDelete)) return authDelete;

  try {
    const body = await req.json();
    if (!body.schuelerId || !body.confirm) {
      return NextResponse.json(
        { error: "schuelerId und confirm: true erforderlich" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get tenant info before deletion + tenant validation
    const { data: schueler } = await supabase
      .from("schueler")
      .select("tenant_id, vorname, nachname")
      .eq("id", body.schuelerId)
      .eq("tenant_id", authDelete.tenantId)
      .single();

    if (!schueler) {
      return NextResponse.json({ error: "Schüler nicht gefunden" }, { status: 404 });
    }

    // Delete in order (respecting FK constraints, or rely on CASCADE)
    // With ON DELETE CASCADE in migration, deleting schueler cascades all related data
    const { error } = await supabase
      .from("schueler")
      .delete()
      .eq("id", body.schuelerId);

    if (error) {
      console.error("DSGVO deletion error:", error);
      return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
    }

    emitEvent("schueler.dsgvo_loeschung", schueler.tenant_id, {
      schuelerId: body.schuelerId,
      name: `${schueler.vorname} ${schueler.nachname}`,
    });

    return NextResponse.json({
      success: true,
      message: `Schüler ${schueler.vorname} ${schueler.nachname} und alle verknüpften Daten wurden DSGVO-konform gelöscht.`,
      deletedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}

/**
 * POST /api/crm/dsgvo — Schedule deletion (Aufbewahrungsfrist)
 * Body: { schuelerId, loeschungAm }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const authPost = await requireAuth();
  if (!isAuthed(authPost)) return authPost;

  try {
    const body = await req.json();
    if (!body.schuelerId) {
      return NextResponse.json({ error: "schuelerId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Default: 3 Jahre nach Ausbildungsende (gesetzliche Aufbewahrungsfrist)
    const loeschungAm = body.loeschungAm || (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 3);
      return d.toISOString().split("T")[0];
    })();

    const { data, error } = await supabase
      .from("schueler")
      .update({
        ausbildung_beendet_am: new Date().toISOString().split("T")[0],
        loeschung_geplant_am: loeschungAm,
      })
      .eq("id", body.schuelerId)
      .eq("tenant_id", authPost.tenantId)
      .select("id, vorname, nachname, loeschung_geplant_am")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Schüler nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Löschung für ${data.vorname} ${data.nachname} geplant am ${data.loeschung_geplant_am}`,
      data,
    });
  } catch {
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
