import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireServiceKey, isServiceKeyError, rateLimit } from "@/lib/api-auth";

const conversionTrackLimiter = rateLimit("conversion-track", 10, 60_000);

/**
 * GET /api/analytics/conversion
 * Conversion Funnel: Demo-Besucher → Signup → Paying
 * Auth: Admin API Key
 *
 * POST /api/analytics/conversion
 * Trackt einen Demo-Besuch (wird vom Client aufgerufen)
 * Auth: Public, rate-limited
 */
export async function GET(req: NextRequest) {
  const keyError = requireServiceKey(req, "ADMIN_API_KEY");
  if (isServiceKeyError(keyError)) return keyError;

  const supabase = await createClient();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);

  const [
    { data: besuche30 },
    { data: besuche90 },
    { data: tenants },
  ] = await Promise.all([
    supabase
      .from("demo_besuche")
      .select("*")
      .gte("created_at", since30.toISOString()),
    supabase
      .from("demo_besuche")
      .select("plan, visitor_id, hat_cta_geklickt, created_at")
      .gte("created_at", since90.toISOString()),
    supabase
      .from("tenants")
      .select("plan, created_at"),
  ]);

  const b30 = besuche30 || [];
  const b90 = besuche90 || [];
  const t = tenants || [];

  // Unique Besucher (30 Tage)
  const uniqueVisitors30 = new Set(b30.map((b) => b.visitor_id)).size;
  const ctaClicks30 = b30.filter((b) => b.hat_cta_geklickt).length;

  // Pro Plan
  const planStats = ["starter", "pro", "premium"].map((plan) => {
    const planBesuche = b30.filter((b) => b.plan === plan);
    const uniqueV = new Set(planBesuche.map((b) => b.visitor_id)).size;
    const cta = planBesuche.filter((b) => b.hat_cta_geklickt).length;
    const signups = t.filter((x) => x.plan === plan).length;
    return { plan, besucher: uniqueV, ctaClicks: cta, signups };
  });

  // Conversion Funnel (90 Tage)
  const uniqueVisitors90 = new Set(b90.map((b) => b.visitor_id)).size;
  const ctaClicks90 = new Set(b90.filter((b) => b.hat_cta_geklickt).map((b) => b.visitor_id)).size;
  const signupsTotal = t.filter((x) => {
    const created = new Date(x.created_at as string);
    return created >= since90;
  }).length;

  const funnel = [
    { stufe: "Demo besucht", count: uniqueVisitors90, rate: 100 },
    { stufe: "CTA geklickt", count: ctaClicks90, rate: uniqueVisitors90 > 0 ? Math.round((ctaClicks90 / uniqueVisitors90) * 100) : 0 },
    { stufe: "Signup", count: signupsTotal, rate: uniqueVisitors90 > 0 ? Math.round((signupsTotal / uniqueVisitors90) * 100) : 0 },
  ];

  // Besuche pro Tag (letzte 14 Tage)
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split("T")[0], 0);
  }
  b30.forEach((b) => {
    const day = (b.created_at as string).split("T")[0];
    if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  });
  const besucheProTag = Array.from(dailyMap.entries())
    .map(([tag, count]) => ({
      tag,
      label: new Date(tag).toLocaleDateString("de-DE", { day: "numeric", month: "short" }),
      count,
    }))
    .reverse();

  // UTM-Quellen
  const quellen: Record<string, number> = {};
  b30.forEach((b) => {
    const source = (b.utm_source as string) || (b.referrer as string) || "direkt";
    quellen[source] = (quellen[source] || 0) + 1;
  });
  const topQuellen = Object.entries(quellen)
    .map(([quelle, count]) => ({ quelle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    zeitraum30: {
      uniqueBesucher: uniqueVisitors30,
      ctaClicks: ctaClicks30,
      conversionRate: uniqueVisitors30 > 0 ? Math.round((ctaClicks30 / uniqueVisitors30) * 100) : 0,
    },
    planStats,
    funnel,
    besucheProTag,
    topQuellen,
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (conversionTrackLimiter(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();
    const supabase = await createClient();

    const { error } = await supabase.from("demo_besuche").insert({
      plan: body.plan,
      visitor_id: body.visitorId,
      referrer: body.referrer,
      utm_source: body.utmSource,
      utm_medium: body.utmMedium,
      utm_campaign: body.utmCampaign,
      hat_cta_geklickt: body.ctaClicked || false,
      verweildauer_sekunden: body.duration || 0,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
