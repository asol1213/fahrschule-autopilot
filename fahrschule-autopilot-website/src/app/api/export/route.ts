import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { today, formatDate, statusLabel, typLabel } from "@/lib/analytics/export-helpers";

const checkLimit = rateLimit("export", 10, 60_000);

/**
 * GET /api/export?tenantId=xxx&format=csv&type=schueler|zahlungen|fahrstunden|report
 *
 * Exportiert Daten als CSV für den Steuerberater oder interne Auswertung.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const format = req.nextUrl.searchParams.get("format") || "csv";
  const type = req.nextUrl.searchParams.get("type") || "report";

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  if (format !== "csv") {
    return NextResponse.json({ error: "Nur CSV-Format unterstützt" }, { status: 400 });
  }

  const supabase = await createClient();
  let csv = "";
  let filename = "";

  switch (type) {
    case "schueler": {
      const { data: rows } = await supabase
        .from("schueler")
        .select("vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, anmeldungs_datum, ort")
        .eq("tenant_id", tenantId)
        .order("nachname");

      csv = "Vorname;Nachname;E-Mail;Telefon;Geburtsdatum;Klasse;Status;Anmeldung;Ort\n";
      (rows || []).forEach((r) => {
        csv += `${r.vorname};${r.nachname};${r.email};${r.telefon};${formatDate(r.geburtsdatum)};${r.fuehrerscheinklasse};${statusLabel(r.status)};${formatDate(r.anmeldungs_datum)};${r.ort || ""}\n`;
      });
      filename = `schueler_${tenantId}_${today()}.csv`;
      break;
    }

    case "zahlungen": {
      const { data: rows } = await supabase
        .from("zahlungen")
        .select("betrag, beschreibung, status, faellig_am, bezahlt_am, mahnungs_stufe, schueler(vorname, nachname)")
        .eq("tenant_id", tenantId)
        .order("faellig_am", { ascending: false });

      csv = "Schüler;Beschreibung;Betrag;Status;Fällig am;Bezahlt am;Mahnstufe\n";
      (rows || []).forEach((r) => {
        const s = r.schueler as unknown as Record<string, string> | null;
        const name = s ? `${s.vorname} ${s.nachname}` : "";
        csv += `${name};${r.beschreibung};${Number(r.betrag).toFixed(2).replace(".", ",")};${statusLabel(r.status)};${formatDate(r.faellig_am)};${formatDate(r.bezahlt_am)};${r.mahnungs_stufe}\n`;
      });
      filename = `zahlungen_${tenantId}_${today()}.csv`;
      break;
    }

    case "fahrstunden": {
      const { data: rows } = await supabase
        .from("fahrstunden")
        .select("datum, uhrzeit, dauer, typ, status, bewertung, schueler(vorname, nachname), fahrlehrer(vorname, nachname)")
        .eq("tenant_id", tenantId)
        .order("datum", { ascending: false });

      csv = "Datum;Uhrzeit;Dauer (Min);Typ;Status;Bewertung;Schüler;Fahrlehrer\n";
      (rows || []).forEach((r) => {
        const s = r.schueler as unknown as Record<string, string> | null;
        const f = r.fahrlehrer as unknown as Record<string, string> | null;
        csv += `${formatDate(r.datum)};${r.uhrzeit};${r.dauer};${typLabel(r.typ)};${statusLabel(r.status)};${r.bewertung || "-"};${s ? `${s.vorname} ${s.nachname}` : ""};${f ? `${f.vorname} ${f.nachname}` : ""}\n`;
      });
      filename = `fahrstunden_${tenantId}_${today()}.csv`;
      break;
    }

    case "report": {
      // Kompakter Monatsreport
      const [
        { data: schuelerRows },
        { data: zahlungenRows },
        { data: fahrstundenRows },
        { data: pruefungenRows },
      ] = await Promise.all([
        supabase.from("schueler").select("status").eq("tenant_id", tenantId),
        supabase.from("zahlungen").select("betrag, status").eq("tenant_id", tenantId),
        supabase.from("fahrstunden").select("status").eq("tenant_id", tenantId),
        supabase.from("pruefungen").select("ergebnis").eq("tenant_id", tenantId).not("ergebnis", "is", null),
      ]);

      const sr = schuelerRows || [];
      const zr = zahlungenRows || [];
      const fr = fahrstundenRows || [];
      const pr = pruefungenRows || [];

      const totalUmsatz = zr.filter((z) => z.status === "bezahlt").reduce((s, z) => s + Number(z.betrag), 0);
      const offenUmsatz = zr.filter((z) => z.status === "offen" || z.status === "ueberfaellig").reduce((s, z) => s + Number(z.betrag), 0);
      const noShows = fr.filter((f) => f.status === "no_show").length;
      const bestanden = pr.filter((p) => p.ergebnis === "bestanden").length;
      const bestehensquote = pr.length > 0 ? Math.round((bestanden / pr.length) * 100) : 0;

      csv = "Kennzahl;Wert\n";
      csv += `Gesamt Schüler;${sr.length}\n`;
      csv += `Aktiv (nicht bestanden/abgebrochen);${sr.filter((s) => !["bestanden", "abgebrochen"].includes(s.status as string)).length}\n`;
      csv += `Gesamt Umsatz (bezahlt);${totalUmsatz.toFixed(2).replace(".", ",")} EUR\n`;
      csv += `Offene Beträge;${offenUmsatz.toFixed(2).replace(".", ",")} EUR\n`;
      csv += `Fahrstunden gesamt;${fr.length}\n`;
      csv += `No-Shows;${noShows}\n`;
      csv += `No-Show Rate;${fr.length > 0 ? Math.round((noShows / fr.length) * 100) : 0}%\n`;
      csv += `Prüfungen gesamt;${pr.length}\n`;
      csv += `Bestehensquote;${bestehensquote}%\n`;
      csv += `Erstellt am;${new Date().toLocaleDateString("de-DE")}\n`;
      filename = `report_${tenantId}_${today()}.csv`;
      break;
    }

    default:
      return NextResponse.json({ error: "Unbekannter Export-Typ" }, { status: 400 });
  }

  // BOM für korrekte Umlaute in Excel
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

