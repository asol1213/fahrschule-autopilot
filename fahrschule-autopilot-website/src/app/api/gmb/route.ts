import { NextRequest, NextResponse } from "next/server";
import { requireServiceKey, isServiceKeyError, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("gmb", 30, 60_000);

/**
 * Google My Business Posts API
 *
 * POST /api/gmb — GMB Post erstellen oder Bewertungslink generieren
 *
 * Unterstützt:
 * - type: "post" — Erstellt einen GMB-Post-Entwurf
 * - type: "review_link" — Generiert einen direkten Google-Bewertungslink
 * - type: "update" — Erstellt einen Update-Post (Neuigkeiten, Angebote)
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
    const { type, placeId, fahrschulName, stadt, topic } = body;

    if (!type) {
      return NextResponse.json({ error: "type required (post, review_link, update)" }, { status: 400 });
    }

    switch (type) {
      case "review_link": {
        // Generate direct Google review link
        if (!placeId) {
          return NextResponse.json(
            { error: "placeId required. Find it at: https://developers.google.com/maps/documentation/places/web-service/place-id" },
            { status: 400 }
          );
        }
        const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
        return NextResponse.json({
          data: {
            reviewUrl,
            shortMessage: `Herzlichen Glückwunsch zum bestandenen Führerschein! 🎉 Wenn du zufrieden warst, würden wir uns über eine kurze Google-Bewertung freuen: ${reviewUrl}`,
            whatsappMessage: `Herzlichen Glückwunsch zum bestandenen Führerschein! 🎉 Du hast es geschafft! Wenn du zufrieden mit uns warst, würden wir uns riesig über eine kurze Google-Bewertung freuen: ${reviewUrl} Das hilft anderen Fahrschülern bei der Wahl. Gute Fahrt!`,
          },
        });
      }

      case "post":
      case "update": {
        const name = fahrschulName || "Fahrschule";
        const city = stadt || "";
        const anthropicKey = process.env.ANTHROPIC_API_KEY;

        if (!anthropicKey) {
          // Fallback template
          const templates = {
            post: `📢 ${name}${city ? ` in ${city}` : ""} — ${topic || "Neue Angebote für Fahrschüler!"}\n\nJetzt informieren und Termin buchen! ✅\n\n#Fahrschule #Führerschein${city ? ` #${city}` : ""}`,
            update: `🆕 Neuigkeiten von ${name}${city ? ` in ${city}` : ""}!\n\n${topic || "Wir haben spannende Updates für euch."}\n\nMehr auf unserer Website! 👉`,
          };
          return NextResponse.json({
            data: {
              text: templates[type as keyof typeof templates],
              callToAction: "LEARN_MORE",
            },
          });
        }

        const prompt = `Erstelle einen Google My Business Post für eine Fahrschule.

Fahrschule: ${name}
Stadt: ${city || "Deutschland"}
Typ: ${type === "post" ? "Standard-Post" : "Neuigkeiten/Update"}
Thema: ${topic || "Allgemeine Werbung"}

Anforderungen:
- Max 300 Zeichen
- Freundlich und professionell
- CTA einbauen (z.B. "Jetzt Termin buchen", "Mehr erfahren")
- Lokale Keywords für ${city || "die Stadt"} einbauen
- 1-2 passende Emojis

Antworte als JSON:
{
  "text": "...",
  "callToAction": "LEARN_MORE"
}`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 500,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json({ data: JSON.parse(jsonMatch[0]) });
      }

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: post, review_link, update" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("GMB API error:", error);
    return NextResponse.json({ error: "GMB-Post-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
