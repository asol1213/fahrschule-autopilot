import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("analytics-roi", 30, 60_000);

const PLAN_PRICES: Record<string, number> = { starter: 99, pro: 249, premium: 499 };
const AVG_LESSON_PRICE = 50; // EUR pro Fahrstunde
const OWNER_HOUR_VALUE = 25; // EUR geschätzter Stundenlohn Inhaber

/**
 * GET /api/analytics/roi?tenantId=xxx
 *
 * ROI-Dashboard für den Kunden:
 * - No-Show Ersparnis (weniger verpasste Fahrstunden)
 * - Zeitersparnis (Automatisierung von Verwaltung)
 * - Zahlungs-Wiederherstellung (Mahnungen die bezahlt wurden)
 * - ROI Berechnung vs. Plan-Kosten
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

  const supabase = await createClient();

  // Letzte 30 Tage
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startStr = thirtyDaysAgo.toISOString();

  const [
    { data: tenant },
    { data: fahrstunden },
    { data: zahlungen },
    ,
    { data: kommunikation },
  ] = await Promise.all([
    supabase.from("tenants").select("plan").eq("id", tenantId).single(),
    supabase.from("fahrstunden").select("status").eq("tenant_id", tenantId).gte("datum", startStr.split("T")[0]),
    supabase.from("zahlungen").select("betrag, status, mahnungs_stufe").eq("tenant_id", tenantId),
    supabase.from("schueler").select("id").eq("tenant_id", tenantId),
    supabase.from("kommunikation").select("id").eq("tenant_id", tenantId).gte("created_at", startStr),
  ]);

  const plan = (tenant?.plan as string) || "starter";
  const planKosten = PLAN_PRICES[plan] || 99;

  // No-Show Ersparnis
  const fs: Array<Record<string, unknown>> = fahrstunden || [];
  const totalLessons = fs.length;
  const noShows = fs.filter((f: Record<string, unknown>) => f.status === "no_show").length;
  const currentRate = totalLessons > 0 ? noShows / totalLessons : 0;
  const branchenDurchschnitt = 0.15; // 15% durchschnittliche No-Show-Rate
  const noShowReduktion = Math.max(0, branchenDurchschnitt - currentRate);
  const geretteteStunden = Math.round(noShowReduktion * totalLessons);
  const noShowErsparnis = Math.round(geretteteStunden * AVG_LESSON_PRICE);

  // Zeitersparnis (Automationen)
  const automationen = (kommunikation || []).length;
  // ~2 Minuten pro manuelle Aktion (Erinnerung, Nachricht, etc.)
  const zeitMinuten = automationen * 2;
  const zeitStunden = Math.round(zeitMinuten / 60 * 10) / 10;
  const zeitErsparnis = Math.round(zeitStunden * OWNER_HOUR_VALUE);

  // Zahlungs-Wiederherstellung (bezahlte Rechnungen die gemahnt werden mussten)
  const zr: Array<Record<string, unknown>> = zahlungen || [];
  const wiederhergestellt = zr
    .filter((z: Record<string, unknown>) => z.status === "bezahlt" && (z.mahnungs_stufe as number) > 0)
    .reduce((s: number, z: Record<string, unknown>) => s + Number(z.betrag), 0);
  const zahlungsWiederherstellung = Math.round(wiederhergestellt);

  // Gesamt & ROI
  const gesamtErsparnis = noShowErsparnis + zeitErsparnis + zahlungsWiederherstellung;
  const roi = planKosten > 0 ? Math.round(((gesamtErsparnis - planKosten) / planKosten) * 100) : 0;

  return NextResponse.json({
    planKosten,
    plan,
    noShow: {
      aktuelleRate: Math.round(currentRate * 100),
      branchenDurchschnitt: Math.round(branchenDurchschnitt * 100),
      geretteteStunden,
      ersparnis: noShowErsparnis,
    },
    zeit: {
      automationen,
      stundenGespart: zeitStunden,
      ersparnis: zeitErsparnis,
    },
    zahlungen: {
      wiederhergestellt: zahlungsWiederherstellung,
      mahnungenErfolgreich: zr.filter((z: Record<string, unknown>) => z.status === "bezahlt" && (z.mahnungs_stufe as number) > 0).length,
    },
    gesamt: {
      ersparnis: gesamtErsparnis,
      roi,
      nettoVorteil: gesamtErsparnis - planKosten,
    },
  });
}
