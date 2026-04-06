import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit } from "@/lib/api-auth";

const npsLimiter = rateLimit("nps", 10, 60_000);

/**
 * GET /api/analytics/nps?tenantId=xxx
 *
 * NPS Score + Verteilung + Trend + letzte Kommentare
 */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const supabase = await createClient();

  const { data: responses } = await supabase
    .from("nps_responses")
    .select("score, kommentar, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const all = responses || [];

  if (all.length === 0) {
    return NextResponse.json({
      npsScore: null,
      total: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      trend: [],
      recentComments: [],
    });
  }

  // NPS Berechnung
  const promoters = all.filter((r) => (r.score as number) >= 9).length;
  const passives = all.filter((r) => (r.score as number) >= 7 && (r.score as number) <= 8).length;
  const detractors = all.filter((r) => (r.score as number) <= 6).length;
  const npsScore = Math.round(((promoters - detractors) / all.length) * 100);

  // Trend pro Monat (letzte 6 Monate)
  const now = new Date();
  const trend: Array<{ monat: string; nps: number; count: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthResponses = all.filter((r) => (r.created_at as string).startsWith(key));
    if (monthResponses.length > 0) {
      const mProm = monthResponses.filter((r) => (r.score as number) >= 9).length;
      const mDet = monthResponses.filter((r) => (r.score as number) <= 6).length;
      trend.push({
        monat: key,
        nps: Math.round(((mProm - mDet) / monthResponses.length) * 100),
        count: monthResponses.length,
      });
    } else {
      trend.push({ monat: key, nps: 0, count: 0 });
    }
  }

  // Letzte Kommentare
  const recentComments = all
    .filter((r) => r.kommentar)
    .slice(0, 10)
    .map((r) => ({
      score: r.score,
      kommentar: r.kommentar,
      datum: r.created_at,
    }));

  return NextResponse.json({
    npsScore,
    total: all.length,
    promoters,
    passives,
    detractors,
    trend,
    recentComments,
  });
}

/**
 * POST /api/analytics/nps
 *
 * Body: { tenantId, schuelerId?, score (0-10), kommentar? }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (npsLimiter(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const body = await req.json();
  const { tenantId, schuelerId, score, kommentar } = body;

  if (!tenantId || score === undefined || score === null) {
    return NextResponse.json({ error: "tenantId und score sind Pflicht" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 0 || score > 10) {
    return NextResponse.json({ error: "Score muss zwischen 0 und 10 liegen" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("nps_responses").insert({
    tenant_id: tenantId,
    schueler_id: schuelerId || null,
    score,
    kommentar: kommentar || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
