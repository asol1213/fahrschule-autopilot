import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { anomalyAlertEmail } from "@/lib/email/templates";
import { detectAnomalies } from "@/lib/analytics/anomalies";
import { safeCompare } from "@/lib/api-auth";
import { captureError } from "@/lib/monitoring";

/**
 * GET /api/cron/anomaly-check
 *
 * Vercel Cron Job — Mo-Fr um 07:00 UTC.
 * Prüft alle Tenants auf Anomalien und sendet Alerts per E-Mail.
 *
 * Konfiguration in vercel.json:
 * { "path": "/api/cron/anomaly-check", "schedule": "0 7 * * 1-5" }
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || !safeCompare(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: tenants } = await supabase.from("tenants").select("id, name, owner_user_id");

  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ message: "Keine Tenants", checked: 0, alerts: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fahrschulautopilot.de";
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - 7 * 8);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  let alertsSent = 0;
  const results: Array<{ tenant: string; anomalies: number; sent: boolean; error?: string }> = [];

  for (const tenant of tenants) {
    const tenantId = tenant.id as string;
    const tenantName = tenant.name as string;

    try {
      // Daten parallel laden
      const [
        { data: fahrstunden },
        { data: offeneZahlungen },
        { data: schuelerAll },
      ] = await Promise.all([
        supabase
          .from("fahrstunden")
          .select("datum, status")
          .eq("tenant_id", tenantId)
          .gte("datum", weekStartStr),
        supabase
          .from("zahlungen")
          .select("betrag, status")
          .eq("tenant_id", tenantId)
          .in("status", ["offen", "ueberfaellig"]),
        supabase
          .from("schueler")
          .select("id, status, vorname, nachname")
          .eq("tenant_id", tenantId)
          .not("status", "eq", "bestanden")
          .not("status", "eq", "abgebrochen"),
      ]);

      // No-Shows pro Woche berechnen
      const noShowWeeks = new Map<string, { total: number; noShows: number }>();
      for (let i = 0; i < 8; i++) {
        const wStart = new Date(now);
        wStart.setDate(wStart.getDate() - wStart.getDay() + 1 - 7 * i);
        const key = wStart.toISOString().split("T")[0];
        noShowWeeks.set(key, { total: 0, noShows: 0 });
      }
      (fahrstunden || []).forEach((f) => {
        const d = new Date(f.datum as string);
        const monday = new Date(d);
        monday.setDate(monday.getDate() - monday.getDay() + 1);
        const key = monday.toISOString().split("T")[0];
        const entry = noShowWeeks.get(key);
        if (entry) {
          entry.total++;
          if (f.status === "no_show") entry.noShows++;
        }
      });
      const noShowsProWoche = Array.from(noShowWeeks.entries())
        .map(([, data]) => ({
          rate: data.total > 0 ? Math.round((data.noShows / data.total) * 100) : 0,
          count: data.noShows,
        }))
        .reverse();

      const pruefungsreif = (schuelerAll || [])
        .filter((s) => s.status === "pruefung")
        .map((s) => ({ name: `${s.vorname} ${s.nachname}`, id: s.id as string }));

      const anomalies = detectAnomalies(noShowsProWoche, offeneZahlungen || [], schuelerAll || [], pruefungsreif);

      // Nur danger + warning alerts senden
      const criticalAnomalies = anomalies.filter((a) => a.type === "danger" || a.type === "warning");

      if (criticalAnomalies.length === 0) {
        results.push({ tenant: tenantName, anomalies: 0, sent: false });
        continue;
      }

      // Owner-E-Mail finden
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .eq("role", "inhaber")
        .single();

      if (!tenantUser) {
        results.push({ tenant: tenantName, anomalies: criticalAnomalies.length, sent: false, error: "Kein Inhaber" });
        continue;
      }

      const { data: authUser } = await supabase.auth.admin.getUserById(tenantUser.user_id as string);
      const email = authUser?.user?.email;
      if (!email) {
        results.push({ tenant: tenantName, anomalies: criticalAnomalies.length, sent: false, error: "Keine E-Mail" });
        continue;
      }

      const html = anomalyAlertEmail({
        fahrschulName: tenantName,
        anomalies: criticalAnomalies,
        dashboardUrl: `${baseUrl}/dashboard/analytics`,
      });

      const result = await sendEmail({
        to: email,
        subject: `Autopilot Alert: ${criticalAnomalies.length} ${criticalAnomalies.length === 1 ? "Warnung" : "Warnungen"} — ${tenantName}`,
        html,
      });

      if (result.success) alertsSent++;
      results.push({ tenant: tenantName, anomalies: criticalAnomalies.length, sent: result.success, error: result.error });
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), {
        component: "cron-anomaly-check",
        tenantId,
      });
      results.push({ tenant: tenantName, anomalies: 0, sent: false, error: String(err) });
    }
  }

  return NextResponse.json({
    message: `Anomaly Check: ${alertsSent} Alerts gesendet für ${tenants.length} Tenants`,
    checked: tenants.length,
    alerts: alertsSent,
    results,
  });
}
