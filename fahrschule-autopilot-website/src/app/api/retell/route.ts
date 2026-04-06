import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api-auth";
import { phoneSearchSuffix } from "@/lib/telefon/phone-utils";
import { createLeadFromCall } from "@/lib/crm/lead-from-call";
import crypto from "crypto";

/**
 * fonio.ai Webhook Handler — Agent 2: Telefon-Assistent
 *
 * Empfängt Events von fonio.ai wenn Anrufe starten, enden oder analysiert werden.
 * Leitet strukturierte Daten an n8n weiter für:
 * - CRM-Einträge (Agent 5)
 * - WhatsApp Follow-Ups (Agent 4)
 * - Analytics (Agent 7)
 *
 * fonio.ai sendet nach jedem Anruf einen POST-Request mit Anrufdaten.
 * Setup: https://app.fonio.ai → Agent → Webhook konfigurieren
 */

// --- Rate Limiter ---

const isRateLimited = rateLimit("fonio-webhook", 100, 60_000);

// --- Types ---

interface FonioCallData {
  call_id?: string;
  agent_id?: string;
  caller_number?: string;
  called_number?: string;
  direction?: "inbound" | "outbound";
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  sentiment?: "positive" | "negative" | "neutral" | "unknown";
  variables?: Record<string, string>;
  status?: "started" | "ended" | "analyzed" | "completed";
  recording_url?: string;
  metadata?: Record<string, string>;
  // fonio extrahierte Variablen
  extracted?: {
    name?: string;
    phone?: string;
    email?: string;
    intent?: string;
    license_class?: string;
    preferred_time?: string;
    urgency?: string;
    recording_consent?: string;
  };
}

// --- Helpers ---

function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function forwardToN8n(payload: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_RETELL_URL;
  if (!webhookUrl) {
    console.warn("[fonio] WEBHOOK_RETELL_URL nicht konfiguriert — Event wird nicht weitergeleitet");
    return;
  }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Source": "fonio-webhook",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) return;

      console.error(`[fonio] n8n Versuch ${attempt}/${maxRetries} fehlgeschlagen: ${response.status} ${response.statusText}`);
    } catch (err) {
      console.error(`[fonio] n8n Versuch ${attempt}/${maxRetries} Fehler:`, err);
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  console.error("[fonio] n8n Webhook endgültig fehlgeschlagen nach 3 Versuchen");
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// --- Process Call Data ---

function processCallData(data: FonioCallData) {
  const extracted = data.extracted || {};
  const intent = extracted.intent || "sonstiges";

  return {
    type: "call_analyzed",
    callId: data.call_id || `fonio_${Date.now()}`,
    agentId: data.agent_id || "",
    callerNumber: data.caller_number || "unbekannt",
    direction: data.direction || "inbound",
    duration: data.duration_seconds || 0,
    durationFormatted: formatDuration(data.duration_seconds),

    // AI-Analyse
    summary: data.summary || "",
    sentiment: data.sentiment || "unknown",

    // Extrahierte Kontaktdaten
    callerName: extracted.name || "",
    callerPhone: extracted.phone || data.caller_number || "",
    callerEmail: extracted.email || "",

    // Intent & Details
    intent,
    licenseClass: extracted.license_class || "",
    preferredTime: extracted.preferred_time || "",
    urgency: extracted.urgency || "mittel",

    // DSGVO
    recordingConsent: extracted.recording_consent || "unbekannt",

    // Vollständige Daten
    transcript: data.transcript || "",
    recordingUrl: data.recording_url || null,
    timestamp: new Date().toISOString(),

    // Flags für n8n Routing
    needsFollowUp: ["anmeldung", "termin", "beschwerde"].includes(intent),
    needsHumanReview: data.sentiment === "negative" || intent === "beschwerde",
    isNewLead: ["anmeldung", "termin", "preisanfrage"].includes(intent),
  };
}

// --- Analytics ---

async function saveToAnalytics(payload: Record<string, unknown>, tenantId: string | null) {
  try {
    if (!tenantId) {
      console.log("[fonio] Kein tenantId gefunden — Analytics-Speicherung übersprungen");
      return;
    }

    const supabase = await createClient();
    await supabase.from("anrufe").insert({
      tenant_id: tenantId,
      call_id: payload.callId,
      anrufer_nummer: payload.callerNumber,
      dauer_sekunden: payload.duration,
      zusammenfassung: payload.summary,
      sentiment: payload.sentiment,
      intent: payload.intent,
      anrufer_name: payload.callerName,
      anrufer_email: payload.callerEmail,
      anrufer_telefon: payload.callerPhone,
      fuehrerscheinklasse: payload.licenseClass,
      is_new_lead: payload.isNewLead,
      needs_follow_up: payload.needsFollowUp,
      recording_url: payload.recordingUrl,
      recording_consent: payload.recordingConsent || "unbekannt",
    });

    console.log(`[fonio] Anruf ${payload.callId} in Analytics gespeichert`);
  } catch (err) {
    console.error("[fonio] Analytics save error:", err);
  }
}

// --- CRM Bridge ---

async function saveToCrmKommunikation(tenantId: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const supabase = await createClient();

    const callerPhone = (payload.callerPhone as string) || (payload.callerNumber as string) || "";
    let schuelerId: string | null = null;

    if (callerPhone) {
      const suffix = phoneSearchSuffix(callerPhone);
      if (suffix) {
        const { data: schueler } = await supabase
          .from("schueler")
          .select("id")
          .eq("tenant_id", tenantId)
          .ilike("telefon", `%${suffix}%`)
          .limit(1)
          .single();
        if (schueler) schuelerId = schueler.id;
      }
    }

    if (!schuelerId) {
      console.log("[fonio→CRM] Kein Schüler mit Telefon gefunden, überspringe kommunikation");
      return;
    }

    await supabase.from("kommunikation").insert({
      tenant_id: tenantId,
      schueler_id: schuelerId,
      kanal: "telefon",
      richtung: "eingehend",
      betreff: `AI-Anruf: ${payload.intent || "allgemein"} (${payload.durationFormatted || "?"})`,
      inhalt: (payload.summary as string) || (payload.transcript as string)?.slice(0, 500) || "Anruf ohne Zusammenfassung",
      datum: (payload.timestamp as string) || new Date().toISOString(),
    });

    console.log(`[fonio→CRM] Anruf für Schüler ${schuelerId} in kommunikation gespeichert`);
  } catch (err) {
    console.error("[fonio→CRM] Fehler:", err);
  }
}

