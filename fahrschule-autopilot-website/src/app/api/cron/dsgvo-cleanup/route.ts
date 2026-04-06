import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeCompare } from "@/lib/api-auth";
import { captureError } from "@/lib/monitoring";

/**
 * GET /api/cron/dsgvo-cleanup
 * Wöchentlicher Cron-Job (Sonntag 03:00 UTC): DSGVO-Bereinigung.
 *
 * Aufgaben:
 * 1. Schüler mit abgelaufenem loeschung_geplant_am werden gelöscht (CASCADE).
 * 2. Anruf-Aufzeichnungen ohne Einwilligung werden gelöscht.
 * 3. Alte Anrufe (>90 Tage) werden anonymisiert archiviert.
 *
 * Geschützt durch CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || !safeCompare(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const results: Record<string, unknown> = {};

    // 1. Schüler löschen deren Löschfrist abgelaufen ist
    const { data: zuLoeschen, error: loeschError } = await supabase
      .from("schueler")
      .select("id, vorname, nachname, tenant_id")
      .lte("loeschung_geplant_am", today)
      .not("loeschung_geplant_am", "is", null);

    if (!loeschError && zuLoeschen && zuLoeschen.length > 0) {
      const ids = zuLoeschen.map((s) => s.id);
      const { error: deleteError } = await supabase.from("schueler").delete().in("id", ids);
      results.schuelerGeloescht = deleteError ? 0 : zuLoeschen.length;
      if (!deleteError) {
        console.log(`[CRON dsgvo-cleanup] ${zuLoeschen.length} Schüler gelöscht (Aufbewahrungsfrist abgelaufen)`);
      }
    } else {
      results.schuelerGeloescht = 0;
    }

    // 2. Anruf-Aufzeichnungen ohne Einwilligung löschen (recording_url nullen)
    const { data: ohneEinwilligung } = await supabase
      .from("anrufe")
      .select("id")
      .eq("recording_consent", "nein")
      .not("recording_url", "is", null);

    if (ohneEinwilligung && ohneEinwilligung.length > 0) {
      const ids = ohneEinwilligung.map((a) => a.id);
      await supabase.from("anrufe").update({ recording_url: null }).in("id", ids);
      results.aufzeichnungenGeloescht = ohneEinwilligung.length;
    } else {
      results.aufzeichnungenGeloescht = 0;
    }

    // 3. Anrufe älter als 90 Tage archivieren (anonymisieren)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString();

    const { data: alteAnrufe } = await supabase
      .from("anrufe")
      .select("id, tenant_id, dauer_sekunden, intent, sentiment, is_new_lead, created_at")
      .lt("created_at", cutoffStr)
      .eq("archiviert", false);

    if (alteAnrufe && alteAnrufe.length > 0) {
      // Anonymisierte Einträge ins Archiv schreiben
      const archivEntries = alteAnrufe.map((a) => ({
        tenant_id: a.tenant_id,
        dauer_sekunden: a.dauer_sekunden,
        intent: a.intent,
        sentiment: a.sentiment,
        is_new_lead: a.is_new_lead,
        monat: new Date(a.created_at).toISOString().slice(0, 7), // "2026-03"
      }));

      await supabase.from("anrufe_archiv").insert(archivEntries);

      // Originale anonymisieren und als archiviert markieren
      const ids = alteAnrufe.map((a) => a.id);
      await supabase
        .from("anrufe")
        .update({
          anrufer_name: null,
          anrufer_telefon: null,
          anrufer_email: null,
          transkription: null,
          recording_url: null,
          archiviert: true,
        })
        .in("id", ids);

      results.anrufeArchiviert = alteAnrufe.length;
    } else {
      results.anrufeArchiviert = 0;
    }

    console.log(`[CRON dsgvo-cleanup] ${today} — Bereinigung abgeschlossen:`, results);

    return NextResponse.json({
      success: true,
      date: today,
      ...results,
    });
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      component: "cron-dsgvo-cleanup",
    });
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
