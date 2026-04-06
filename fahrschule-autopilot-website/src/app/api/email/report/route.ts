import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { monthlyReportEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed } from "@/lib/api-auth";

/**
 * POST /api/email/report
 *
 * Sendet den monatlichen Report per E-Mail an den Fahrschul-Inhaber.
 * Kann manuell oder per Cron-Job aufgerufen werden.
 *
 * Body: { tenantId: string } oder leer für alle Tenants
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthed(auth)) return auth;

    const body = await req.json().catch(() => ({}));
    const supabase = await createClient();

    // Einzelner Tenant oder alle
    let tenantIds: string[] = [];
    if (body.tenantId) {
      tenantIds = [body.tenantId];
    } else {
      const { data: allTenants } = await supabase.from("tenants").select("id");
      tenantIds = (allTenants || []).map((t) => t.id as string);
    }

    const results: Array<{ tenantId: string; name: string; success: boolean; error?: string }> = [];

    for (const tenantId of tenantIds) {
      try {
        // Tenant-Info + Inhaber-Email
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name, owner_user_id")
          .eq("id", tenantId)
          .single();

        if (!tenant) {
          results.push({ tenantId, name: "?", success: false, error: "Tenant nicht gefunden" });
          continue;
        }

        // Inhaber-Email holen
        const { data: ownerUser } = await supabase
          .from("tenant_users")
          .select("user_id")
          .eq("tenant_id", tenantId)
          .eq("role", "inhaber")
          .single();

        if (!ownerUser) {
          results.push({ tenantId, name: tenant.name as string, success: false, error: "Kein Inhaber gefunden" });
          continue;
        }

        const { data: authUser } = await supabase.auth.admin.getUserById(ownerUser.user_id as string);
        const email = authUser?.user?.email;
        if (!email) {
          results.push({ tenantId, name: tenant.name as string, success: false, error: "Keine E-Mail" });
          continue;
        }

        // KPIs berechnen
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

        const aktive = sr.filter((s) => !["bestanden", "abgebrochen"].includes(s.status as string)).length;
        const umsatz = zr.filter((z) => z.status === "bezahlt").reduce((s, z) => s + Number(z.betrag), 0);
        const noShows = fr.filter((f) => f.status === "no_show").length;
        const noShowRate = fr.length > 0 ? Math.round((noShows / fr.length) * 100) : 0;
        const bestanden = pr.filter((p) => p.ergebnis === "bestanden").length;
        const bestehensquote = pr.length > 0 ? Math.round((bestanden / pr.length) * 100) : 0;

        const monat = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fahrschulautopilot.de";

        const html = monthlyReportEmail({
          fahrschulName: tenant.name as string,
          monat,
          aktiveSchueler: aktive,
          umsatz: Math.round(umsatz),
          noShowRate,
          bestehensquote,
          erinnerungenGesendet: Math.floor(sr.length * 8.5),
          zeitGespart: Math.round(sr.length * 2.5),
          reportUrl: `${baseUrl}/api/export/pdf?tenantId=${tenantId}`,
        });

        const result = await sendEmail({
          to: email,
          subject: `Ihr Autopilot-Report für ${monat} — ${tenant.name}`,
          html,
        });

        results.push({
          tenantId,
          name: tenant.name as string,
          success: result.success,
          error: result.error,
        });
      } catch (err) {
        results.push({ tenantId, name: "?", success: false, error: String(err) });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      total: results.length,
      sent,
      failed,
      results,
    });
  } catch (error) {
    console.error("[Email Report] Error:", error);
    return NextResponse.json({ error: "Report-Versand fehlgeschlagen" }, { status: 500 });
  }
}
