import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

const checkLimit = rateLimit("crm-export-datev", 10, 60_000);

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes(',')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/crm/export/datev?tenantId=xxx&von=2026-01-01&bis=2026-03-31
 * Generates a DATEV-compatible CSV export of all Zahlungen for the given period.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const von = req.nextUrl.searchParams.get("von");
  const bis = req.nextUrl.searchParams.get("bis");

  if (!tenantId || !von || !bis) {
    return NextResponse.json({ error: "tenantId, von und bis required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const supabase = await createClient();

  const { data: zahlungen, error } = await supabase
    .from("zahlungen")
    .select("*, schueler(vorname, nachname)")
    .eq("tenant_id", auth.tenantId)
    .eq("status", "bezahlt")
    .gte("bezahlt_am", von)
    .lte("bezahlt_am", bis)
    .order("bezahlt_am", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build DATEV CSV
  const header = '"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";"BU-Schlüssel";"Belegdatum";"Belegfeld 1";"Buchungstext"';

  const rows = (zahlungen || []).map((z) => {
    const schueler = z.schueler as { vorname: string; nachname: string } | null;
    const betrag = Number(z.betrag).toFixed(2).replace(".", ",");
    const datum = z.bezahlt_am
      ? (() => {
          const d = new Date(z.bezahlt_am);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          return `${day}${month}`;
        })()
      : "";
    const name = schueler ? `${schueler.vorname} ${schueler.nachname}` : "";
    const buchungstext = `${z.beschreibung} ${name}`.trim();
    const belegfeld = z.id.substring(0, 8).toUpperCase();

    return `${csvEscape(betrag)};"H";"EUR";"10000";"8400";"";${csvEscape(datum)};${csvEscape(belegfeld)};${csvEscape(buchungstext)}`;
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="DATEV_Export_${von}_${bis}.csv"`,
    },
  });
}
