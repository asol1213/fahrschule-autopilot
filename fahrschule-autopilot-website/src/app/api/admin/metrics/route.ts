import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeCompare } from "@/lib/api-auth";

const PLAN_PRICES: Record<string, number> = {
  starter: 99,
  pro: 249,
  premium: 349,
};

/**
 * GET /api/admin/metrics
 *
 * Internes Business-Dashboard: MRR, Kunden, Churn, Pipeline.
 * Geschützt via API-Key Header (timing-safe).
 */
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-admin-key") || "";
  if (!process.env.ADMIN_API_KEY || !safeCompare(apiKey, process.env.ADMIN_API_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const [
    { data: tenants },
    { data: allSchueler },
    { data: allZahlungen },
    { data: allLeads },
    { data: sentEmails },
  ] = await Promise.all([
    supabase.from("tenants").select("id, slug, name, plan, created_at"),
    supabase.from("schueler").select("tenant_id, status, created_at"),
    supabase.from("zahlungen").select("tenant_id, betrag, status"),
    supabase.from("sales_leads").select("id, status, created_at").then(r => r, () => ({ data: [] as Record<string, unknown>[], error: null, count: null, status: 200, statusText: "OK" })),
    supabase.from("follow_ups").select("id, status").eq("status", "gesendet").then(r => r, () => ({ data: [] as Record<string, unknown>[], error: null, count: null, status: 200, statusText: "OK" })),
  ]);

  const tenantsArr = tenants || [];
  const schuelerArr = allSchueler || [];
  const zahlungenArr = allZahlungen || [];

  // MRR
  const mrr = tenantsArr.reduce((sum, t) => sum + (PLAN_PRICES[t.plan as string] || 0), 0);

  // Kunden pro Plan
  const kundenProPlan = {
    starter: tenantsArr.filter((t) => t.plan === "starter").length,
    pro: tenantsArr.filter((t) => t.plan === "pro").length,
    premium: tenantsArr.filter((t) => t.plan === "premium").length,
  };

  // Gesamt-Stats
  const totalKunden = tenantsArr.length;
  const totalSchueler = schuelerArr.length;
  const totalUmsatz = zahlungenArr
    .filter((z) => z.status === "bezahlt")
    .reduce((s, z) => s + Number(z.betrag), 0);

  // Schüler pro Tenant (für Durchschnitt)
  const schuelerProTenant = new Map<string, number>();
  schuelerArr.forEach((s) => {
    const tid = s.tenant_id as string;
    schuelerProTenant.set(tid, (schuelerProTenant.get(tid) || 0) + 1);
  });
  const avgSchuelerProKunde = totalKunden > 0
    ? Math.round(totalSchueler / totalKunden)
    : 0;

  // LTV (vereinfacht: avg plan price × avg lifetime 12 Monate)
  const avgPlanPrice = totalKunden > 0 ? mrr / totalKunden : 0;
  const estimatedLTV = Math.round(avgPlanPrice * 12);

  // Kunden-Timeline (wann angemeldet)
  const kundenProMonat: Array<{ monat: string; label: string; count: number; mrr: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
    const monatTenants = tenantsArr.filter((t) => (t.created_at as string).startsWith(key));
    const monatMRR = monatTenants.reduce((s, t) => s + (PLAN_PRICES[t.plan as string] || 0), 0);
    kundenProMonat.push({ monat: key, label, count: monatTenants.length, mrr: monatMRR });
  }

  // Top-Kunden (nach Schüler-Anzahl)
  const topKunden = tenantsArr
    .map((t) => ({
      name: t.name,
      plan: t.plan,
      schueler: schuelerProTenant.get(t.id as string) || 0,
      mrr: PLAN_PRICES[t.plan as string] || 0,
    }))
    .sort((a, b) => b.schueler - a.schueler)
    .slice(0, 10);

  // CAC (Customer Acquisition Cost)
  // Berechnung: Infrastruktur + Zeitaufwand / gewonnene Kunden
  // Geschätzt: €125/Monat Toolkosten + 0 Paid Ads (organisch)
  const monthlyToolCost = 125; // n8n, Claude API, Vercel, etc.
  const totalOutreachEffort = (sentEmails || []).length; // Gesendete Follow-Ups als Proxy
  const totalLeadsCount = (allLeads || []).length;
  const gewonneneKunden = (allLeads || []).filter((l) => l.status === "gewonnen").length;
  const cac = gewonneneKunden > 0 ? Math.round(monthlyToolCost / gewonneneKunden) : 0;
  const leadToCustomerRate = totalLeadsCount > 0 ? Math.round((gewonneneKunden / totalLeadsCount) * 100) : 0;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    mrr,
    arr: mrr * 12,
    totalKunden,
    totalSchueler,
    totalUmsatz: Math.round(totalUmsatz),
    avgSchuelerProKunde,
    avgPlanPrice: Math.round(avgPlanPrice),
    estimatedLTV,
    cac,
    ltcRatio: cac > 0 ? Math.round(estimatedLTV / cac) : 0, // LTV:CAC ratio
    leadToCustomerRate,
    totalLeads: totalLeadsCount,
    totalOutreach: totalOutreachEffort,
    kundenProPlan,
    kundenProMonat,
    topKunden,
  });
}
