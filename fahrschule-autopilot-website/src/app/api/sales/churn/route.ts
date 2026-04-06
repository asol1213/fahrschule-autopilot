import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireServiceKey, isServiceKeyError, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("sales-churn", 30, 60_000);

const PLAN_PRICES: Record<string, number> = { starter: 99, pro: 249, premium: 499 };

/**
 * GET /api/sales/churn
 *
 * Identifiziert Churn-Risiko-Kunden und Upselling-Kandidaten.
 * Churn-Signale: Wenige Schüler, keine neuen Anmeldungen, keine Aktivität
 * Upselling: Starter-Kunden mit vielen Schülern, Pro ohne Premium-Features
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const keyError = requireServiceKey(req, "ADMIN_API_KEY");
  if (isServiceKeyError(keyError)) return keyError;

  const supabase = await createClient();

  const [
    { data: tenants },
    { data: schueler },
    { data: recentAnmeldungen },
    { data: recentFahrstunden },
  ] = await Promise.all([
    supabase.from("tenants").select("id, name, slug, plan, created_at"),
    supabase.from("schueler").select("tenant_id, status, created_at"),
    supabase.from("schueler").select("tenant_id").gte("created_at", daysAgo(30).toISOString()),
    supabase.from("fahrstunden").select("tenant_id").gte("created_at", daysAgo(14).toISOString()),
  ]);

  const t = tenants || [];
  const s = schueler || [];

  // Schüler pro Tenant
  const schuelerCount = new Map<string, number>();
  const aktiveSchueler = new Map<string, number>();
  s.forEach((x) => {
    const tid = x.tenant_id as string;
    schuelerCount.set(tid, (schuelerCount.get(tid) || 0) + 1);
    if (!["bestanden", "abgebrochen"].includes(x.status as string)) {
      aktiveSchueler.set(tid, (aktiveSchueler.get(tid) || 0) + 1);
    }
  });

  // Neue Anmeldungen letzte 30 Tage pro Tenant
  const recentMap = new Map<string, number>();
  (recentAnmeldungen || []).forEach((x) => {
    const tid = x.tenant_id as string;
    recentMap.set(tid, (recentMap.get(tid) || 0) + 1);
  });

  // Aktivität letzte 14 Tage
  const aktivityMap = new Map<string, number>();
  (recentFahrstunden || []).forEach((x) => {
    const tid = x.tenant_id as string;
    aktivityMap.set(tid, (aktivityMap.get(tid) || 0) + 1);
  });

  // Churn-Risiko identifizieren
  const churnRisiko = t
    .map((tenant) => {
      const tid = tenant.id as string;
      const total = schuelerCount.get(tid) || 0;
      const aktiv = aktiveSchueler.get(tid) || 0;
      const neueAnm = recentMap.get(tid) || 0;
      const fahrstundenRecent = aktivityMap.get(tid) || 0;

      let score = 0;
      const reasons: string[] = [];

      if (aktiv === 0) { score += 40; reasons.push("Keine aktiven Schüler"); }
      else if (aktiv <= 2) { score += 20; reasons.push("Nur " + aktiv + " aktive Schüler"); }
      if (neueAnm === 0) { score += 25; reasons.push("Keine Neuanmeldungen (30 Tage)"); }
      if (fahrstundenRecent === 0) { score += 25; reasons.push("Keine Fahrstunden (14 Tage)"); }
      if (total === 0) { score += 10; reasons.push("Gar keine Schüler angelegt"); }

      return {
        tenantId: tid,
        name: tenant.name,
        plan: tenant.plan,
        mrr: PLAN_PRICES[tenant.plan as string] || 0,
        totalSchueler: total,
        aktiveSchueler: aktiv,
        neueAnmeldungen30d: neueAnm,
        fahrstunden14d: fahrstundenRecent,
        churnScore: Math.min(score, 100),
        reasons,
        empfohleneAktion: score >= 60 ? "Sofort anrufen" : score >= 30 ? "E-Mail senden" : "Beobachten",
      };
    })
    .filter((x) => x.churnScore > 20)
    .sort((a, b) => b.churnScore - a.churnScore);

  // Upselling-Kandidaten
  const upsellingKandidaten = t
    .filter((tenant) => tenant.plan !== "premium")
    .map((tenant) => {
      const tid = tenant.id as string;
      const total = schuelerCount.get(tid) || 0;
      const aktiv = aktiveSchueler.get(tid) || 0;
      const neueAnm = recentMap.get(tid) || 0;

      let score = 0;
      let empfehlung = "";

      if (tenant.plan === "starter") {
        if (aktiv >= 20) { score += 40; empfehlung = "Viele Schüler → Pro (Chatbot + Zahlungen)"; }
        else if (aktiv >= 10) { score += 20; empfehlung = "Wachsend → Pro für Automatisierung"; }
        if (neueAnm >= 3) { score += 20; }
      } else if (tenant.plan === "pro") {
        if (aktiv >= 30) { score += 40; empfehlung = "Große Fahrschule → Premium (Website + Telefon)"; }
        else if (aktiv >= 15) { score += 20; empfehlung = "Premium für Website + SEO + CRM"; }
      }

      if (total > 0 && neueAnm > 0) score += 10;

      return {
        tenantId: tid,
        name: tenant.name,
        plan: tenant.plan,
        aktuellerMRR: PLAN_PRICES[tenant.plan as string] || 0,
        zielPlan: tenant.plan === "starter" ? "pro" : "premium",
        potenziellerMRR: tenant.plan === "starter" ? 249 : 349,
        uplift: (tenant.plan === "starter" ? 249 : 349) - (PLAN_PRICES[tenant.plan as string] || 0),
        aktiveSchueler: aktiv,
        upsellingScore: Math.min(score, 100),
        empfehlung,
      };
    })
    .filter((x) => x.upsellingScore > 20)
    .sort((a, b) => b.upsellingScore - a.upsellingScore);

  // Gesamt-Metriken
  const totalMRR = t.reduce((s, x) => s + (PLAN_PRICES[x.plan as string] || 0), 0);
  const potenziellesUpselling = upsellingKandidaten.reduce((s, x) => s + x.uplift, 0);
  const churnRisikoMRR = churnRisiko.reduce((s, x) => s + x.mrr, 0);

  return NextResponse.json({
    churnRisiko,
    upsellingKandidaten,
    metriken: {
      totalKunden: t.length,
      totalMRR,
      kundenMitChurnRisiko: churnRisiko.length,
      churnRisikoMRR,
      upsellingKandidatenAnzahl: upsellingKandidaten.length,
      potenziellesUpselling,
    },
  });
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
