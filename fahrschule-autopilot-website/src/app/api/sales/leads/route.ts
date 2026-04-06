import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("sales-leads", 30, 60_000);

/**
 * Sales Lead Management API (auth-geschützt)
 *
 * GET  /api/sales/leads?status=neu&stadt=München
 * POST /api/sales/leads  — Neuen Lead erstellen
 * PUT  /api/sales/leads  — Lead aktualisieren
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const auth = await requireAuth();
  if (!isAuthed(auth)) return auth;

  const status = req.nextUrl.searchParams.get("status");
  const stadt = req.nextUrl.searchParams.get("stadt");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 100);

  const supabase = await createClient();
  let query = supabase
    .from("sales_leads")
    .select("*, follow_ups(id, typ, stufe, geplant_am, status)")
    .eq("tenant_id", auth.tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (stadt) query = query.ilike("stadt", `%${stadt}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pipeline Summary
  const { data: allLeads } = await supabase
    .from("sales_leads")
    .select("status")
    .eq("tenant_id", auth.tenantId)
    .limit(500);

  const pipeline: Record<string, number> = {};
  (allLeads || []).forEach((l) => {
    const s = l.status as string;
    pipeline[s] = (pipeline[s] || 0) + 1;
  });

  return NextResponse.json({
    leads: data || [],
    pipeline,
    total: (allLeads || []).length,
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const auth = await requireAuth();
  if (!isAuthed(auth)) return auth;

  try {
    const body = await req.json();
    const supabase = await createClient();

    // Einzelner Lead oder Bulk-Import
    const leads = Array.isArray(body) ? body : [body];

    const inserts = leads.map((l) => ({
      tenant_id: auth.tenantId,
      fahrschul_name: l.fahrschulName || l.name,
      inhaber: l.inhaber,
      stadt: l.stadt,
      bundesland: l.bundesland,
      telefon: l.telefon,
      email: l.email,
      website: l.website,
      google_bewertung: l.googleBewertung,
      google_bewertungen_anzahl: l.googleBewertungenAnzahl,
      status: l.status || "neu",
      notizen: l.notizen,
      quelle: l.quelle || "recherche",
    }));

    const { data, error } = await supabase
      .from("sales_leads")
      .insert(inserts)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, count: data.length, leads: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const auth = await requireAuth();
  if (!isAuthed(auth)) return auth;

  try {
    const body = await req.json();
    const supabase = await createClient();

    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notizen !== undefined) updateData.notizen = updates.notizen;
    if (updates.naechsteAktion !== undefined) updateData.naechste_aktion = updates.naechsteAktion;
    if (updates.naechsteAktionAm !== undefined) updateData.naechste_aktion_am = updates.naechsteAktionAm;
    if (updates.telefon !== undefined) updateData.telefon = updates.telefon;
    if (updates.email !== undefined) updateData.email = updates.email;

    const { data, error } = await supabase
      .from("sales_leads")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", auth.tenantId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, lead: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
