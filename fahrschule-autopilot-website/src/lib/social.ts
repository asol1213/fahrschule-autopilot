/**
 * Shared social media post generation logic.
 * Used by /api/social and /api/blog/cron.
 */

interface SocialPostInput {
  title: string;
  excerpt: string;
  slug: string;
}

interface SocialPosts {
  instagram: string;
  facebook: string;
  linkedin: string;
  gmb: string;
}

export async function generateSocialPosts(input: SocialPostInput): Promise<SocialPosts> {
  const { title, excerpt, slug } = input;
  const url = `https://fahrschulautopilot.de/blog/${slug}`;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return {
      instagram: `\u{1F4DA} ${title}\n\n${excerpt}\n\n\u{1F449} Link in Bio\n\n#Fahrschule #Fuehrerschein #FahrschuleTipps #Autofahren`,
      facebook: `${title}\n\n${excerpt}\n\n\u{1F449} Jetzt lesen: ${url}`,
      linkedin: `${title}\n\n${excerpt}\n\nMehr auf fahrschulautopilot.de\n\n#Fahrschule #Automation #Digitalisierung`,
      gmb: `${title} — ${excerpt.slice(0, 120)}`,
    };
  }

  const prompt = `Erstelle Social-Media-Posts fuer einen Fahrschul-Blog-Artikel.

Titel: "${title}"
Kurzbeschreibung: "${excerpt}"
URL: ${url}

Erstelle Posts fuer Instagram, Facebook, LinkedIn und Google My Business.

Anforderungen:
- Instagram: Max 2200 Zeichen, Emojis, 5-10 Hashtags, "Link in Bio" Hinweis
- Facebook: Max 500 Zeichen, URL einbinden, 2-3 Hashtags
- LinkedIn: Professioneller Ton, 300-600 Zeichen, 3-5 Hashtags
- Google My Business: Max 300 Zeichen, CTA einbauen

Antworte als JSON:
{
  "instagram": "...",
  "facebook": "...",
  "linkedin": "...",
  "gmb": "..."
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
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}
