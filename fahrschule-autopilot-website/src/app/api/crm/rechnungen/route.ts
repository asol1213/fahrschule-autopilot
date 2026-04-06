import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-rechnungen", 60, 60_000);

/**
 * GET /api/crm/rechnungen?tenantId=xxx&zeitraum=monat|quartal|jahr&von=xxx&bis=xxx
 * Revenue reports with time period aggregation
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const zeitraum = req.nextUrl.searchParams.get("zeitraum") || "monat";
  const von = req.nextUrl.searchParams.get("von");
  const bis = req.nextUrl.searchParams.get("bis");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  try {
    const supabase = await createClient();

    // Default date range: last 12 months
    const endDate = bis || new Date().toISOString().split("T")[0];
    const startDate = von || (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split("T")[0];
    })();

    // Get all payments in range
    const { data: zahlungen } = await supabase
      .from("zahlungen")
      .select("betrag, status, faellig_am, bezahlt_am, created_at")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at")
      .limit(500);

    const rows = zahlungen || [];

    // Aggregate by period
    const periods: Record<string, { umsatz: number; offen: number; bezahlt: number; anzahl: number }> = {};

    rows.forEach((z) => {
      const date = new Date(z.created_at);
      let key: string;

      if (zeitraum === "jahr") {
        key = `${date.getFullYear()}`;
      } else if (zeitraum === "quartal") {
        const q = Math.ceil((date.getMonth() + 1) / 3);
        key = `${date.getFullYear()} Q${q}`;
      } else {
        // monat
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!periods[key]) {
        periods[key] = { umsatz: 0, offen: 0, bezahlt: 0, anzahl: 0 };
      }

      const betrag = Number(z.betrag);
      periods[key].umsatz += betrag;
      periods[key].anzahl += 1;

      if (z.status === "bezahlt") {
        periods[key].bezahlt += betrag;
      } else if (z.status === "offen" || z.status === "ueberfaellig") {
        periods[key].offen += betrag;
      }
    });

    // Summary
    const totalUmsatz = rows.reduce((s, z) => s + Number(z.betrag), 0);
    const totalBezahlt = rows.filter((z) => z.status === "bezahlt").reduce((s, z) => s + Number(z.betrag), 0);
    const totalOffen = rows.filter((z) => z.status === "offen" || z.status === "ueberfaellig").reduce((s, z) => s + Number(z.betrag), 0);

    return NextResponse.json({
      zeitraum,
      von: startDate,
      bis: endDate,
      zusammenfassung: {
        umsatzGesamt: totalUmsatz,
        bezahlt: totalBezahlt,
        offen: totalOffen,
        anzahlRechnungen: rows.length,
      },
      perioden: Object.entries(periods).map(([periode, daten]) => ({
        periode,
        ...daten,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}
