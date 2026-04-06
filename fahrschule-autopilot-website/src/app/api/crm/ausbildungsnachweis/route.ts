import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import jsPDF from "jspdf";

const checkLimit = rateLimit("crm-ausbildungsnachweis", 30, 60_000);

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * GET /api/crm/ausbildungsnachweis?schuelerId=xxx&tenantId=xxx
 *
 * Generiert einen PDF-Ausbildungsnachweis fuer einen Fahrschueler.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  if (!schuelerId || !tenantId) {
    return NextResponse.json(
      { error: "schuelerId und tenantId sind erforderlich" },
      { status: 400 }
    );
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const supabase = await createClient();

  // Parallel data fetching
  const [
    { data: schueler },
    { data: fahrstunden },
    { data: pruefungen },
    { data: dokumente },
    { data: tenant },
  ] = await Promise.all([
    supabase
      .from("schueler")
      .select("*, fahrlehrer(vorname, nachname)")
      .eq("id", schuelerId)
      .eq("tenant_id", tenantId)
      .single(),
    supabase
      .from("fahrstunden")
      .select("*, fahrlehrer(vorname, nachname)")
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId)
      .order("datum", { ascending: true }),
    supabase
      .from("pruefungen")
      .select("*")
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId)
      .order("datum", { ascending: true }),
    supabase
      .from("dokumente")
      .select("*")
      .eq("schueler_id", schuelerId)
      .eq("tenant_id", tenantId),
    supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .single(),
  ]);

  if (!schueler) {
    return NextResponse.json(
      { error: "Schüler nicht gefunden" },
      { status: 404 }
    );
  }

  const fahrschulname = (tenant?.name as string) || "Fahrschule";
  const vorname = (schueler.vorname as string) || "";
  const nachname = (schueler.nachname as string) || "";
  const allFahrstunden = fahrstunden || [];
  const allPruefungen = pruefungen || [];
  const allDokumente = dokumente || [];

  // --- Generate PDF ---
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = w - 2 * margin;
  let y = 0;

  function checkNewPage(needed: number) {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  }

  function drawSeparator() {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentW, y);
    y += 6;
  }

  function drawSectionHeader(title: string) {
    checkNewPage(20);
    drawSeparator();
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 50);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + contentW, y);
    y += 7;
  }

  // ═══ HEADER ═══
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, w, 48, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("AUSBILDUNGSNACHWEIS", w / 2, 22, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Fahrschule ${fahrschulname}`, w / 2, 33, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  doc.text(
    `Erstellt am ${formatDate(new Date().toISOString())}`,
    w / 2,
    42,
    { align: "center" }
  );

  y = 58;

  // ═══ SCHUELER INFO ═══
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(10);

  const statusLabels: Record<string, string> = {
    angemeldet: "Angemeldet",
    dokumente_ausstehend: "Dokumente ausstehend",
    theorie: "Theorie",
    praxis: "Praxis",
    pruefung: "Prüfung",
    bestanden: "Bestanden",
  };

  const infoRows = [
    ["Schüler:", `${vorname} ${nachname}`],
    ["Geburtsdatum:", formatDate(schueler.geburtsdatum as string | null)],
    ["Führerscheinklasse:", (schueler.fuehrerscheinklasse as string) || "B"],
    ["Anmeldedatum:", formatDate(schueler.created_at as string | null)],
    [
      "Status:",
      statusLabels[(schueler.status as string) || ""] ||
        (schueler.status as string) ||
        "—",
    ],
  ];

  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 120);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 50);
    doc.text(value, margin + 45, y);
    y += 7;
  }

  y += 4;

  // ═══ DOKUMENTE ═══
  drawSectionHeader("DOKUMENTE");

  const dokumenteTypen = [
    "Sehtest",
    "Erste-Hilfe-Kurs",
    "Passfoto",
    "Führerschein-Antrag",
    "Biometrisches Passbild",
  ];

  const dokumenteMap = new Map<string, boolean>();
  for (const d of allDokumente) {
    dokumenteMap.set(d.typ as string, !!d.vorhanden);
  }

  doc.setFontSize(10);
  for (const typ of dokumenteTypen) {
    checkNewPage(8);
    const vorhanden = dokumenteMap.get(typ) ?? false;
    const symbol = vorhanden ? "[x]" : "[ ]";
    const statusText = vorhanden ? "vorhanden" : "ausstehend";

    doc.setFont("helvetica", "normal");
    doc.setTextColor(vorhanden ? 34 : 200, vorhanden ? 150 : 80, vorhanden ? 34 : 80);
    doc.text(symbol, margin, y);
    doc.setTextColor(60, 60, 80);
    doc.text(typ, margin + 10, y);
    doc.setTextColor(vorhanden ? 34 : 200, vorhanden ? 150 : 80, vorhanden ? 34 : 80);
    doc.text(statusText, margin + contentW, y, { align: "right" });
    y += 7;
  }

  // Also show any extra documents not in the standard list
  for (const d of allDokumente) {
    const typ = d.typ as string;
    if (!dokumenteTypen.includes(typ)) {
      checkNewPage(8);
      const vorhanden = !!d.vorhanden;
      const symbol = vorhanden ? "[x]" : "[ ]";
      const statusText = vorhanden ? "vorhanden" : "ausstehend";

      doc.setFont("helvetica", "normal");
      doc.setTextColor(vorhanden ? 34 : 200, vorhanden ? 150 : 80, vorhanden ? 34 : 80);
      doc.text(symbol, margin, y);
      doc.setTextColor(60, 60, 80);
      doc.text(typ, margin + 10, y);
      doc.setTextColor(vorhanden ? 34 : 200, vorhanden ? 150 : 80, vorhanden ? 34 : 80);
      doc.text(statusText, margin + contentW, y, { align: "right" });
      y += 7;
    }
  }

  y += 4;

  // ═══ FAHRSTUNDEN-UEBERSICHT ═══
  drawSectionHeader("FAHRSTUNDEN-ÜBERSICHT");

  const abgeschlossen = allFahrstunden.filter(
    (f) => f.status === "abgeschlossen"
  );
  const totalMinutes = abgeschlossen.reduce(
    (sum, f) => sum + (Number(f.dauer) || 0),
    0
  );

  const typCounts: Record<string, number> = {};
  for (const f of abgeschlossen) {
    const typ = (f.typ as string) || "Normal";
    typCounts[typ] = (typCounts[typ] || 0) + 1;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 50);
  doc.text(
    `Gesamt: ${abgeschlossen.length} Fahrstunden (${formatMinutes(totalMinutes)} Stunden)`,
    margin,
    y
  );
  y += 9;

  doc.setFont("helvetica", "normal");
  const typLabels: Record<string, string> = {
    normal: "Normal",
    ueberlandfahrt: "Überlandfahrt",
    autobahnfahrt: "Autobahnfahrt",
    nachtfahrt: "Nachtfahrt",
    pruefungsvorbereitung: "Prüfungsvorbereitung",
  };

  for (const [typ, count] of Object.entries(typCounts)) {
    checkNewPage(8);
    const label = typLabels[typ.toLowerCase()] || typ;
    doc.setTextColor(80, 80, 100);
    doc.text(label + ":", margin + 4, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 50);
    doc.text(`${count} Stunden`, margin + contentW, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 7;
  }

  if (Object.keys(typCounts).length === 0) {
    doc.setTextColor(150, 150, 150);
    doc.text("Noch keine Fahrstunden absolviert.", margin + 4, y);
    y += 7;
  }

  y += 4;

  // ═══ FAHRSTUNDEN-PROTOKOLL ═══
  drawSectionHeader("FAHRSTUNDEN-PROTOKOLL");

  if (abgeschlossen.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Noch keine Fahrstunden absolviert.", margin, y);
    y += 7;
  } else {
    // Table header
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 120);
    const colX = [margin, margin + 10, margin + 35, margin + 65, margin + 82, margin + 120];
    doc.text("Nr", colX[0], y);
    doc.text("Datum", colX[1], y);
    doc.text("Typ", colX[2], y);
    doc.text("Dauer", colX[3], y);
    doc.text("Fahrlehrer", colX[4], y);
    doc.text("Bewertung", colX[5], y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, y, margin + contentW, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    abgeschlossen.forEach((f, idx) => {
      checkNewPage(8);
      doc.setTextColor(60, 60, 80);
      doc.text(String(idx + 1), colX[0], y);
      doc.text(formatDate(f.datum as string), colX[1], y);
      const typ = typLabels[(f.typ as string || "").toLowerCase()] || (f.typ as string) || "Normal";
      doc.text(typ, colX[2], y);
      doc.text(`${f.dauer || 0}min`, colX[3], y);
      const fl = f.fahrlehrer as Record<string, string> | null;
      const fahrlehrerName = fl
        ? `${fl.vorname || ""} ${fl.nachname || ""}`.trim()
        : "—";
      doc.text(fahrlehrerName, colX[4], y);

      if (f.bewertung) {
        doc.text(`${f.bewertung}/5`, colX[5], y);
      } else {
        doc.text("—", colX[5], y);
      }

      y += 6;
    });
  }

  y += 4;

  // ═══ PRUEFUNGEN ═══
  drawSectionHeader("PRÜFUNGEN");

  doc.setFontSize(10);
  const theoriePruefungen = allPruefungen.filter(
    (p) => (p.typ as string)?.toLowerCase() === "theorie"
  );
  const praxisPruefungen = allPruefungen.filter(
    (p) => (p.typ as string)?.toLowerCase() === "praxis"
  );

  // Theorie
  checkNewPage(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 100);
  doc.text("Theorie:", margin, y);
  if (theoriePruefungen.length > 0) {
    const latest = theoriePruefungen[theoriePruefungen.length - 1];
    const ergebnis =
      (latest.ergebnis as string) === "bestanden" ? "Bestanden" : "Nicht bestanden";
    const fehlerpunkte =
      latest.fehlerpunkte !== null && latest.fehlerpunkte !== undefined
        ? ` (${latest.fehlerpunkte} Fehlerpunkte)`
        : "";
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 50);
    doc.text(
      `${formatDate(latest.datum as string)} — ${ergebnis}${fehlerpunkte}`,
      margin + 25,
      y
    );
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("noch nicht absolviert", margin + 25, y);
  }
  y += 8;

  // Praxis
  checkNewPage(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 100);
  doc.text("Praxis:", margin, y);
  if (praxisPruefungen.length > 0) {
    const latest = praxisPruefungen[praxisPruefungen.length - 1];
    const ergebnis =
      (latest.ergebnis as string) === "bestanden" ? "Bestanden" : "Nicht bestanden";
    const fehlerpunkte =
      latest.fehlerpunkte !== null && latest.fehlerpunkte !== undefined
        ? ` (${latest.fehlerpunkte} Fehlerpunkte)`
        : "";
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 50);
    doc.text(
      `${formatDate(latest.datum as string)} — ${ergebnis}${fehlerpunkte}`,
      margin + 25,
      y
    );
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("noch nicht absolviert", margin + 25, y);
  }
  y += 8;

  // ═══ FOOTER ═══
  const footerY = pageH - 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, margin + contentW, footerY);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Erstellt am: ${formatDate(new Date().toISOString())}`,
    margin,
    footerY + 6
  );
  doc.text(
    `Fahrschule ${fahrschulname} — Fahrschule Autopilot`,
    margin + contentW,
    footerY + 6,
    { align: "right" }
  );

  // Output
  const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
  const safeVorname = vorname.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_");
  const safeNachname = nachname.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_");

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Ausbildungsnachweis_${safeVorname}_${safeNachname}.pdf"`,
    },
  });
}
