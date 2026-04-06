import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-stats", 60, 60_000);

/**
 * GET /api/crm/stats?tenantId=xxx
 * Returns aggregated KPIs for the dashboard
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
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalSchueler },
    { data: statusRows },
    { data: zahlungenOffen },
    { data: heutigeTermine },
    { data: pruefungen },
    { data: fehlendeDokumente },
  ] = await Promise.all([
    supabase.from("schueler").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("schueler").select("status").eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("zahlungen").select("betrag").eq("tenant_id", tenantId).in("status", ["offen", "ueberfaellig"]).is("deleted_at", null),
    supabase.from("fahrstunden").select("id").eq("tenant_id", tenantId).eq("datum", today).is("deleted_at", null),
    supabase.from("pruefungen").select("ergebnis").eq("tenant_id", tenantId).not("ergebnis", "is", null).is("deleted_at", null),
    supabase.from("dokumente").select("id").eq("tenant_id", tenantId).eq("vorhanden", false).is("deleted_at", null),
  ]);

  // Status distribution
  const statusVerteilung: Record<string, number> = {};
  (statusRows || []).forEach((r) => {
    const s = r.status as string;
    statusVerteilung[s] = (statusVerteilung[s] || 0) + 1;
  });

  // Bestehensquote
  const allP = pruefungen || [];
  const bestanden = allP.filter((p) => p.ergebnis === "bestanden").length;
  const bestehensquote = allP.length > 0 ? Math.round((bestanden / allP.length) * 100) : 0;

  // Summe offene Zahlungen
  const summeOffen = (zahlungenOffen || []).reduce((sum, r) => sum + Number(r.betrag), 0);

  return NextResponse.json({
    totalSchueler: totalSchueler || 0,
    statusVerteilung,
    offeneZahlungen: (zahlungenOffen || []).length,
    summeOffen,
    heutigeTermine: (heutigeTermine || []).length,
    bestehensquote,
    fehlendeDokumente: (fehlendeDokumente || []).length,
  });
}
