import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emitEvent } from "@/lib/events/emit";
import { safeCompare } from "@/lib/api-auth";
import { captureError } from "@/lib/monitoring";

/**
 * GET /api/cron/mahnwesen
 * Täglicher Cron-Job: Mahnwesen für alle aktiven Tenants ausführen.
 * Vercel ruft diesen Endpoint jeden Tag um 09:00 UTC auf.
 * Geschützt durch CRON_SECRET (Authorization: Bearer <secret>).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || !safeCompare(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const today = new Date();

    // Alle aktiven Tenants laden
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name");

    if (tenantsError || !tenants) {
      return NextResponse.json({ error: "Fehler beim Laden der Tenants" }, { status: 500 });
    }

    const results: Array<{ tenantId: string; name: string; processed: number; error?: string }> = [];

    for (const tenant of tenants) {
      try {
        const { data: offene } = await supabase
          .from("zahlungen")
          .select("id, schueler_id, betrag, beschreibung, faellig_am, mahnungs_stufe")
          .eq("tenant_id", tenant.id)
          .in("status", ["offen", "ueberfaellig"])
          .order("faellig_am");

        if (!offene || offene.length === 0) {
          results.push({ tenantId: tenant.id, name: tenant.name, processed: 0 });
          continue;
        }

        let processed = 0;

        for (const zahlung of offene) {
          const faellig = new Date(zahlung.faellig_am);
          const tageUeberfaellig = Math.floor(
            (today.getTime() - faellig.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (tageUeberfaellig < 7) continue;

          let neueStufe = zahlung.mahnungs_stufe;
          let aktion = "";

          if (tageUeberfaellig >= 7 && zahlung.mahnungs_stufe < 1) {
            neueStufe = 1;
            aktion = "freundliche_erinnerung";
          } else if (tageUeberfaellig >= 14 && zahlung.mahnungs_stufe < 2) {
            neueStufe = 2;
            aktion = "mahnung";
          } else if (tageUeberfaellig >= 21 && zahlung.mahnungs_stufe < 3) {
            neueStufe = 3;
            aktion = "letzte_warnung";
          }

          if (neueStufe > zahlung.mahnungs_stufe) {
            await supabase
              .from("zahlungen")
              .update({
                mahnungs_stufe: neueStufe,
                status: tageUeberfaellig >= 14 ? "ueberfaellig" : "offen",
              })
              .eq("id", zahlung.id);

            emitEvent("zahlung.mahnung", tenant.id, {
              zahlungId: zahlung.id,
              schuelerId: zahlung.schueler_id,
              betrag: zahlung.betrag,
              beschreibung: zahlung.beschreibung,
              stufe: neueStufe,
              aktion,
              tageUeberfaellig,
            });

            processed++;
          }
        }

        results.push({ tenantId: tenant.id, name: tenant.name, processed });
      } catch (err) {
        captureError(err instanceof Error ? err : new Error(String(err)), {
          component: "cron-mahnwesen",
          tenantId: tenant.id,
        });
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ tenantId: tenant.id, name: tenant.name, processed: 0, error: msg });
      }
    }

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    console.log(`[CRON mahnwesen] ${today.toISOString()} — ${totalProcessed} Mahnungen für ${tenants.length} Tenants`);

    return NextResponse.json({
      success: true,
      date: today.toISOString().split("T")[0],
      tenants: tenants.length,
      totalProcessed,
      results,
    });
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      component: "cron-mahnwesen",
      action: "global",
    });
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
