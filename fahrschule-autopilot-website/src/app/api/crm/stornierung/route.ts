import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emitEvent } from "@/lib/events/emit";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { apiError, serverError } from "@/lib/api-errors";

const checkLimit = rateLimit("crm-stornierung", 60, 60_000);

/**
 * POST /api/crm/stornierung
 * Cancel a driving lesson with 24h rule enforcement
 * Body: { fahrstundeId }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    if (!body.fahrstundeId) {
      return apiError("VALIDATION_ERROR", "fahrstundeId required");
    }

    // Auth first — determine tenant before any DB access
    const auth = await requireAuth();
    if (!isAuthed(auth)) return auth;

    const supabase = await createClient();

    // Load lesson with tenant_id pre-filter to prevent cross-tenant access
    const { data: fahrstunde } = await supabase
      .from("fahrstunden")
      .select("id, datum, uhrzeit, status, schueler_id, tenant_id, fahrlehrer_id")
      .eq("id", body.fahrstundeId)
      .eq("tenant_id", auth.tenantId)
      .single();

    if (!fahrstunde) {
      return apiError("NOT_FOUND", "Fahrstunde nicht gefunden");
    }

    if (fahrstunde.status !== "geplant") {
      return apiError("VALIDATION_ERROR", "Nur geplante Fahrstunden können storniert werden");
    }

    // Check 24h rule
    const lessonDateTime = new Date(`${fahrstunde.datum}T${fahrstunde.uhrzeit}`);
    const now = new Date();
    const hoursUntilLesson = (lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const lateCancel = hoursUntilLesson < 24;

    // Cancel the lesson
    await supabase
      .from("fahrstunden")
      .update({ status: "abgesagt" })
      .eq("id", body.fahrstundeId);

    // If late cancellation, create a fee (50% of lesson price)
    if (lateCancel) {
      const faelligAm = new Date();
      faelligAm.setDate(faelligAm.getDate() + 7);

      await supabase.from("zahlungen").insert({
        tenant_id: fahrstunde.tenant_id,
        schueler_id: fahrstunde.schueler_id,
        betrag: 27.50, // 50% late cancellation fee
        beschreibung: `Stornierungsgebühr (kurzfristige Absage < 24h) — ${new Date(fahrstunde.datum).toLocaleDateString("de-DE")}`,
        status: "offen",
        faellig_am: faelligAm.toISOString().split("T")[0],
        mahnungs_stufe: 0,
      });
    }

    // Try to fill slot from waitlist
    const { data: warteliste } = await supabase
      .from("fahrstunden")
      .select("id, schueler_id")
      .eq("tenant_id", fahrstunde.tenant_id)
      .eq("status", "warteliste")
      .eq("datum", fahrstunde.datum)
      .limit(1);

    let nachruecker = null;
    if (warteliste && warteliste.length > 0) {
      const next = warteliste[0];
      await supabase
        .from("fahrstunden")
        .update({
          status: "geplant",
          uhrzeit: fahrstunde.uhrzeit,
          fahrlehrer_id: fahrstunde.fahrlehrer_id,
        })
        .eq("id", next.id);
      nachruecker = next.schueler_id;
    }

    emitEvent("fahrstunde.abgesagt", fahrstunde.tenant_id, {
      fahrstundeId: fahrstunde.id,
      schuelerId: fahrstunde.schueler_id,
      lateCancel,
      nachruecker,
    });

    return NextResponse.json({
      success: true,
      lateCancel,
      stornogebuehr: lateCancel ? 27.50 : 0,
      nachruecker,
      message: lateCancel
        ? "Fahrstunde storniert. Stornierungsgebühr (< 24h Absage) wurde erstellt."
        : "Fahrstunde storniert.",
    });
  } catch (err) {
    return serverError(err, { component: "crm-stornierung", action: "cancel" });
  }
}
