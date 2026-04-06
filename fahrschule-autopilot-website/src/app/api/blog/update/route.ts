import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { safeCompare, rateLimit, getClientIp } from "@/lib/api-auth";
import * as fs from "fs";
import * as path from "path";

const checkLimit = rateLimit("blog-update", 30, 60_000);

/**
 * POST /api/blog/update — Bestehende Blog-Artikel aktualisieren
 *
 * Wird manuell oder per Cron aufgerufen wenn Gesetzesaenderungen
 * (z.B. Fuehrerscheinreform, neue Pruefungsordnung) Artikel veralten lassen.
 *
 * Modes:
 * - "check": Prueft alle Artikel auf veraltete Inhalte (Keywords, Jahreszahlen)
 * - "update": Aktualisiert einen bestimmten Artikel mit neuen Inhalten
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const apiKey = process.env.ONBOARDING_API_KEY || process.env.CRON_SECRET;
    if (!apiKey || !safeCompare(authHeader, `Bearer ${apiKey}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mode, slug, updates } = body;

    if (mode === "check") {
      return handleCheck();
    }

    if (mode === "update") {
      return handleUpdate(slug, updates);
    }

    return NextResponse.json(
      { error: "mode required: 'check' or 'update'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 });
  }
}

function handleCheck() {
  const posts = getAllPosts();
  const currentYear = new Date().getFullYear().toString();
  const previousYear = (new Date().getFullYear() - 1).toString();

  const outdatedKeywords = [
    "2024",
    "2025",
    "alte Pruefungsordnung",
    "bisherige Regelung",
  ];

  const results = posts.map((post) => {
    const issues: string[] = [];

    // Check for outdated year references
    if (post.content.includes(previousYear) && !post.content.includes(currentYear)) {
      issues.push(`Referenziert ${previousYear} aber nicht ${currentYear}`);
    }

    // Check for outdated keywords
    for (const keyword of outdatedKeywords) {
      if (post.content.toLowerCase().includes(keyword.toLowerCase())) {
        issues.push(`Enthaelt moeglicherweise veralteten Begriff: "${keyword}"`);
      }
    }

    // Check article age
    const publishedDate = new Date(post.publishedAt);
    const ageInDays = Math.floor(
      (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (ageInDays > 180) {
      issues.push(`Artikel ist ${ageInDays} Tage alt — Review empfohlen`);
    }

    // Check if title contains a year that's not current
    const yearMatch = post.title.match(/20\d{2}/);
    if (yearMatch && yearMatch[0] !== currentYear) {
      issues.push(`Titel enthaelt veraltetes Jahr: ${yearMatch[0]}`);
    }

    return {
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt || null,
      ageInDays,
      issues,
      needsUpdate: issues.length > 0,
    };
  });

  const needsUpdate = results.filter((r) => r.needsUpdate);

  return NextResponse.json({
    totalArticles: posts.length,
    articlesNeedingUpdate: needsUpdate.length,
    results,
  });
}

function handleUpdate(slug: string, updates: { content?: string; title?: string; excerpt?: string; seo?: Record<string, unknown> }) {
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const post = getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: `Article '${slug}' not found` }, { status: 404 });
  }

  // Load current posts
  const dataPath = path.join(process.cwd(), "src", "data", "blog-posts.json");

  let posts;
  try {
    posts = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    return NextResponse.json({ error: "Could not read blog data" }, { status: 500 });
  }

  // Find and update the specific post
  const index = posts.findIndex((p: { slug: string }) => p.slug === slug);
  if (index === -1) {
    return NextResponse.json({ error: "Post not found in data" }, { status: 404 });
  }

  if (updates.content) posts[index].content = updates.content;
  if (updates.title) posts[index].title = updates.title;
  if (updates.excerpt) posts[index].excerpt = updates.excerpt;
  if (updates.seo) posts[index].seo = { ...posts[index].seo, ...updates.seo };
  posts[index].updatedAt = new Date().toISOString().split("T")[0];

  // Save
  fs.writeFileSync(dataPath, JSON.stringify(posts, null, 2));

  return NextResponse.json({
    success: true,
    slug,
    updatedAt: posts[index].updatedAt,
    message: `Artikel '${posts[index].title}' aktualisiert`,
  });
}
