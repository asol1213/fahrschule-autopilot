import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, safeCompare, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("analytics-sales-funnel", 30, 60_000);

const FUNNEL_STAGES = ["outreach", "antwort", "discovery_call", "demo", "angebot", "kunde", "verloren"] as const;
const STAGE_LABELS: Record<string, string> = {
  outreach: "Outreach",
  antwort: "Antwort",
  discovery_call: "Discovery Call",
  demo: "Demo",
  angebot: "Angebot",
  kunde: "Kunde",
  verloren: "Verloren",
};

/**
 * GET /api/analytics/sales-funnel
 *
 * Liefert den vollständigen Sales-Funnel:
 * Outreach → Antwort → Discovery Call → Demo → Angebot → Kunde
 * Inklusive Conversion-Rates zwischen Stufen und Avg. Days to Close.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const apiKey = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || !safeCompare(apiKey ?? "", process.env.ADMIN_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const [
    { data: activities },
    { data: leads },
  ] = await Promise.all([
    supabase.from("sales_activities").select("lead_id, stufe, kanal, notizen, created_at").order("created_at"),
    supabase.from("sales_leads").select("id, status, created_at"),
  ]);

  const acts = activities || [];
  const allLeads = leads || [];

  // Distinct leads per stage
  const stageLeads = new Map<string, Set<string>>();
  for (const stage of FUNNEL_STAGES) {
    stageLeads.set(stage, new Set());
  }
  for (const a of acts) {
    const set = stageLeads.get(a.stufe as string);
    if (set) set.add(a.lead_id as string);
  }

  // Build funnel
  const firstStageCount = stageLeads.get("outreach")?.size || allLeads.length || 1;
  const funnel = FUNNEL_STAGES.filter((s) => s !== "verloren").map((stage) => {
    const count = stageLeads.get(stage)?.size || 0;
    return {
      stufe: stage,
      label: STAGE_LABELS[stage],
      count,
      conversionFromStart: Math.round((count / firstStageCount) * 100),
    };
  });

  // Step-to-step conversion
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].count;
    (funnel[i] as Record<string, unknown>).conversionFromPrev =
      prev > 0 ? Math.round((funnel[i].count / prev) * 100) : 0;
  }

  // Average days to close (outreach → kunde)
  let totalDays = 0;
  let closedCount = 0;
  const kundeLeadIds = stageLeads.get("kunde") || new Set();
  for (const leadId of kundeLeadIds) {
    const leadActs = acts.filter((a) => a.lead_id === leadId);
    const first = leadActs.find((a) => a.stufe === "outreach");
    const last = leadActs.find((a) => a.stufe === "kunde");
    if (first && last) {
      const days = Math.ceil(
        (new Date(last.created_at as string).getTime() - new Date(first.created_at as string).getTime()) / (1000 * 60 * 60 * 24),
      );
      totalDays += days;
      closedCount++;
    }
  }

  // Loss reasons
  const verlorenActs = acts.filter((a) => a.stufe === "verloren" && a.notizen);
  const lossReasons = new Map<string, number>();
  for (const a of verlorenActs) {
    const reason = (a.notizen as string).toLowerCase().trim();
    lossReasons.set(reason, (lossReasons.get(reason) || 0) + 1);
  }
  const topLossReasons = Array.from(lossReasons.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  // Activities per week (last 8 weeks)
  const now = new Date();
  const weeklyVolume: Array<{ woche: string; outreach: number; antworten: number; calls: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - 7 * i);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekStr = weekStart.toISOString().split("T")[0];

    const weekActs = acts.filter((a) => {
      const d = new Date(a.created_at as string);
      return d >= weekStart && d < weekEnd;
    });

    weeklyVolume.push({
      woche: weekStr,
      outreach: weekActs.filter((a) => a.stufe === "outreach").length,
      antworten: weekActs.filter((a) => a.stufe === "antwort").length,
      calls: weekActs.filter((a) => a.stufe === "discovery_call").length,
    });
  }

  return NextResponse.json({
    funnel,
    avgDaysToClose: closedCount > 0 ? Math.round(totalDays / closedCount) : null,
    totalClosed: closedCount,
    totalLost: stageLeads.get("verloren")?.size || 0,
    topLossReasons,
    weeklyVolume,
    responseRate: firstStageCount > 0
      ? Math.round(((stageLeads.get("antwort")?.size || 0) / firstStageCount) * 100)
      : 0,
  });
}

/**
 * POST /api/analytics/sales-funnel
 *
 * Loggt eine neue Sales-Aktivität.
 * Body: { leadId, stufe, kanal?, notizen? }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const auth = await requireAuth();
  if (!isAuthed(auth)) return auth;

  const body = await req.json();
  const { leadId, stufe, kanal, notizen } = body;

  if (!leadId || !stufe) {
    return NextResponse.json({ error: "leadId und stufe sind Pflicht" }, { status: 400 });
  }

  if (!FUNNEL_STAGES.includes(stufe)) {
    return NextResponse.json({ error: `Ungültige Stufe. Erlaubt: ${FUNNEL_STAGES.join(", ")}` }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("sales_activities").insert({
    lead_id: leadId,
    stufe,
    kanal: kanal || null,
    notizen: notizen || null,
    erstellt_von: auth.userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Sync lead status
  const statusMap: Record<string, string> = {
    outreach: "kontaktiert",
    antwort: "interessiert",
    discovery_call: "interessiert",
    demo: "demo_gebucht",
    angebot: "angebot",
    kunde: "gewonnen",
    verloren: "verloren",
  };
  const newStatus = statusMap[stufe];
  if (newStatus) {
    await supabase.from("sales_leads").update({ status: newStatus }).eq("id", leadId);
  }

  return NextResponse.json({ success: true });
}
