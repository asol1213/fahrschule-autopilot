import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { generateMonthlyReportPDF } from "@/lib/analytics/pdf-generator";

const checkLimit = rateLimit("export-pdf", 10, 60_000);

/**
 * GET /api/export/pdf?tenantId=xxx
 *
 * Generiert einen echten PDF-Monatsreport (jsPDF) zum Download.
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

  // Tenant-Info
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, plan")
    .eq("id", tenantId)
    .single();

  const tenantName = (tenant?.name as string) || "Fahrschule";

  // Daten sammeln
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

  const stats = {
    tenantName,
    totalSchueler: sr.length,
    aktiv: sr.filter((s) => !["bestanden", "abgebrochen"].includes(s.status as string)).length,
    bestanden: sr.filter((s) => s.status === "bestanden").length,
    umsatzBezahlt: zr.filter((z) => z.status === "bezahlt").reduce((s, z) => s + Number(z.betrag), 0),
    umsatzOffen: zr.filter((z) => ["offen", "ueberfaellig"].includes(z.status as string)).reduce((s, z) => s + Number(z.betrag), 0),
    fahrstundenGesamt: fr.length,
    noShows: fr.filter((f) => f.status === "no_show").length,
    noShowRate: fr.length > 0 ? Math.round((fr.filter((f) => f.status === "no_show").length / fr.length) * 100) : 0,
    pruefungenGesamt: pr.length,
    bestehensquote: pr.length > 0 ? Math.round((pr.filter((p) => p.ergebnis === "bestanden").length / pr.length) * 100) : 0,
  };

  const pdfBytes = generateMonthlyReportPDF(stats);
  const safeFilename = tenantName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_");

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report_${safeFilename}_${new Date().toISOString().split("T")[0]}.pdf"`,
    },
  });
}
