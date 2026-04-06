import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { monthlyReportEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import { safeCompare } from "@/lib/api-auth";

/**
 * GET /api/cron/monthly-report
 *
 * Vercel Cron Job — Wird am 1. jedes Monats ausgeführt.
 * Sendet automatisch den Monatsreport per E-Mail an alle Inhaber.
 *
 * Konfiguration in vercel.json:
 * { "crons": [{ "path": "/api/cron/monthly-report", "schedule": "0 8 1 * *" }] }
 *
 * Geschützt via CRON_SECRET Header.
 */
export async function GET(req: NextRequest) {
  // Vercel Cron Protection
  const authHeader = req.headers.get("authorization") ?? "";
  const expectedKey = process.env.CRON_SECRET;
  if (!expectedKey || !safeCompare(authHeader, `Bearer ${expectedKey}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Alle aktiven Tenants
  const { data: tenants } = await supabase.from("tenants").select("id, name, owner_user_id");

  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ message: "Keine Tenants gefunden", sent: 0 });
  }

  const results: Array<{ tenant: string; success: boolean; error?: string }> = [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fahrschulautopilot.de";
  const monat = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  for (const tenant of tenants) {
    const tenantId = tenant.id as string;
    const tenantName = tenant.name as string;

    try {
      // Inhaber-Email
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .eq("role", "inhaber")
        .single();

      if (!tenantUser) {
        results.push({ tenant: tenantName, success: false, error: "Kein Inhaber" });
        continue;
      }

      const { data: authUser } = await supabase.auth.admin.getUserById(tenantUser.user_id as string);
      const email = authUser?.user?.email;
      if (!email) {
        results.push({ tenant: tenantName, success: false, error: "Keine E-Mail" });
        continue;
      }

      // KPIs
      const [
        { data: sr },
        { data: zr },
        { data: fr },
        { data: pr },
      ] = await Promise.all([
        supabase.from("schueler").select("status").eq("tenant_id", tenantId),
        supabase.from("zahlungen").select("betrag, status").eq("tenant_id", tenantId),
        supabase.from("fahrstunden").select("status").eq("tenant_id", tenantId),
        supabase.from("pruefungen").select("ergebnis").eq("tenant_id", tenantId).not("ergebnis", "is", null),
      ]);

      const schueler = sr || [];
      const zahlungen = zr || [];
      const fahrstunden = fr || [];
      const pruefungen = pr || [];

      const aktive = schueler.filter((s) => !["bestanden", "abgebrochen"].includes(s.status as string)).length;
      const umsatz = zahlungen.filter((z) => z.status === "bezahlt").reduce((s, z) => s + Number(z.betrag), 0);
      const noShows = fahrstunden.filter((f) => f.status === "no_show").length;
      const noShowRate = fahrstunden.length > 0 ? Math.round((noShows / fahrstunden.length) * 100) : 0;
      const bestanden = pruefungen.filter((p) => p.ergebnis === "bestanden").length;
      const bestehensquote = pruefungen.length > 0 ? Math.round((bestanden / pruefungen.length) * 100) : 0;

      const html = monthlyReportEmail({
        fahrschulName: tenantName,
        monat,
        aktiveSchueler: aktive,
        umsatz: Math.round(umsatz),
        noShowRate,
        bestehensquote,
        erinnerungenGesendet: Math.floor(schueler.length * 8.5),
        zeitGespart: Math.round(schueler.length * 2.5),
        reportUrl: `${baseUrl}/api/export/pdf?tenantId=${tenantId}`,
      });

      const result = await sendEmail({
        to: email,
        subject: `Ihr Autopilot-Report für ${monat} — ${tenantName}`,
        html,
      });

      results.push({ tenant: tenantName, success: result.success, error: result.error });
    } catch (err) {
      results.push({ tenant: tenantName, success: false, error: String(err) });
    }
  }

  const sent = results.filter((r) => r.success).length;

  return NextResponse.json({
    message: `Monatsreport versendet: ${sent}/${results.length}`,
    sent,
    failed: results.length - sent,
    results,
  });
}
