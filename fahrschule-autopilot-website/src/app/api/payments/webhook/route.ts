import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emitEvent } from "@/lib/events/emit";
import Stripe from "stripe";
import { serverError } from "@/lib/api-errors";
import { captureError } from "@/lib/monitoring";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("placeholder")) throw new Error("Stripe nicht konfiguriert");
  return new Stripe(key);
}

/**
 * POST /api/payments/webhook
 *
 * Stripe Webhook Endpoint.
 * Keine Auth — Stripe ruft diesen Endpoint direkt auf.
 * Validierung über Stripe-Signatur (STRIPE_WEBHOOK_SECRET).
 *
 * Unterstützte Events:
 * - checkout.session.completed → Zahlung als "bezahlt" markieren
 */
export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[Stripe Webhook] Keine Stripe-Signatur im Header");
      return NextResponse.json(
        { error: "Stripe-Signatur fehlt" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET nicht konfiguriert");
      return NextResponse.json(
        { error: "Webhook-Secret nicht konfiguriert" },
        { status: 500 }
      );
    }

    // Stripe-Signatur verifizieren
    try {
      event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("[Stripe Webhook] Signatur-Validierung fehlgeschlagen:", err);
      return NextResponse.json(
        { error: "Ungültige Stripe-Signatur" },
        { status: 401 }
      );
    }
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      component: "payments-webhook",
      action: "parse-request",
    });
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten" },
      { status: 400 }
    );
  }

  // Event verarbeiten
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const zahlungId = session.metadata?.zahlungId;
        const tenantId = session.metadata?.tenantId;
        const schuelerId = session.metadata?.schuelerId;

        if (!zahlungId || !tenantId) {
          console.error("[Stripe Webhook] Metadata fehlt in Session:", session.id);
          return NextResponse.json(
            { error: "Metadata fehlt (zahlungId, tenantId)" },
            { status: 400 }
          );
        }

        console.log(
          `[Stripe Webhook] checkout.session.completed — Zahlung ${zahlungId}, Tenant ${tenantId}`
        );

        const supabase = await createClient();

        // Betrag-Verifikation: Stripe-Betrag mit DB-Betrag vergleichen
        const { data: zahlung, error: fetchError } = await supabase
          .from("zahlungen")
          .select("id, betrag")
          .eq("id", zahlungId)
          .eq("tenant_id", tenantId)
          .maybeSingle();

        if (fetchError) {
          console.error("[Stripe Webhook] Fehler beim Laden der Zahlung:", fetchError);
        }

        if (zahlung && session.amount_total != null) {
          const expectedCents = Math.round(zahlung.betrag * 100);
          const actualCents = session.amount_total;
          if (expectedCents !== actualCents) {
            console.warn(
              `[Stripe Webhook] BETRAG-ABWEICHUNG — Zahlung ${zahlungId}: ` +
              `DB erwartet ${expectedCents} Cent (€${zahlung.betrag}), ` +
              `Stripe liefert ${actualCents} Cent (€${(actualCents / 100).toFixed(2)})`
            );
          } else {
            console.log(
              `[Stripe Webhook] Betrag verifiziert: ${actualCents} Cent für Zahlung ${zahlungId}`
            );
          }
        }

        // Idempotenz: Nur aktualisieren wenn Zahlung noch nicht bezahlt ist
        const bezahltAm = new Date().toISOString().split("T")[0];
        const { data: updated, error: updateError } = await supabase
          .from("zahlungen")
          .update({
            status: "bezahlt",
            bezahlt_am: bezahltAm,
            stripe_session_id: session.id,
          })
          .eq("id", zahlungId)
          .eq("tenant_id", tenantId)
          .neq("status", "bezahlt")
          .select("id, betrag")
          .maybeSingle();

        if (updateError) {
          console.error("[Stripe Webhook] Fehler beim Aktualisieren der Zahlung:", updateError);
          return NextResponse.json(
            { error: "Fehler beim Aktualisieren der Zahlung" },
            { status: 500 }
          );
        }

        // Bereits bezahlt — idempotent success
        if (!updated) {
          console.log(`[Stripe Webhook] Zahlung ${zahlungId} war bereits bezahlt (idempotent)`);
          break;
        }

        // Event für n8n emittieren
        emitEvent("zahlung.bezahlt", tenantId, {
          zahlungId,
          schuelerId: schuelerId || undefined,
          betrag: updated.betrag,
          stripeSessionId: session.id,
          bezahltAm,
        });

        console.log(`[Stripe Webhook] Zahlung ${zahlungId} als bezahlt markiert`);
        break;
      }

      case "charge.failed":
      case "payment_intent.payment_failed": {
        const obj = event.data.object as { metadata?: { zahlungId?: string; tenantId?: string } };
        const zahlungId = obj.metadata?.zahlungId;
        const tenantId = obj.metadata?.tenantId;

        if (zahlungId && tenantId) {
          const supabase = await createClient();
          await supabase
            .from("zahlungen")
            .update({ status: "fehlgeschlagen" })
            .eq("id", zahlungId)
            .eq("tenant_id", tenantId)
            .neq("status", "bezahlt");

          emitEvent("zahlung.fehlgeschlagen", tenantId, { zahlungId });
          console.log(`[Stripe Webhook] Zahlung ${zahlungId} fehlgeschlagen`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unbehandeltes Event: ${event.type}`);
    }

    return NextResponse.json({ data: { received: true } });
  } catch (err) {
    return serverError(err, { component: "payments-webhook", action: "process-event" });
  }
}
