import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit } from "@/lib/api-auth";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("placeholder")) throw new Error("Stripe nicht konfiguriert");
  return new Stripe(key);
}

const portalLimiter = rateLimit("payments-portal", 5, 60_000);

/**
 * POST /api/payments/portal
 *
 * Erstellt eine Stripe Customer Portal Session.
 * Ermöglicht Schülern, ihre Zahlungshistorie einzusehen.
 * Body: { tenantId, returnUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (portalLimiter(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warten Sie einen Moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tenantId, returnUrl } = body;

    if (!tenantId || !returnUrl) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen: tenantId, returnUrl" },
        { status: 400 }
      );
    }

    const auth = await requireAuth(tenantId);
    if (!isAuthed(auth)) return auth;

    const supabase = await createClient();

    // Benutzer-Profil laden, um Stripe Customer ID zu finden
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 401 }
      );
    }

    // Schüler mit Stripe Customer ID suchen (über Email des Auth-Users)
    const { data: schueler } = await supabase
      .from("schueler")
      .select("id, stripe_customer_id, email, vorname, nachname")
      .eq("tenant_id", tenantId)
      .eq("email", user.user.email)
      .is("deleted_at", null)
      .single();

    if (!schueler) {
      return NextResponse.json(
        { error: "Kein Schüler-Profil gefunden" },
        { status: 404 }
      );
    }

    let stripeCustomerId = schueler.stripe_customer_id;

    // Falls noch kein Stripe Customer existiert, erstellen
    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: schueler.email,
        name: `${schueler.vorname} ${schueler.nachname}`,
        metadata: {
          tenantId,
          schuelerId: schueler.id,
        },
      });
      stripeCustomerId = customer.id;

      await supabase
        .from("schueler")
        .update({ stripe_customer_id: customer.id })
        .eq("id", schueler.id);
    }

    // Stripe Customer Portal Session erstellen
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    console.log(
      `[Stripe Portal] Session erstellt für Schüler ${schueler.id}, Tenant ${tenantId}`
    );

    return NextResponse.json({
      data: {
        portalUrl: portalSession.url,
      },
    });
  } catch (err) {
    console.error("[Stripe Portal] Fehler:", err);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Portal-Session" },
      { status: 500 }
    );
  }
}
