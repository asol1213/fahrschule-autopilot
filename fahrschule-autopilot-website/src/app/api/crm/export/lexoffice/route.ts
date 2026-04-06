import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

const checkLimit = rateLimit("crm-export-lexoffice", 10, 60_000);

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes(',')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/crm/export/lexoffice?tenantId=xxx&von=2026-01-01&bis=2026-03-31
 * Generates a lexoffice-compatible CSV export of all Zahlungen for the given period.
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

  const header = "Rechnungsnummer;Rechnungsdatum;Fälligkeitsdatum;Kundenname;Beschreibung;Betrag;Status";

  const rows = (zahlungen || []).map((z) => {
    const schueler = z.schueler as { vorname: string; nachname: string } | null;
    const name = schueler ? `${schueler.vorname} ${schueler.nachname}` : "";
    const betrag = Number(z.betrag).toFixed(2).replace(".", ",");
    const rechnungsDatum = z.bezahlt_am
      ? new Date(z.bezahlt_am).toLocaleDateString("de-DE")
      : "";
    const faelligDatum = z.faellig_am
      ? new Date(z.faellig_am).toLocaleDateString("de-DE")
      : "";
    const rechnungsNr = z.id.substring(0, 8).toUpperCase();

    return `${csvEscape(rechnungsNr)};${csvEscape(rechnungsDatum)};${csvEscape(faelligDatum)};${csvEscape(name)};${csvEscape(z.beschreibung)};${csvEscape(betrag)};bezahlt`;
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lexoffice_Export_${von}_${bis}.csv"`,
    },
  });
}
