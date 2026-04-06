import { createHmac } from "crypto";

/**
 * Event-System für Agent-Kommunikation
 *
 * Sendet Events an n8n Webhooks, damit andere Agents reagieren können.
 * z.B. "Fahrstunde abgeschlossen" → Agent 4 sendet Feedback-WhatsApp
 *      "Prüfung bestanden" → Agent 4 sendet Glückwünsche + Bewertungsanfrage
 *      "Zahlung überfällig" → Agent 4 sendet Mahnung
 *
 * Outbound payloads are signed with HMAC-SHA256 (WEBHOOK_SECRET)
 * so the receiving side can verify authenticity.
 */

export type EventType =
  | "fahrstunde.abgeschlossen"
  | "fahrstunde.geplant"
  | "fahrstunde.abgesagt"
  | "fahrstunde.no_show"
  | "pruefung.bestanden"
  | "pruefung.nicht_bestanden"
  | "pruefung.geplant"
  | "zahlung.erstellt"
  | "zahlung.ueberfaellig"
  | "zahlung.bezahlt"
  | "zahlung.fehlgeschlagen"
  | "zahlung.mahnung"
  | "schueler.angemeldet"
  | "schueler.status_geaendert"
  | "schueler.bestanden"
  | "schueler.dsgvo_loeschung"
  | "dokument.fehlend"
  | "dokument.ablauf_bald";

interface EventPayload {
  type: EventType;
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const N8N_WEBHOOK_URL = process.env.N8N_EVENTS_WEBHOOK_URL;

/**
 * Emit an event to n8n for processing by other agents.
 * Fire-and-forget — doesn't block the calling function.
 */
export async function emitEvent(
  type: EventType,
  tenantId: string,
  data: Record<string, unknown>
): Promise<void> {
  const payload: EventPayload = {
    type,
    tenantId,
    data,
    timestamp: new Date().toISOString(),
  };

  // Log event for debugging (dev only — Vercel logs are streamed via other means)
  if (process.env.NODE_ENV === "development") {
    console.log(`[EVENT] ${type}`, JSON.stringify({ tenantId, ...data }));
  }

  // Send to n8n webhook if configured (signed with HMAC-SHA256)
  if (N8N_WEBHOOK_URL) {
    try {
      const bodyStr = JSON.stringify(payload);
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = `sha256=${createHmac("sha256", webhookSecret).update(bodyStr).digest("hex")}`;
        headers["X-Webhook-Signature"] = signature;
      }

      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: bodyStr,
      });
    } catch (err) {
      console.error(`[EVENT] Failed to send ${type} to n8n:`, err);
    }
  }

  // Also store in kommunikation table for audit trail
  // (handled by caller if needed)
}

/**
 * Preise für automatische Rechnungserstellung
 */
export const DEFAULT_PREISE: Record<string, number> = {
  normal: 55,
  sonderfahrt_ueberlandfahrt: 65,
  sonderfahrt_autobahnfahrt: 65,
  sonderfahrt_nachtfahrt: 65,
  pruefungsvorbereitung: 70,
};

export const FAHRSTUNDEN_LABELS: Record<string, string> = {
  normal: "Fahrstunde (normal)",
  sonderfahrt_ueberlandfahrt: "Sonderfahrt Überland",
  sonderfahrt_autobahnfahrt: "Sonderfahrt Autobahn",
  sonderfahrt_nachtfahrt: "Sonderfahrt Nacht",
  pruefungsvorbereitung: "Prüfungsvorbereitung",
};
