import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";

const checkLimit = rateLimit("crm-vertrag-pdf", 10, 60_000);

/**
 * GET /api/crm/vertrag/pdf?vertragId=xxx&tenantId=xxx
 * Generates a PDF of the signed contract
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const vertragId = req.nextUrl.searchParams.get("vertragId");
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  if (!vertragId || !tenantId) {
    return NextResponse.json({ error: "vertragId und tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const supabase = await createClient();

  // Fetch contract with student data
  const { data: vertrag, error } = await supabase
    .from("vertraege")
    .select("*, schueler(vorname, nachname, adresse, plz, ort, fuehrerscheinklasse, email)")
    .eq("id", vertragId)
    .eq("tenant_id", auth.tenantId)
    .single();

  if (error || !vertrag) {
    return NextResponse.json({ error: "Vertrag nicht gefunden" }, { status: 404 });
  }

  // Fetch tenant/Fahrschule name
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", auth.tenantId)
    .single();

  const fahrschulName = tenant?.name || "Fahrschule";
  const schueler = vertrag.schueler as Record<string, string> | null;

  // Generate PDF
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(fahrschulName, 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(14);
  const title = vertrag.vertragstyp === "dsgvo_einwilligung"
    ? "Datenschutz-Einwilligungserklärung"
    : "Ausbildungsvertrag";
  doc.text(title, 105, y, { align: "center" });
  y += 15;

  // Horizontal line
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 10;

  // Student data
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Schülerdaten:", 20, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (schueler) {
    doc.text(`Name: ${schueler.vorname || ""} ${schueler.nachname || ""}`, 20, y);
    y += 6;
    if (schueler.adresse) {
      doc.text(`Adresse: ${schueler.adresse}, ${schueler.plz || ""} ${schueler.ort || ""}`, 20, y);
      y += 6;
    }
    if (schueler.email) {
      doc.text(`E-Mail: ${schueler.email}`, 20, y);
      y += 6;
    }
    doc.text(`Führerscheinklasse: ${schueler.fuehrerscheinklasse || "B"}`, 20, y);
    y += 6;
  }

  y += 5;
  doc.line(20, y, 190, y);
  y += 10;

  // Contract terms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Vertragsbedingungen:", 20, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const terms = vertrag.vertragstyp === "dsgvo_einwilligung"
    ? [
        "Hiermit willige ich in die Verarbeitung meiner personenbezogenen Daten",
        "zum Zwecke der Fahrausbildung ein. Die Daten werden ausschließlich",
        "für die Durchführung und Verwaltung der Fahrausbildung verwendet.",
        "",
        "Erhobene Daten: Name, Adresse, Geburtsdatum, Kontaktdaten,",
        "Ausbildungsstand, Prüfungsergebnisse, Zahlungsinformationen.",
        "",
        "Die Einwilligung kann jederzeit widerrufen werden. Der Widerruf",
        "berührt nicht die Rechtmäßigkeit der bis zum Widerruf erfolgten",
        "Verarbeitung.",
        "",
        "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO",
      ]
    : [
        "1. Gegenstand des Vertrages ist die theoretische und praktische",
        "   Ausbildung zum Erwerb der Fahrerlaubnis der angegebenen Klasse.",
        "",
        "2. Die Fahrschule verpflichtet sich, den Fahrschüler nach den",
        "   geltenden gesetzlichen Bestimmungen auszubilden.",
        "",
        "3. Der Fahrschüler verpflichtet sich zur regelmäßigen Teilnahme",
        "   am Unterricht sowie zur pünktlichen Zahlung der vereinbarten",
        "   Ausbildungsgebühren.",
        "",
        "4. Fahrstunden, die nicht mindestens 48 Stunden vorher abgesagt",
        "   werden, werden in Rechnung gestellt.",
        "",
        "5. Der Vertrag kann von beiden Seiten mit einer Frist von",
        "   2 Wochen schriftlich gekündigt werden.",
        "",
        "6. Es gelten die Preise gemäß der aktuellen Preisliste der Fahrschule.",
      ];

  for (const line of terms) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += 5;
  }

  y += 10;

  // Signature area
  if (vertrag.unterschrift_url) {
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Unterschrift:", 20, y);
    y += 5;

    try {
      // Add signature image (base64)
      doc.addImage(vertrag.unterschrift_url, "PNG", 20, y, 80, 30);
      y += 35;
    } catch {
      doc.setFont("helvetica", "italic");
      doc.text("[Digitale Unterschrift vorhanden]", 20, y);
      y += 10;
    }

    if (vertrag.unterschrieben_am) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const signDate = new Date(vertrag.unterschrieben_am).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`Datum der Unterschrift: ${signDate}`, 20, y);
      y += 8;
    }

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Dieses Dokument wurde digital unterschrieben.", 20, y);
  }

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Vertrag_${vertragId}.pdf"`,
    },
  });
}
