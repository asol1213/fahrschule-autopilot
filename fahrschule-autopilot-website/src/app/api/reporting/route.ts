import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("reporting", 30, 60_000);

/**
 * GET /api/reporting?tenantId=xxx
 *
 * Liefert alle KPIs für das Reporting Dashboard.
 * Nutzt den Server-Supabase-Client direkt (RLS-kompatibel).
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

  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!tenantUser) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  // Tenant name
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .maybeSingle();
  const tenantName = tenantRow?.name || "Fahrschule";

  // Alle Daten parallel laden — direkt via Supabase (RLS-konform)
  const [
    { data: schueler },
    { data: fahrstunden },
    { data: zahlungen },
    { data: pruefungen },
  ] = await Promise.all([
    supabase.from("schueler").select("*").eq("tenant_id", tenantId).is("deleted_at", null),
    supabase.from("fahrstunden").select("*").eq("tenant_id", tenantId),
    supabase.from("zahlungen").select("*").eq("tenant_id", tenantId),
    supabase.from("pruefungen").select("*").eq("tenant_id", tenantId),
  ]);

  const s = schueler || [];
  const f = fahrstunden || [];
  const z = zahlungen || [];
  const p = pruefungen || [];

  // Schüler-Statistiken
  const month = new Date().toISOString().slice(0, 7);
  const schuelerStats = {
    total: s.length,
    nachStatus: {
      angemeldet: s.filter((x) => x.status === "angemeldet").length,
      dokumente_ausstehend: s.filter((x) => x.status === "dokumente_ausstehend").length,
      theorie: s.filter((x) => x.status === "theorie").length,
      praxis: s.filter((x) => x.status === "praxis").length,
      pruefung: s.filter((x) => x.status === "pruefung").length,
      bestanden: s.filter((x) => x.status === "bestanden").length,
      abgebrochen: s.filter((x) => x.status === "abgebrochen").length,
    },
    neueAnmeldungenDiesenMonat: s.filter((x) => x.anmeldungs_datum?.startsWith(month)).length,
  };

  // Fahrstunden-Statistiken
  const noShows = f.filter((x) => x.status === "no_show").length;
  const geplant = f.filter((x) => x.status === "geplant").length;
  const abgeschlossen = f.filter((x) => x.status === "abgeschlossen").length;
  const abgesagt = f.filter((x) => x.status === "abgesagt").length;
  const total = f.length;
  const mitBewertung = f.filter((x) => x.bewertung);

  const fahrstundenStats = {
    total,
    geplant,
    abgeschlossen,
    abgesagt,
    noShows,
    noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
    durchschnittsBewertung:
      mitBewertung.length > 0
        ? Math.round(
            (mitBewertung.reduce((sum, x) => sum + (x.bewertung || 0), 0) / mitBewertung.length) * 10
          ) / 10
        : 0,
  };

  // Zahlungs-Statistiken
  const zahlungsStats = {
    summeGesamt: z.reduce((sum, x) => sum + (x.betrag || 0), 0),
    summeBezahlt: z.filter((x) => x.status === "bezahlt").reduce((sum, x) => sum + (x.betrag || 0), 0),
    summeOffen: z.filter((x) => x.status === "offen").reduce((sum, x) => sum + (x.betrag || 0), 0),
    summeUeberfaellig: z.filter((x) => x.status === "ueberfaellig").reduce((sum, x) => sum + (x.betrag || 0), 0),
    anzahlOffen: z.filter((x) => x.status === "offen").length,
    anzahlUeberfaellig: z.filter((x) => x.status === "ueberfaellig").length,
  };

  // Prüfungs-Statistiken
  const bestanden = p.filter((x) => x.ergebnis === "bestanden").length;
  const pruefungsStats = {
    total: p.length,
    bestanden,
    nichtBestanden: p.filter((x) => x.ergebnis === "nicht_bestanden").length,
    bestehensquote: p.length > 0 ? Math.round((bestanden / p.length) * 100) : 0,
    theorie: {
      total: p.filter((x) => x.typ === "theorie").length,
      bestanden: p.filter((x) => x.typ === "theorie" && x.ergebnis === "bestanden").length,
    },
    praxis: {
      total: p.filter((x) => x.typ === "praxis").length,
      bestanden: p.filter((x) => x.typ === "praxis" && x.ergebnis === "bestanden").length,
    },
  };

  // Automations-KPIs (simuliert — in Production aus n8n/Analytics)
  const automationsStats = {
    erinnerungenGesendet: Math.floor(s.length * 8.5),
    bewertungenAngefragt: bestanden,
    zahlungserinnerungenGesendet: z.filter((x) => x.mahnungs_stufe > 0).length,
    zeitGespart: Math.round(s.length * 2.5),
  };

  return NextResponse.json({
    tenantId,
    tenantName,
    generatedAt: new Date().toISOString(),
    schueler: schuelerStats,
    fahrstunden: fahrstundenStats,
    zahlungen: zahlungsStats,
    pruefungen: pruefungsStats,
    automationen: automationsStats,
  });
}
