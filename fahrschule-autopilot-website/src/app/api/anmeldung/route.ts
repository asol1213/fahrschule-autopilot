import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/api-auth";

const anmeldungLimiter = rateLimit("anmeldung", 5, 60_000);

const ALLOWED_ORIGINS = [
  "https://fahrschulautopilot.de",
  "https://www.fahrschulautopilot.de",
];

function getCorsOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin") || "";
  if (process.env.NODE_ENV === "development") return "*";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

const REQUIRED_FIELDS = [
  "vorname",
  "nachname",
  "geburtsdatum",
  "email",
  "telefon",
  "plz",
  "ort",
  "fuehrerscheinklasse",
  "dsgvo",
  "kontaktEinwilligung",
];

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (anmeldungLimiter(ip)) {
      return Response.json({ success: false, message: "Zu viele Anfragen. Bitte warten Sie eine Minute." }, { status: 429 });
    }

    const body = await request.json();

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter((field) => {
      const value = body[field];
      if (typeof value === "boolean") return !value;
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missing.length > 0) {
      return Response.json(
        {
          success: false,
          message: "Pflichtfelder fehlen.",
          missingFields: missing,
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return Response.json(
        { success: false, message: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    // Validate PLZ (5 digits)
    if (!/^\d{5}$/.test(body.plz)) {
      return Response.json(
        { success: false, message: "Ungültige Postleitzahl (5 Ziffern)." },
        { status: 400 }
      );
    }

    // Send to n8n webhook if configured
    const webhookUrl = process.env.WEBHOOK_ANMELDUNG_URL;
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...body,
            submittedAt: new Date().toISOString(),
            source: "website-anmeldung",
          }),
        });

        if (!webhookResponse.ok) {
          console.error(
            `Webhook returned ${webhookResponse.status}:`,
            await webhookResponse.text()
          );
        }
      } catch (webhookError) {
        console.error("Webhook delivery failed:", webhookError);
      }
    } else {
      console.log("Neue Anmeldung erhalten (kein Webhook konfiguriert):", {
        name: `${body.vorname} ${body.nachname}`,
        email: body.email,
        klasse: body.fuehrerscheinklasse,
        submittedAt: new Date().toISOString(),
      });
    }

    // Agent 5 CRM-Bridge: Schüler direkt im CRM anlegen
    // Verwendet den internen Webhook-Receiver
    const tenantId = body.tenantId || body.tenant_id;
    if (tenantId) {
      try {
        const baseUrl = request.nextUrl.origin;
        await fetch(`${baseUrl}/api/webhooks/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "anmeldung.neu",
            tenantId,
            data: {
              vorname: body.vorname,
              nachname: body.nachname,
              email: body.email,
              telefon: body.telefon,
              geburtsdatum: body.geburtsdatum,
              fuehrerscheinklasse: body.fuehrerscheinklasse,
              adresse: body.strasse || body.adresse || "",
              plz: body.plz,
              ort: body.ort,
              dsgvo: body.dsgvo,
              kontaktEinwilligung: body.kontaktEinwilligung,
            },
          }),
        });
      } catch (crmError) {
        console.error("[Anmeldung→CRM] Bridge fehlgeschlagen:", crmError);
      }
    }

    const corsOrigin = getCorsOrigin(request);
    return Response.json(
      {
        success: true,
        message:
          "Anmeldung erfolgreich eingegangen. Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch {
    return Response.json(
      {
        success: false,
        message:
          "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsOrigin = getCorsOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
