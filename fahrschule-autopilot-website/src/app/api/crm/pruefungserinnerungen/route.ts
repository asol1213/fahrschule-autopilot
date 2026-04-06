import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeCompare } from "@/lib/api-auth";

// GET /api/crm/pruefungserinnerungen
// Vercel Cron Job — alle 15 Minuten.
// Prüft anstehende Prüfungen (nächste 24h) und sendet Erinnerungen via n8n Webhook.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expectedKey = process.env.CRON_SECRET;
  if (!expectedKey || !safeCompare(authHeader, `Bearer ${expectedKey}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Alle geplanten Prüfungen in den nächsten 24h laden
  const { data: pruefungen, error: pruefungenError } = await supabase
    .from("pruefungen")
    .select("id, tenant_id, schueler_id, typ, datum, uhrzeit, status, schueler:schueler_id(id, vorname, nachname, telefon, wa_opt_out)")
    .eq("status", "geplant")
    .gte("datum", now.toISOString().split("T")[0])
    .lte("datum", in24h.toISOString().split("T")[0]);

  if (pruefungenError) {
    return NextResponse.json({ error: "Fehler beim Laden der Prüfungen", details: pruefungenError.message }, { status: 500 });
  }

  if (!pruefungen || pruefungen.length === 0) {
    return NextResponse.json({ message: "Keine anstehenden Prüfungen", sent: 0 });
  }

  // Bereits gesendete Erinnerungen laden
  const { data: sentLog } = await supabase
    .from("automation_log")
    .select("telefon, datum, uhrzeit, typ")
    .in("typ", ["pruefung_erinnerung_24h", "pruefung_erinnerung_2h"]);

  const gesendet = new Set<string>();
  for (const entry of sentLog || []) {
    gesendet.add(`${entry.telefon}_${entry.datum}_${entry.uhrzeit}_${entry.typ}`);
  }

  let sent = 0;
  const errors: Array<{ pruefungId: string; error: string }> = [];

  for (const pruefung of pruefungen) {
    const schueler = pruefung.schueler as unknown as {
      id: string;
      vorname: string;
      nachname: string;
      telefon: string;
      wa_opt_out: boolean;
    } | null;

    if (!schueler || !schueler.telefon || schueler.wa_opt_out) continue;

    let telefon = schueler.telefon.replace(/[\s\-\/\(\)]/g, "");
    if (!telefon.startsWith("+")) {
      telefon = "+49" + telefon.replace(/^0/, "");
    }

    const datum = pruefung.datum as string;
    const zeit = (pruefung.uhrzeit as string) || "09:00";

    // Prüfungszeitpunkt berechnen
    let pruefungDatum: Date;
    try {
      pruefungDatum = new Date(`${datum}T${zeit}:00`);
    } catch {
      continue;
    }
    if (isNaN(pruefungDatum.getTime())) continue;

    const stundenBis = (pruefungDatum.getTime() - now.getTime()) / (1000 * 60 * 60);

    let logTyp: string | null = null;
    if (stundenBis >= 23 && stundenBis <= 25) {
      logTyp = "pruefung_erinnerung_24h";
    } else if (stundenBis >= 1.5 && stundenBis <= 2.5) {
      logTyp = "pruefung_erinnerung_2h";
    }

    if (!logTyp) continue;

    const key = `${telefon}_${datum}_${zeit}_${logTyp}`;
    if (gesendet.has(key)) continue;

    // An n8n Webhook senden
    const webhookUrl = process.env.WEBHOOK_PRUEFUNGSERINNERUNG_URL;
    if (!webhookUrl) {
      errors.push({ pruefungId: pruefung.id as string, error: "WEBHOOK_PRUEFUNGSERINNERUNG_URL nicht konfiguriert" });
      continue;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schuelerName: `${schueler.vorname} ${schueler.nachname}`,
          schuelerTelefon: telefon,
          schuelerId: schueler.id,
          pruefungId: pruefung.id,
          pruefungsTyp: pruefung.typ,
          tenantId: pruefung.tenant_id,
          terminDatum: datum,
          terminZeit: zeit,
          erinnerungsTyp: logTyp.includes("24h") ? "24h" : "2h",
          logTyp,
        }),
      });

      if (res.ok) {
        sent++;
        gesendet.add(key);
      } else {
        errors.push({ pruefungId: pruefung.id as string, error: `Webhook returned ${res.status}` });
      }
    } catch (err) {
      errors.push({ pruefungId: pruefung.id as string, error: String(err) });
    }
  }

  return NextResponse.json({
    message: `Prüfungserinnerungen: ${sent} gesendet`,
    total: pruefungen.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
