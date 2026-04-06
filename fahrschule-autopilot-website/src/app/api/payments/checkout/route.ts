import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit } from "@/lib/api-auth";
import Stripe from "stripe";
import { apiError, serverError } from "@/lib/api-errors";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("placeholder")) throw new Error("Stripe nicht konfiguriert");
  return new Stripe(key);
}

const checkoutLimiter = rateLimit("payments-checkout", 10, 60_000);

/**
 * POST /api/payments/checkout
 *
 * Erstellt eine Stripe Checkout Session für eine Zahlung.
 * Body: { zahlungId, tenantId, successUrl, cancelUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (checkoutLimiter(ip)) {
      return apiError("RATE_LIMITED", "Zu viele Anfragen. Bitte warten Sie einen Moment.");
    }

    const body = await req.json();
    const { zahlungId, tenantId, successUrl, cancelUrl } = body;

    if (!zahlungId || !tenantId || !successUrl || !cancelUrl) {
      return apiError("VALIDATION_ERROR", "Pflichtfelder fehlen: zahlungId, tenantId, successUrl, cancelUrl");
    }

    const auth = await requireAuth(tenantId);
    if (!isAuthed(auth)) return auth;

    const supabase = await createClient();

    // Zahlung aus Supabase laden
    const { data: zahlung, error: zahlungError } = await supabase
      .from("zahlungen")
      .select("id, betrag, beschreibung, status, schueler_id, stripe_session_id")
      .eq("id", zahlungId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (zahlungError || !zahlung) {
      console.error("[Stripe Checkout] Zahlung nicht gefunden:", zahlungId);
      return apiError("NOT_FOUND", "Zahlung nicht gefunden");
    }

    if (zahlung.status === "bezahlt") {
      return apiError("VALIDATION_ERROR", "Zahlung wurde bereits bezahlt");
    }

    if (zahlung.status === "storniert") {
      return apiError("VALIDATION_ERROR", "Zahlung wurde storniert");
    }

    // Schüler-Daten für Stripe Customer laden
    const { data: schueler } = await supabase
      .from("schueler")
      .select("id, vorname, nachname, email, stripe_customer_id")
      .eq("id", zahlung.schueler_id)
      .eq("tenant_id", tenantId)
      .single();

    // Stripe Customer erstellen oder bestehenden verwenden
    let stripeCustomerId = schueler?.stripe_customer_id;

    if (!stripeCustomerId && schueler) {
      const customer = await getStripe().customers.create({
        email: schueler.email,
        name: `${schueler.vorname} ${schueler.nachname}`,
        metadata: {
          tenantId,
          schuelerId: schueler.id,
        },
      });
      stripeCustomerId = customer.id;

      // Stripe Customer ID beim Schüler speichern
      await supabase
        .from("schueler")
        .update({ stripe_customer_id: customer.id })
        .eq("id", schueler.id);
    }

    // Stripe Checkout Session erstellen
    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId || undefined,
      payment_method_types: ["card", "sepa_debit"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: zahlung.beschreibung,
              metadata: {
                zahlungId: zahlung.id,
                tenantId,
              },
            },
            unit_amount: Math.round(zahlung.betrag * 100), // Cent
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        zahlungId: zahlung.id,
        tenantId,
        schuelerId: zahlung.schueler_id,
      },
    });

    // Stripe Session ID in Zahlung speichern
    await supabase
      .from("zahlungen")
      .update({ stripe_session_id: session.id })
      .eq("id", zahlungId);

    console.log(`[Stripe Checkout] Session erstellt für Zahlung ${zahlungId}: ${session.id}`);

    return NextResponse.json({
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    });
  } catch (err) {
    return serverError(err, { component: "payments-checkout", action: "create-session" });
  }
}
