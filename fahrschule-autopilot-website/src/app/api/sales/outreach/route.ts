import { NextRequest, NextResponse } from "next/server";
import { requireServiceKey, isServiceKeyError, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("sales-outreach", 30, 60_000);

/**
 * POST /api/sales/outreach
 *
 * Generiert personalisierte Cold-Outreach E-Mails mit Claude API.
 * Auth: Admin API Key
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const keyError = requireServiceKey(req, "ADMIN_API_KEY");
    if (isServiceKeyError(keyError)) return keyError;

    const body = await req.json();
    const { fahrschulName, stadt, inhaber, schuelerZahl, googleBewertung, typ } = body;

    if (!fahrschulName || !stadt) {
      return NextResponse.json({ error: "fahrschulName und stadt required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY nicht konfiguriert" }, { status: 500 });
    }

    const emailTyp = typ || "erstansprache";
    const prompt = buildPrompt(emailTyp, { fahrschulName, stadt, inhaber, schuelerZahl, googleBewertung });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json() as { content: { type: string; text: string }[] };
    const text = data.content?.[0]?.type === "text" ? data.content[0].text : "";

    // Parse die Antwort
    const betreffMatch = text.match(/BETREFF:\s*(.+)/);
    const bodyMatch = text.match(/NACHRICHT:\s*([\s\S]+?)(?=FOLLOW_UP:|$)/);
    const followUpMatch = text.match(/FOLLOW_UP:\s*([\s\S]+?)$/);

    return NextResponse.json({
      betreff: betreffMatch?.[1]?.trim() || "",
      nachricht: bodyMatch?.[1]?.trim() || text,
      followUp: followUpMatch?.[1]?.trim() || "",
      typ: emailTyp,
      fahrschulName,
      stadt,
    });
  } catch (error) {
    console.error("Outreach generation error:", error);
    return NextResponse.json({ error: "Generierung fehlgeschlagen" }, { status: 500 });
  }
}

function buildPrompt(
  typ: string,
  info: { fahrschulName: string; stadt: string; inhaber?: string; schuelerZahl?: number; googleBewertung?: number },
): string {
  const anrede = info.inhaber ? `Herr/Frau ${info.inhaber}` : "Geschäftsführer/in";
  const bewertungInfo = info.googleBewertung
    ? `Die Fahrschule hat ${info.googleBewertung} Sterne auf Google.`
    : "";
  const schuelerInfo = info.schuelerZahl
    ? `Geschätzte Schülerzahl: ${info.schuelerZahl}.`
    : "";

  if (typ === "follow_up_3") {
    return `Du bist ein deutscher B2B-Sales-Experte für Fahrschul-Automatisierung.
Schreibe eine kurze Follow-Up E-Mail (3 Tage nach Erstansprache) an ${info.fahrschulName} in ${info.stadt}.
Anrede: ${anrede}.

Regeln:
- Max 4 Sätze
- Freundlich, nicht aufdringlich
- Referenziere die erste Nachricht
- Biete einen konkreten Calendly-Link an: https://calendly.com/andrewarbohq/30min
- Unterschrift: Andrew (Fahrschule Autopilot)

Format:
BETREFF: ...
NACHRICHT: ...`;
  }

  if (typ === "follow_up_7") {
    return `Du bist ein deutscher B2B-Sales-Experte für Fahrschul-Automatisierung.
Schreibe eine letzte Follow-Up E-Mail (7 Tage nach Erstansprache) an ${info.fahrschulName} in ${info.stadt}.
Anrede: ${anrede}.

Regeln:
- Max 3 Sätze
- "Kein Problem falls kein Interesse" Ton
- Biete einen Mehrwert: kostenloses Audit der Google-Bewertungen
- Unterschrift: Andrew (Fahrschule Autopilot)

Format:
BETREFF: ...
NACHRICHT: ...`;
  }

  // Erstansprache
  return `Du bist ein deutscher B2B-Sales-Experte für Fahrschul-Automatisierung.
Schreibe eine personalisierte Cold-Email an ${info.fahrschulName} in ${info.stadt}.
Anrede: ${anrede}.
${bewertungInfo}
${schuelerInfo}

Produkt: Fahrschule Autopilot — AI-Automation (WhatsApp-Erinnerungen, Google-Bewertungen, Zahlungserinnerungen, AI-Chatbot).
Ergebnis bei anderen Fahrschulen: 35% weniger No-Shows, 15+ neue Bewertungen/Monat, €800-1.500 gespart/Monat.

Regeln:
- Max 6 Sätze, professionell aber persönlich
- Erwähne ein konkretes Problem (No-Shows ODER Bewertungen ODER offene Zahlungen)
- Nenne eine konkrete Zahl/Ergebnis
- CTA: 10-Minuten Demo-Call, kein Verkaufsgespräch
- Calendly: https://calendly.com/andrewarbohq/30min
- Unterschrift: Andrew (Fahrschule Autopilot)
${info.googleBewertung && info.googleBewertung < 4.5 ? "- Fokus auf Google-Bewertungen verbessern" : ""}
${info.googleBewertung && info.googleBewertung >= 4.5 ? "- Lobe die guten Bewertungen, fokus auf No-Shows/Effizienz" : ""}

Format:
BETREFF: ...
NACHRICHT: ...
FOLLOW_UP: (kurzer Satz für 3-Tage Follow-Up)`;
}
