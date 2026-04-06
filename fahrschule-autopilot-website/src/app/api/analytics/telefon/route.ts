import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, requireServiceKey, isServiceKeyError, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("analytics-telefon", 30, 60_000);

/**
 * GET /api/analytics/telefon?tenantId=xxx
 * AI Telefon Analytics: Anrufvolumen, Top-Intents, Sentiment, Konversion
 * Auth: Session (Dashboard)
 *
 * POST /api/analytics/telefon
 * Speichert einen Anruf (wird vom fonio-Webhook aufgerufen)
 * Auth: Service Key (FONIO_WEBHOOK_SECRET oder WEBHOOK_SECRET)
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

  try {
    const supabase = await createClient();

    // Letzte 30 Tage
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString();

    const [
      { data: anrufe, error: anrufeError },
      { count: anrufeGesamt },
    ] = await Promise.all([
      supabase
        .from("anrufe")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", sinceStr)
        .order("created_at", { ascending: false }),
      supabase
        .from("anrufe")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
    ]);

    if (anrufeError) {
      return NextResponse.json({ error: anrufeError.message }, { status: 500 });
    }

    const rows = anrufe || [];

    // Anrufvolumen pro Tag (letzte 30 Tage)
    const volumeMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      volumeMap.set(d.toISOString().split("T")[0], 0);
    }
    rows.forEach((a) => {
      const day = (a.created_at as string).split("T")[0];
      if (volumeMap.has(day)) volumeMap.set(day, (volumeMap.get(day) || 0) + 1);
    });
    const anrufVolumen = Array.from(volumeMap.entries())
      .map(([tag, count]) => ({
        tag,
        label: new Date(tag).toLocaleDateString("de-DE", { weekday: "short", day: "numeric" }),
        count,
      }))
      .reverse();

    // Top Intents
    const intentCounts: Record<string, number> = {};
    rows.forEach((a) => {
      const intent = (a.intent as string) || "sonstiges";
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });
    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, label: intentLabel(intent), count }))
      .sort((a, b) => b.count - a.count);

    // Sentiment-Verteilung
    const sentimentCounts: Record<string, number> = { positive: 0, neutral: 0, negative: 0, unknown: 0 };
    rows.forEach((a) => {
      const s = (a.sentiment as string) || "unknown";
      sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
    });

    // Konversion: Anrufe die zu Leads wurden
    const newLeads = rows.filter((a) => a.is_new_lead).length;
    const konversionsrate = rows.length > 0 ? Math.round((newLeads / rows.length) * 100) : 0;

    // Durchschnittliche Dauer
    const mitDauer = rows.filter((a) => (a.dauer_sekunden as number) > 0);
    const avgDauer = mitDauer.length > 0
      ? Math.round(mitDauer.reduce((s, a) => s + (a.dauer_sekunden as number), 0) / mitDauer.length)
      : 0;

    // Letzte Anrufe (für Tabelle)
    const letzteAnrufe = rows.slice(0, 10).map((a) => ({
      id: a.id,
      datum: a.created_at,
      anrufer: a.anrufer_name || a.anrufer_nummer || "Unbekannt",
      dauer: a.dauer_sekunden,
      intent: a.intent,
      sentiment: a.sentiment,
      zusammenfassung: a.zusammenfassung,
      isNewLead: a.is_new_lead,
    }));

    return NextResponse.json({
      tenantId,
      zeitraum: "30 Tage",
      gesamt: anrufeGesamt ?? rows.length,
      monat: rows.length,
      avgDauerSekunden: avgDauer,
      konversionsrate,
      newLeads,
      anrufVolumen,
      topIntents,
      sentimentVerteilung: sentimentCounts,
      letzteAnrufe,
    });
  } catch (err) {
    console.error("[Analytics/Telefon] Fehler:", err);
    return NextResponse.json({ error: "Datenbankverbindung fehlgeschlagen" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Service key auth: called by Retell webhook or n8n
    const keyError = requireServiceKey(req, "RETELL_WEBHOOK_SECRET");
    if (isServiceKeyError(keyError)) {
      // Fallback to general webhook secret
      const fallbackError = requireServiceKey(req, "WEBHOOK_SECRET");
      if (isServiceKeyError(fallbackError)) return fallbackError;
    }

    const body = await req.json();
    const supabase = await createClient();

    const { data, error } = await supabase.from("anrufe").insert({
      tenant_id: body.tenantId,
      call_id: body.callId,
      anrufer_nummer: body.callerNumber,
      dauer_sekunden: body.duration,
      zusammenfassung: body.summary,
      sentiment: body.sentiment,
      intent: body.intent,
      anrufer_name: body.callerName,
      anrufer_email: body.callerEmail,
      anrufer_telefon: body.callerPhone,
      fuehrerscheinklasse: body.licenseClass,
      is_new_lead: body.isNewLead,
      needs_follow_up: body.needsFollowUp,
      recording_url: body.recordingUrl,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function intentLabel(intent: string): string {
  const labels: Record<string, string> = {
    anmeldung: "Anmeldung",
    termin: "Terminanfrage",
    preisanfrage: "Preisanfrage",
    information: "Information",
    beschwerde: "Beschwerde",
    umschreibung: "Umschreibung",
    auffrischung: "Auffrischung",
    sonstiges: "Sonstiges",
  };
  return labels[intent] || intent;
}
