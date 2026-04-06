import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeCompare, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("analytics-marketing", 30, 60_000);

/**
 * GET /api/analytics/marketing
 *
 * Marketing-Dashboard: Conversion-Funnel, Demo-Traffic, Bewertungen, Empfehlungen.
 * Aggregiert Daten aus demo_besuche, tenants, kommunikation.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const supabase = await createClient();
  const apiKey = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || !safeCompare(apiKey ?? "", process.env.ADMIN_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const [
    { data: besuche30 },
    { data: besuche7 },
    { data: tenants },
    { data: recentTenants },
    { data: bewertungsKomm },
    { data: empfehlungsKomm },
    { data: allLeads },
  ] = await Promise.all([
    supabase.from("demo_besuche").select("plan, visitor_id, hat_cta_geklickt, utm_source, referrer, verweildauer_sekunden").gte("created_at", since30.toISOString()),
    supabase.from("demo_besuche").select("plan, visitor_id").gte("created_at", since7.toISOString()),
    supabase.from("tenants").select("id, plan, created_at"),
    supabase.from("tenants").select("id, plan").gte("created_at", since30.toISOString()),
    // Bewertungsanfragen (ausgehende Kommunikation mit Betreff "bewertung")
    supabase.from("kommunikation").select("id, datum").ilike("betreff", "%bewertung%").eq("richtung", "ausgehend"),
    // Empfehlungsanfragen
    supabase.from("kommunikation").select("id, datum").ilike("betreff", "%empfehlung%").eq("richtung", "ausgehend"),
    supabase.from("sales_leads").select("status, google_bewertung, google_bewertungen_anzahl, created_at"),
  ]);

  const b30 = besuche30 || [];
  const b7 = besuche7 || [];
  const _t = tenants || [];
  const rt = recentTenants || [];

  // === Traffic Metrics ===
  const uniqueVisitors30 = new Set(b30.map((b) => b.visitor_id)).size;
  const uniqueVisitors7 = new Set(b7.map((b) => b.visitor_id)).size;
  const ctaClicks30 = b30.filter((b) => b.hat_cta_geklickt).length;
  const avgVerweildauer = b30.length > 0
    ? Math.round(b30.reduce((s, b) => s + ((b.verweildauer_sekunden as number) || 0), 0) / b30.length)
    : 0;

  // Pro Plan
  const trafficProPlan = ["starter", "pro", "premium"].map((plan) => {
    const planBesuche = b30.filter((b) => b.plan === plan);
    return {
      plan,
      besucher: new Set(planBesuche.map((b) => b.visitor_id)).size,
      ctaClicks: planBesuche.filter((b) => b.hat_cta_geklickt).length,
    };
  });

  // === Conversion Funnel ===
  const conversionRate = uniqueVisitors30 > 0 ? Math.round((rt.length / uniqueVisitors30) * 100) : 0;

  // === Traffic-Quellen ===
  const quellenMap: Record<string, number> = {};
  b30.forEach((b) => {
    const src = (b.utm_source as string) || (b.referrer as string) || "direkt";
    const key = src.replace(/^https?:\/\//, "").split("/")[0] || "direkt";
    quellenMap[key] = (quellenMap[key] || 0) + 1;
  });
  const trafficQuellen = Object.entries(quellenMap)
    .map(([quelle, count]) => ({ quelle, count, anteil: uniqueVisitors30 > 0 ? Math.round((count / b30.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // === Bewertungen ===
  const bewertungenGesendet = (bewertungsKomm || []).length;
  const bewertungen30 = (bewertungsKomm || []).filter((b) => new Date(b.datum as string) >= since30).length;

  // Google-Bewertungen aus Leads
  const leadsArr = allLeads || [];
  const leadsMitBewertung = leadsArr.filter((l) => l.google_bewertung);
  const avgGoogleRating = leadsMitBewertung.length > 0
    ? Math.round(leadsMitBewertung.reduce((s, l) => s + Number(l.google_bewertung), 0) / leadsMitBewertung.length * 10) / 10
    : 0;
  const totalGoogleReviews = leadsMitBewertung.reduce((s, l) => s + ((l.google_bewertungen_anzahl as number) || 0), 0);

  // === Empfehlungen ===
  const empfehlungenGesendet = (empfehlungsKomm || []).length;
  const empfehlungen30 = (empfehlungsKomm || []).filter((e) => new Date(e.datum as string) >= since30).length;

  // === Sales Pipeline ===
  const pipeline: Record<string, number> = {};
  leadsArr.forEach((l) => {
    const s = l.status as string;
    pipeline[s] = (pipeline[s] || 0) + 1;
  });

  const leadsNeu30 = leadsArr.filter((l) => new Date(l.created_at as string) >= since30).length;

  return NextResponse.json({
    traffic: {
      uniqueBesucher30d: uniqueVisitors30,
      uniqueBesucher7d: uniqueVisitors7,
      ctaClicks30d: ctaClicks30,
      avgVerweildauerSekunden: avgVerweildauer,
      conversionRate,
      neueKunden30d: rt.length,
      trafficProPlan,
      trafficQuellen,
    },
    bewertungen: {
      anfragenGesamt: bewertungenGesendet,
      anfragen30d: bewertungen30,
      avgGoogleRating,
      totalGoogleReviews,
    },
    empfehlungen: {
      gesendetGesamt: empfehlungenGesendet,
      gesendet30d: empfehlungen30,
    },
    sales: {
      pipeline,
      neueLeads30d: leadsNeu30,
      totalLeads: leadsArr.length,
    },
  });
}
