import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/api-auth";

const newsletterLimiter = rateLimit("newsletter", 3, 60_000);

/**
 * POST /api/newsletter — Newsletter-Anmeldung
 * Speichert E-Mail-Adresse und sendet optional an n8n-Webhook.
 * Rate-limited: 3 req/min per IP
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (newsletterLimiter(ip)) {
      return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
    }
    const contentType = req.headers.get("content-type") || "";
    let email: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body.email;
    } else {
      const formData = await req.formData();
      email = formData.get("email") as string;
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Gültige E-Mail-Adresse erforderlich" }, { status: 400 });
    }

    // Forward to n8n webhook if configured
    const webhookUrl = process.env.NEWSLETTER_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "blog-newsletter",
          subscribedAt: new Date().toISOString(),
        }),
      }).catch(() => {
        // Don't block on webhook failure
      });
    }

    // If form submission (not JSON), redirect back with success
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL("/blog?subscribed=true", req.url));
    }

    return NextResponse.json({ success: true, message: "Erfolgreich angemeldet!" });
  } catch {
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen" }, { status: 500 });
  }
}
