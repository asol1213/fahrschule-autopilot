import { NextRequest, NextResponse } from "next/server";
import { generateSocialPosts } from "@/lib/social";
import { requireServiceKey, isServiceKeyError, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("social", 30, 60_000);

/**
 * POST /api/social — Social Media Post aus Blog-Artikel generieren
 *
 * Generiert Instagram/Facebook/LinkedIn/GMB Teaser-Texte aus einem Blog-Artikel.
 * Nutzt Claude API fuer natuerliche, plattform-optimierte Posts.
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
    const { title, excerpt, slug } = body;

    if (!title || !excerpt) {
      return NextResponse.json({ error: "title and excerpt required" }, { status: 400 });
    }

    const posts = await generateSocialPosts({ title, excerpt, slug: slug || "" });
    return NextResponse.json({ data: posts });
  } catch (error) {
    console.error("Social post generation error:", error);
    return NextResponse.json({ error: "Post-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
