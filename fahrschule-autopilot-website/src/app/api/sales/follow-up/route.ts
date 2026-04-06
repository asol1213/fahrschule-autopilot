import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireServiceKey, isServiceKeyError, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("sales-follow-up", 30, 60_000);

/**
 * Follow-Up Sequenz Manager
 * Auth: Admin API Key (all methods)
 *
 * GET  /api/sales/follow-up?typ=demo_follow_up — Anstehende Follow-Ups
 * POST /api/sales/follow-up — Follow-Up erstellen
 * PUT  /api/sales/follow-up — Follow-Up als gesendet markieren
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const keyError = requireServiceKey(req, "ADMIN_API_KEY");
  if (isServiceKeyError(keyError)) return keyError;
  const typ = req.nextUrl.searchParams.get("typ");
  const status = req.nextUrl.searchParams.get("status") || "geplant";

  const supabase = await createClient();

  let query = supabase
    .from("follow_ups")
    .select("*, sales_leads(fahrschul_name, stadt, email, telefon), tenants(name, plan)")
    .eq("status", status)
    .order("geplant_am", { ascending: true })
    .limit(50);

  if (typ) query = query.eq("typ", typ);

  // Nur anstehende (geplant_am <= jetzt + 24h)
  if (status === "geplant") {
    const morgen = new Date();
    morgen.setDate(morgen.getDate() + 1);
    query = query.lte("geplant_am", morgen.toISOString());
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Zusammenfassung nach Typ
  const { data: allFollowUps } = await supabase
    .from("follow_ups")
    .select("typ, status");

  const summary: Record<string, Record<string, number>> = {};
  (allFollowUps || []).forEach((f) => {
    const t = f.typ as string;
    const s = f.status as string;
    if (!summary[t]) summary[t] = {};
    summary[t][s] = (summary[t][s] || 0) + 1;
  });

  return NextResponse.json({
    followUps: data || [],
    summary,
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const keyError = requireServiceKey(req, "ADMIN_API_KEY");
    if (isServiceKeyError(keyError)) return keyError;

    const body = await req.json();
    const supabase = await createClient();

    // Automatische Follow-Up Sequenz erstellen
    if (body.sequenz) {
      const sequenzen = buildSequenz(body.typ, body.leadId, body.tenantId);
      const { data, error } = await supabase.from("follow_ups").insert(sequenzen).select();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: data.length, followUps: data });
    }

    // Einzelnes Follow-Up
    const { data, error } = await supabase.from("follow_ups").insert({
      lead_id: body.leadId,
      tenant_id: body.tenantId,
      typ: body.typ,
      stufe: body.stufe || 1,
      geplant_am: body.geplantAm || new Date().toISOString(),
      kanal: body.kanal || "email",
      betreff: body.betreff,
      inhalt: body.inhalt,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, followUp: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const keyError = requireServiceKey(req, "ADMIN_API_KEY");
    if (isServiceKeyError(keyError)) return keyError;

    const body = await req.json();
    const supabase = await createClient();

    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.status === "gesendet") updateData.gesendet_am = new Date().toISOString();
    if (updates.inhalt) updateData.inhalt = updates.inhalt;
    if (updates.betreff) updateData.betreff = updates.betreff;

    const { data, error } = await supabase
      .from("follow_ups")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, followUp: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function buildSequenz(typ: string, leadId?: string, tenantId?: string) {
  const now = new Date();

  if (typ === "demo_follow_up") {
    return [
      { lead_id: leadId, typ: "demo_follow_up", stufe: 1, geplant_am: addDays(now, 1).toISOString(), kanal: "email", betreff: "Danke für Ihr Interesse" },
      { lead_id: leadId, typ: "demo_follow_up", stufe: 2, geplant_am: addDays(now, 3).toISOString(), kanal: "email", betreff: "Kurze Nachfrage" },
      { lead_id: leadId, typ: "demo_follow_up", stufe: 3, geplant_am: addDays(now, 7).toISOString(), kanal: "email", betreff: "Letzte Frage" },
    ];
  }

  if (typ === "onboarding_check") {
    return [
      { tenant_id: tenantId, typ: "onboarding_check", stufe: 1, geplant_am: addDays(now, 3).toISOString(), kanal: "whatsapp", betreff: "Läuft alles?" },
      { tenant_id: tenantId, typ: "onboarding_check", stufe: 2, geplant_am: addDays(now, 14).toISOString(), kanal: "email", betreff: "2-Wochen Review" },
    ];
  }

  if (typ === "churn_prevention") {
    return [
      { tenant_id: tenantId, typ: "churn_prevention", stufe: 1, geplant_am: addDays(now, 0).toISOString(), kanal: "whatsapp", betreff: "Können wir helfen?" },
      { tenant_id: tenantId, typ: "churn_prevention", stufe: 2, geplant_am: addDays(now, 3).toISOString(), kanal: "email", betreff: "Ihr monatlicher ROI-Report" },
      { tenant_id: tenantId, typ: "churn_prevention", stufe: 3, geplant_am: addDays(now, 7).toISOString(), kanal: "telefon", betreff: "Persönliches Gespräch" },
    ];
  }

  if (typ === "upselling") {
    return [
      { tenant_id: tenantId, typ: "upselling", stufe: 1, geplant_am: addDays(now, 0).toISOString(), kanal: "email", betreff: "Neues Feature verfügbar" },
      { tenant_id: tenantId, typ: "upselling", stufe: 2, geplant_am: addDays(now, 5).toISOString(), kanal: "whatsapp", betreff: "Upgrade-Angebot" },
    ];
  }

  return [];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
