import { NextRequest, NextResponse } from "next/server";
import { captureError } from "@/lib/monitoring";

/* ------------------------------------------------------------------ */
/*  Rate limiter (per IP, 20 requests per minute)                      */
/* ------------------------------------------------------------------ */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Cleanup expired
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function sanitize(input: unknown, maxLen = 500): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLen).trim();
}

/* ------------------------------------------------------------------ */
/*  System Prompt für den Fahrschul-Chatbot                            */
/* ------------------------------------------------------------------ */
const CHATBOT_SYSTEM_PROMPT = `Du bist der Autopilot-Assistent auf der Website von Fahrschule Autopilot (fahrschulautopilot.de). Du hilfst potenziellen Kunden (Fahrschul-Inhabern), die sich für den Service interessieren.

Über Fahrschule Autopilot:
- AI-Automationsservice speziell für deutsche Fahrschulen
- Spart Fahrschulen 10-40 Stunden pro Monat
- Keine Einrichtungsgebühr, monatlich kündbar, 30-Tage Geld-zurück-Garantie
- Funktioniert MIT bestehender Software (AUTOVIO, Fahrschulcockpit, ClickClickDrive, Excel)
- DSGVO-konform, alle Daten auf europäischen Servern
- Gründer: Andrew Arbo

3 Pakete:
- Starter (€99/Mo): Termin-Erinnerungen (WhatsApp 24h+2h vorher), Google-Bewertungen automatisch, Basis-Reporting
- Pro (€249/Mo): Alles aus Starter + Zahlungserinnerungen, AI-Chatbot, Schüler-Onboarding, Empfehlungssystem, Online-Anmeldung
- Premium (€499/Mo): Alles aus Pro + Professionelle Website mit SEO, CRM & Datenbank, Blog-Erstellung, Digitale Verträge, DATEV/lexoffice Export

ROI-Beispiele:
- Kleine Fahrschule (1 Fahrlehrer): ~€600/Mo gespart bei €99 Kosten = 6x ROI
- Mittlere Fahrschule (3 Fahrlehrer): ~€1.600/Mo gespart bei €249 Kosten = 6.5x ROI
- Große Fahrschule (5+ Fahrlehrer): ~€3.200/Mo gespart bei €499 Kosten = 6.4x ROI

Setup: Unter 24 Stunden. Wir richten alles ein.

Regeln:
- Antworte immer in der Sprache, in der der Schüler schreibt. Du sprichst fließend Deutsch, Türkisch, Arabisch, Russisch und Englisch.
- Standardmäßig Deutsch (formelles Sie), aber wechsle die Sprache, wenn der Nutzer in einer anderen Sprache schreibt.
- Sei freundlich, professionell, direkt — kein Geschwätz
- Halte Antworten kurz (2-4 Sätze), außer es wird nach Details gefragt
- Ziel ist IMMER eine Demo-Buchung: Calendly-Link https://calendly.com/andrewarbohq/30min
- Oder WhatsApp-Kontakt: https://wa.me/491714774026
- Beantworte NUR Fragen zum Service. Bei Fragen außerhalb des Themas höflich ablenken.
- Nutze keine Emojis außer ✓ für Listenpunkte
- Wenn jemand nach Preisen fragt, erwähne den ROI
- Bei Bedenken: 30-Tage Geld-zurück-Garantie erwähnen`;

/* ------------------------------------------------------------------ */
/*  POST /api/chatbot                                                  */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { response: "Zu viele Anfragen. Bitte warten Sie einen Moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const message = sanitize(body.message, 1000);
    if (!message) {
      return NextResponse.json({ error: "Nachricht fehlt" }, { status: 400 });
    }

    const chatHistory = Array.isArray(body.chatHistory)
      ? body.chatHistory.slice(-10).map((msg: { role?: string; content?: string }) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: sanitize(msg.content, 500),
        }))
      : [];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { response: "Der Chatbot ist gerade nicht verfügbar. Schreiben Sie uns auf WhatsApp: +49 171 477 4026" },
        { status: 503 }
      );
    }

    // Build messages
    const messages: { role: string; content: string }[] = [
      ...chatHistory,
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: CHATBOT_SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      console.error(`Chatbot API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.content?.[0]?.text || "Entschuldigung, ich konnte keine Antwort generieren. Kontaktieren Sie uns direkt auf WhatsApp.";

    return NextResponse.json({ response: botResponse });
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      component: "chatbot",
    });
    return NextResponse.json(
      { response: "Der Chatbot ist gerade nicht verfügbar. Schreiben Sie uns auf WhatsApp: +49 171 477 4026" },
      { status: 500 }
    );
  }
}
