import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/api-auth";
import { addPost, getAllPosts, type BlogCategory } from "@/lib/blog";

/**
 * GET/POST /api/blog/cron — Automatische Blog-Artikel-Generierung
 *
 * GET: Wird per Vercel Cron-Job aufgerufen (Montag 9:00 UTC).
 * POST: Wird per n8n oder manuell aufgerufen.
 * Wählt automatisch ein Thema basierend auf Saison/Lücken und generiert einen Artikel.
 */

const TOPIC_POOL: Array<{ topic: string; category: BlogCategory; keywords: string[] }> = [
  { topic: "Praktische Prüfung: Die häufigsten Fehler und wie du sie vermeidest", category: "pruefungstipps", keywords: ["Praktische Prüfung Fehler", "Fahrprüfung Tipps"] },
  { topic: "Sonderfahrten erklärt: Autobahn, Überland und Nachtfahrt", category: "verkehrsregeln", keywords: ["Sonderfahrten", "Pflichtfahrstunden"] },
  { topic: "Führerschein mit 17: Begleitetes Fahren (BF17) erklärt", category: "erste-fahrstunde", keywords: ["BF17", "Begleitetes Fahren", "Führerschein ab 17"] },
  { topic: "Fahren im Winter: Tipps für Fahranfänger bei Schnee und Eis", category: "saisonales", keywords: ["Winter Fahren", "Fahranfänger Winter"] },
  { topic: "Bremsweg berechnen: Formeln und Faustregeln für die Prüfung", category: "technik", keywords: ["Bremsweg Formel", "Anhalteweg berechnen"] },
  { topic: "Alkohol am Steuer: Promillegrenzen und Konsequenzen", category: "sicherheit", keywords: ["Promillegrenze", "Alkohol Führerschein"] },
  { topic: "Automatik oder Schaltwagen: Was lohnt sich 2026?", category: "kosten", keywords: ["Automatik Führerschein", "Schaltwagen vs Automatik"] },
  { topic: "Probezeit nach dem Führerschein: Was du wissen musst", category: "verkehrsregeln", keywords: ["Probezeit Führerschein", "Aufbauseminar"] },
  { topic: "Intensivkurs Führerschein: Vorteile, Nachteile, Kosten", category: "kosten", keywords: ["Intensivkurs Führerschein", "Führerschein Schnellkurs"] },
  { topic: "Verkehrszeichen lernen: Die wichtigsten Schilder im Überblick", category: "verkehrsregeln", keywords: ["Verkehrszeichen lernen", "Verkehrsschilder"] },
  { topic: "Fahren bei Regen und Aquaplaning: So bleibst du sicher", category: "sicherheit", keywords: ["Aquaplaning", "Fahren bei Regen"] },
  { topic: "Motorrad-Führerschein Klasse A: Kosten, Dauer und Ablauf", category: "kosten", keywords: ["Motorrad Führerschein", "Klasse A Kosten"] },
];

async function generateBlogArticle() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return { error: "ANTHROPIC_API_KEY not configured", status: 503 };
  }

  const existingSlugs = getAllPosts().map((p) => p.slug);
  const availableTopics = TOPIC_POOL.filter((t) => {
    const slug = t.topic.toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return !existingSlugs.some((s) => s.includes(slug.slice(0, 20)));
  });

  if (availableTopics.length === 0) {
    return { message: "Alle Topics bereits geschrieben", status: 200 };
  }

  const chosen = availableTopics[Math.floor(Math.random() * availableTopics.length)];

  const prompt = `Schreibe einen SEO-optimierten Blog-Artikel für eine deutsche Fahrschule.

Thema: "${chosen.topic}"
Ziel-Keywords: ${chosen.keywords.join(", ")}

Anforderungen:
- 800-1.200 Wörter
- Einfache, verständliche Sprache (Zielgruppe: Fahrschüler 17-25 Jahre)
- Markdown-Formatierung mit H2 und H3
- Praktische Tipps und konkrete Zahlen
- SEO: Keywords im Titel, in H2s und natürlich im Text
- Fazit am Ende
- Ton: Freundlich, professionell, hilfreich
- Interne Verlinkung: Erwähne die Online-Anmeldung und die Features-Seite wo passend

Antworte als JSON:
{
  "title": "...",
  "excerpt": "... (max 160 Zeichen)",
  "content": "... (Markdown)",
  "tags": ["...", "..."],
  "seo": {
    "title": "... (max 60 Zeichen)",
    "description": "... (max 160 Zeichen)",
    "keywords": ["...", "...", "..."]
  }
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
      max_tokens: 4000,
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
    return { error: "Failed to parse AI response", status: 500 };
  }

  const article = JSON.parse(jsonMatch[0]);
  const slug = article.title
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const post = {
    id: `cron-${Date.now()}`,
    slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: chosen.category,
    tags: article.tags || chosen.keywords,
    author: "Fahrschule Autopilot",
    publishedAt: new Date().toISOString().split("T")[0],
    readingTime: Math.ceil(article.content.split(/\s+/).length / 200),
    seo: article.seo,
  };

  addPost(post);

  // Auto-generate social media posts for the new article
  let socialPosts = null;
  try {
    const { generateSocialPosts } = await import("@/lib/social");
    socialPosts = await generateSocialPosts({ title: post.title, excerpt: post.excerpt, slug: post.slug });
  } catch {
    // Social post generation is optional
  }

  return {
    success: true,
    article: { slug: post.slug, title: post.title, category: post.category },
    socialPosts,
    remainingTopics: availableTopics.length - 1,
    status: 201,
  };
}

/** GET — Vercel Cron Job trigger (Montag 9:00 UTC) */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
    if (!process.env.CRON_SECRET || !safeCompare(authHeader, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateBlogArticle();
    const status = result.status || 200;
    const { status: _status, ...body } = result;
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("Blog cron error:", error);
    return NextResponse.json({ error: "Artikel-Generierung fehlgeschlagen" }, { status: 500 });
  }
}

/** POST — n8n / manueller Aufruf */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
    if (!process.env.CRON_SECRET || !safeCompare(authHeader, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateBlogArticle();
    const status = result.status || 200;
    const { status: _status, ...body } = result;
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("Blog cron error:", error);
    return NextResponse.json({ error: "Artikel-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
