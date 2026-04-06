import jsPDF from "jspdf";

export interface ReportStats {
  tenantName: string;
  aktiv: number;
  totalSchueler: number;
  bestanden: number;
  umsatzBezahlt: number;
  umsatzOffen: number;
  fahrstundenGesamt: number;
  noShows: number;
  noShowRate: number;
  pruefungenGesamt: number;
  bestehensquote: number;
}

/**
 * Generiert einen professionellen Monatsreport als echtes PDF.
 */
export function generateMonthlyReportPDF(stats: ReportStats): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = w - 2 * margin;
  let y = 0;

  // --- Header ---
  doc.setFillColor(26, 26, 46); // #1a1a2e
  doc.rect(0, 0, w, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Monatsreport", margin, 18);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(stats.tenantName, margin, 28);
  doc.setFontSize(10);
  doc.text(
    `Erstellt am ${new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}`,
    margin,
    35,
  );

  y = 52;

  // --- KPI Boxes ---
  doc.setTextColor(30, 30, 50);
  const kpis = [
    { label: "Aktive Schueler", value: String(stats.aktiv), color: [59, 130, 246] as [number, number, number] },
    { label: "Umsatz (bezahlt)", value: `${stats.umsatzBezahlt.toLocaleString("de-DE")} EUR`, color: [34, 197, 94] as [number, number, number] },
    { label: "No-Show Rate", value: `${stats.noShowRate}%`, color: stats.noShowRate > 10 ? [239, 68, 68] as [number, number, number] : [34, 197, 94] as [number, number, number] },
    { label: "Bestehensquote", value: `${stats.bestehensquote}%`, color: [139, 92, 246] as [number, number, number] },
    { label: "Offene Betraege", value: `${stats.umsatzOffen.toLocaleString("de-DE")} EUR`, color: stats.umsatzOffen > 1000 ? [239, 68, 68] as [number, number, number] : [107, 114, 128] as [number, number, number] },
    { label: "Fahrstunden ges.", value: String(stats.fahrstundenGesamt), color: [107, 114, 128] as [number, number, number] },
  ];

  const boxW = (contentW - 10) / 3; // 3 columns, 5mm gap
  const boxH = 28;
  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * (boxW + 5);
    const by = y + row * (boxH + 5);

    // Box background
    doc.setFillColor(248, 249, 252);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, by, boxW, boxH, 3, 3, "FD");

    // Value
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, x + boxW / 2, by + 13, { align: "center" });

    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 120);
    doc.text(kpi.label, x + boxW / 2, by + 21, { align: "center" });
  });

  y += 2 * (boxH + 5) + 10;

  // --- Section: Schueler ---
  y = drawSection(doc, "Schueler-Uebersicht", y, margin, contentW);
  const schuelerData = [
    ["Gesamt Schueler", String(stats.totalSchueler)],
    ["Aktiv in Ausbildung", String(stats.aktiv)],
    ["Bestanden", String(stats.bestanden)],
    ["No-Shows", String(stats.noShows)],
  ];
  y = drawTable(doc, schuelerData, y, margin, contentW);

  y += 8;

  // --- Section: Finanzen ---
  y = drawSection(doc, "Finanzen", y, margin, contentW);
  const finanzData = [
    ["Umsatz bezahlt", `${stats.umsatzBezahlt.toLocaleString("de-DE")} EUR`],
    ["Offene Rechnungen", `${stats.umsatzOffen.toLocaleString("de-DE")} EUR`],
  ];
  y = drawTable(doc, finanzData, y, margin, contentW);

  y += 8;

  // --- Section: Pruefungen ---
  y = drawSection(doc, "Pruefungen", y, margin, contentW);
  const pruefData = [
    ["Pruefungen gesamt", String(stats.pruefungenGesamt)],
    ["Bestehensquote", `${stats.bestehensquote}%`],
  ];
  y = drawTable(doc, pruefData, y, margin, contentW);

  // --- Footer ---
  y = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, w - margin, y);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("Fahrschule Autopilot - AI-Automation fuer deutsche Fahrschulen", w / 2, y + 6, { align: "center" });
  doc.text("fahrschulautopilot.de", w / 2, y + 11, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

function drawSection(doc: jsPDF, title: string, y: number, margin: number, contentW: number): number {
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 50);
  doc.text(title, margin, y);
  y += 2;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentW, y);
  return y + 6;
}

function drawTable(doc: jsPDF, rows: string[][], y: number, margin: number, contentW: number): number {
  doc.setFontSize(10);
  const rowH = 8;
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 100);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 50);
    doc.text(value, margin + contentW, y, { align: "right" });
    y += rowH;
  }
  return y;
}