async function createLeadAsSchueler(tenantId: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const result = await createLeadFromCall({
      tenantId,
      callId: payload.callId as string,
      callerName: payload.callerName as string,
      callerPhone: payload.callerPhone as string,
      callerEmail: payload.callerEmail as string,
      licenseClass: payload.licenseClass as string,
      preferredTime: payload.preferredTime as string,
      urgency: payload.urgency as string,
      summary: payload.summary as string,
      intent: payload.intent as string,
      sentiment: payload.sentiment as string,
    });
    console.log(`[fonio→CRM] Lead als Schüler: ${result.message}`);
  } catch (err) {
    console.error("[fonio→CRM] Lead-Erstellung Fehler:", err);
  }
}

// --- Route Handler ---

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 2. Body lesen
    const rawBody = await req.text();

    // 3. Signatur-Verifizierung
    const webhookSecret = process.env.FONIO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[fonio] FONIO_WEBHOOK_SECRET nicht konfiguriert");
      return NextResponse.json({ error: "Server-Konfiguration fehlt: FONIO_WEBHOOK_SECRET" }, { status: 500 });
    }

    const signature = req.headers.get("x-webhook-signature") || req.headers.get("x-fonio-signature") || "";
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 4. Daten parsen
    const data: FonioCallData = JSON.parse(rawBody);

    console.log(`[fonio] Anruf empfangen | Call: ${data.call_id || "?"} | Von: ${data.caller_number || "?"}`);

    // 5. Verarbeiten
    const payload = processCallData(data);

    // 6. Tenant ermitteln
    const tenantId = data.metadata?.tenantId || data.metadata?.tenant_id || data.variables?.tenantId || null;

    // 7. An n8n weiterleiten (non-blocking)
    forwardToN8n(payload).catch((err) =>
      console.error("[fonio] n8n Forward fehlgeschlagen:", err)
    );

    // 8. Analytics speichern (non-blocking)
    saveToAnalytics(payload, tenantId).catch((err) =>
      console.error("[fonio] Analytics save fehlgeschlagen:", err)
    );

    // 9. CRM-Bridge (non-blocking)
    if (tenantId) {
      saveToCrmKommunikation(tenantId, payload).catch((err) =>
        console.error("[fonio] CRM kommunikation save fehlgeschlagen:", err)
      );

      if (payload.isNewLead && payload.intent === "anmeldung") {
        createLeadAsSchueler(tenantId, payload).catch((err) =>
          console.error("[fonio] CRM Lead→Schüler fehlgeschlagen:", err)
        );
      }
    }

    return NextResponse.json({ success: true, callId: payload.callId });
  } catch (error) {
    console.error("[fonio] Webhook Fehler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check + Status
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "fonio-telefon-assistent",
    version: "3.0",
    provider: "fonio.ai",
    webhookConfigured: !!process.env.WEBHOOK_RETELL_URL,
    signatureVerification: !!process.env.FONIO_WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
  });
}
