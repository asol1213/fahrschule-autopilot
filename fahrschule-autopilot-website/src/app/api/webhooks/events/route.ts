import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * POST /api/webhooks/events
 * Receives events from other agents (n8n, Agent 2 Telefon, Agent 4 WhatsApp)
 *
 * Authentication: HMAC-SHA256 signature via X-Webhook-Signature header.
 * Set WEBHOOK_SECRET env var. n8n must sign payloads with the same secret.
 *
 * Supported events:
 * - "anmeldung.neu" → Creates new Schüler + required Dokumente
 * - "anruf.beendet" → Logs communication
 * - "whatsapp.empfangen" → Logs communication
 * - "zahlung.eingang" → Marks payment as bezahlt
 */

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false; // Reject if secret not configured
  try {
    const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Webhook-Signature") ?? "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { type, tenantId, data } = body;

    if (!type || !tenantId) {
      return NextResponse.json({ error: "type and tenantId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Validate tenant exists
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", tenantId)
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ error: "Invalid tenantId" }, { status: 403 });
    }

    switch (type) {
      case "anmeldung.neu": {
        // Agent 4/Website sends new registration → create Schüler
        const { data: schueler, error } = await supabase
          .from("schueler")
          .insert({
            tenant_id: tenantId,
            vorname: data.vorname,
            nachname: data.nachname,
            email: data.email,
            telefon: data.telefon,
            geburtsdatum: data.geburtsdatum,
            fuehrerscheinklasse: data.fuehrerscheinklasse || "B",
            adresse: data.adresse || "",
            plz: data.plz || "",
            ort: data.ort || "",
            dsgvo_einwilligung: data.dsgvo || false,
            dsgvo_einwilligung_datum: data.dsgvo ? new Date().toISOString() : null,
            whatsapp_einwilligung: data.kontaktEinwilligung || false,
            email_einwilligung: data.kontaktEinwilligung || false,
          })
          .select("id")
          .single();

        if (error) {
          return NextResponse.json({ error: "Fehler beim Anlegen", details: error.message }, { status: 500 });
        }

        // Create required documents checklist
        const dokTypen = ["sehtest", "erste_hilfe", "passfoto", "ausweis", "fuehrerschein_antrag"];
        await supabase.from("dokumente").insert(
          dokTypen.map((typ) => ({
            tenant_id: tenantId,
            schueler_id: schueler!.id,
            typ,
            vorhanden: false,
          }))
        );

        return NextResponse.json({
          success: true,
          schuelerId: schueler!.id,
          message: "Schüler angelegt + Dokumente-Checkliste erstellt",
        });
      }

      case "anruf.beendet": {
        // Agent 2 (Telefon) sends call data → log as communication
        await supabase.from("kommunikation").insert({
          tenant_id: tenantId,
          schueler_id: data.schuelerId,
          kanal: "telefon",
          richtung: "eingehend",
          betreff: `Anruf: ${data.dauer || "?"} Sek.`,
          inhalt: data.transkription || data.zusammenfassung || "Anruf ohne Transkription",
          datum: data.datum || new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: "Anruf protokolliert" });
      }

      case "whatsapp.empfangen": {
        // Agent 4 forwards WhatsApp message
        await supabase.from("kommunikation").insert({
          tenant_id: tenantId,
          schueler_id: data.schuelerId,
          kanal: "whatsapp",
          richtung: data.richtung || "eingehend",
          inhalt: data.nachricht || data.inhalt || "",
          datum: data.datum || new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: "WhatsApp protokolliert" });
      }

      case "zahlung.eingang": {
        // Payment received notification
        const { error } = await supabase
          .from("zahlungen")
          .update({
            status: "bezahlt",
            bezahlt_am: new Date().toISOString().split("T")[0],
          })
          .eq("id", data.zahlungId);

        if (error) {
          return NextResponse.json({ error: "Zahlung nicht gefunden" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Zahlung als bezahlt markiert" });
      }

      default:
        return NextResponse.json({ error: `Unknown event type: ${type}` }, { status: 400 });
    }
  } catch (err) {
    console.error("Webhook event error:", err);
    return NextResponse.json({ error: "Fehler beim Verarbeiten" }, { status: 500 });
  }
}
