import { NextRequest, NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";
import { safeCompare } from "@/lib/api-auth";

/**
 * POST /api/newsletter/generate — Monatlichen Newsletter-Draft generieren
 *
 * Erstellt einen Newsletter aus den neuesten Blog-Artikeln.
 * Nutzt Claude API fuer natuerliche Zusammenfassungen.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const apiKey = process.env.ONBOARDING_API_KEY || process.env.CRON_SECRET;
    if (!apiKey || !safeCompare(authHeader, `Bearer ${apiKey}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = getAllPosts().slice(0, 5);

    if (posts.length === 0) {
      return NextResponse.json({ error: "Keine Blog-Artikel vorhanden" }, { status: 404 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Fallback without AI
    if (!anthropicKey) {
      const sections = posts.map((p) => ({
        title: p.title,
        summary: p.excerpt,
        url: `https://fahrschulautopilot.de/blog/${p.slug}`,
        category: p.category,
      }));

      const currentMonth = new Date().toLocaleString("de-DE", { month: "long", year: "numeric" });

      return NextResponse.json({
        data: {
          subject: `Fahrschule Autopilot Newsletter — ${currentMonth}`,
          preheader: `${posts.length} neue Artikel für Fahrschul-Inhaber`,
          intro: `Hier sind die neuesten Artikel und Tipps für Ihre Fahrschule. Lesen Sie rein und bleiben Sie auf dem Laufenden.`,
          sections,
          callToAction: {
            text: "Kostenlose Demo buchen",
            url: "https://calendly.com/andrewarbohq/30min",
          },
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // AI-powered newsletter generation
    const articleList = posts
      .map((p) => `- "${p.title}" (${p.category}): ${p.excerpt}`)
      .join("\n");

    const prompt = `Erstelle einen monatlichen Newsletter fuer Fahrschul-Inhaber basierend auf diesen Blog-Artikeln:

${articleList}

Anforderungen:
- Betreff: Kurz, klickwuerdig, max 60 Zeichen
- Preheader: Max 100 Zeichen, ergaenzt den Betreff
- Intro: 2-3 Saetze, persoenlich und freundlich
- Pro Artikel: Eine kurze Zusammenfassung (2 Saetze) mit Mehrwert fuer Fahrschul-Inhaber
- Abschluss mit CTA zur Demo

Antworte als JSON:
{
  "subject": "...",
  "preheader": "...",
  "intro": "...",
  "sections": [
    { "title": "...", "summary": "...", "category": "..." }
  ],
  "outro": "..."
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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const newsletter = JSON.parse(jsonMatch[0]);

    // Enrich sections with URLs
    const sections = (newsletter.sections || []).map(
      (s: { title: string; summary: string; category: string }, i: number) => ({
        ...s,
        url: posts[i] ? `https://fahrschulautopilot.de/blog/${posts[i].slug}` : undefined,
      })
    );

    return NextResponse.json({
      data: {
        subject: newsletter.subject,
        preheader: newsletter.preheader,
        intro: newsletter.intro,
        sections,
        outro: newsletter.outro,
        callToAction: {
          text: "Kostenlose Demo buchen",
          url: "https://calendly.com/andrewarbohq/30min",
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Newsletter generation error:", error);
    return NextResponse.json({ error: "Newsletter-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
