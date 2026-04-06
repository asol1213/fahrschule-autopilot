import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, getPostsByCategory, addPost, type BlogCategory } from "@/lib/blog";
import { safeCompare, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("blog", 30, 60_000);

/**
 * GET /api/blog?category=xxx
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const category = req.nextUrl.searchParams.get("category") as BlogCategory | null;

  const posts = category ? getPostsByCategory(category) : getAllPosts();

  return NextResponse.json({
    data: posts.map(({ content: _content, ...rest }) => rest), // Ohne Content für Liste
    total: posts.length,
  });
}

/**
 * POST /api/blog — KI-Artikel generieren
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const apiKey = process.env.ONBOARDING_API_KEY;
    if (!apiKey || !safeCompare(authHeader, `Bearer ${apiKey}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { topic, category, stadt } = body;

    if (!topic) {
      return NextResponse.json({ error: "topic required" }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    // Generate article with Claude
    const prompt = `Schreibe einen SEO-optimierten Blog-Artikel für eine deutsche Fahrschule zum Thema: "${topic}"

${stadt ? `Lokaler Fokus: ${stadt}` : ""}

Anforderungen:
- 800-1.200 Wörter
- Einfache, verständliche Sprache
- Markdown-Formatierung mit H2 und H3
- Praktische Tipps und konkrete Zahlen
- SEO: Keyword im Titel, in H2s und natürlich im Text
- Fazit am Ende
- Tone: Freundlich, professionell, hilfreich

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
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const article = JSON.parse(jsonMatch[0]);
    const slug = article.title
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const post = {
      id: `ai-${Date.now()}`,
      slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: (category as BlogCategory) || "pruefungstipps",
      tags: article.tags || [],
      author: "Fahrschule Autopilot",
      publishedAt: new Date().toISOString().split("T")[0],
      readingTime: Math.ceil(article.content.split(/\s+/).length / 200),
      seo: article.seo,
    };

    addPost(post);

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error("Blog generation error:", error);
    return NextResponse.json({ error: "Artikel-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
