import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emitEvent } from "@/lib/events/emit";
import { requireAuth, isAuthed, safeCompare, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-mahnwesen", 60, 60_000);

/**
 * POST /api/crm/mahnwesen
 * Run the 3-stage dunning process for a tenant.
 * Body: { tenantId } — called by dashboard UI or cron job.
 *
 * Auth: Either valid session (dashboard) OR Authorization: Bearer CRON_SECRET (cron job).
 *
 * Stage 1 (Tag 7 nach Fälligkeit): Freundliche Erinnerung
 * Stage 2 (Tag 14): Mahnung
 * Stage 3 (Tag 21): Letzte Warnung
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const tenantId = body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    // Allow cron job via CRON_SECRET, otherwise require session auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const isCron = !!process.env.CRON_SECRET && safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`);

    if (!isCron) {
      const auth = await requireAuth(tenantId);
      if (!isAuthed(auth)) return auth;
    }

    const supabase = await createClient();
    const today = new Date();

    // Get all open/overdue payments
    const { data: offene } = await supabase
      .from("zahlungen")
      .select("id, schueler_id, betrag, beschreibung, faellig_am, mahnungs_stufe, status")
      .eq("tenant_id", tenantId)
      .in("status", ["offen", "ueberfaellig"])
      .order("faellig_am");

    if (!offene || offene.length === 0) {
      return NextResponse.json({ message: "Keine offenen Zahlungen", processed: 0 });
    }

    const results: Array<{ id: string; aktion: string; stufe: number }> = [];

    for (const zahlung of offene) {
      const faellig = new Date(zahlung.faellig_am);
      const tageUeberfaellig = Math.floor(
        (today.getTime() - faellig.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (tageUeberfaellig < 7) continue; // Not due for reminder yet

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
        // Update payment
        await supabase
          .from("zahlungen")
          .update({
            mahnungs_stufe: neueStufe,
            status: tageUeberfaellig >= 14 ? "ueberfaellig" : "offen",
          })
          .eq("id", zahlung.id);

        // Emit event for Agent 4 (WhatsApp) to send reminder
        emitEvent("zahlung.mahnung", tenantId, {
          zahlungId: zahlung.id,
          schuelerId: zahlung.schueler_id,
          betrag: zahlung.betrag,
          beschreibung: zahlung.beschreibung,
          stufe: neueStufe,
          aktion,
          tageUeberfaellig,
        });

        results.push({ id: zahlung.id, aktion, stufe: neueStufe });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      total: offene.length,
      mahnungen: results,
    });
  } catch {
    return NextResponse.json({ error: "Fehler beim Mahnwesen" }, { status: 500 });
  }
}
