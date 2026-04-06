import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { outreachEmail, followUpEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit } from "@/lib/api-auth";

const isEmailLimited = rateLimit("email-send", 10, 60_000); // 10 emails/min

/**
 * POST /api/email/send
 *
 * Sendet eine E-Mail (Outreach, Follow-Up, oder Custom).
 * Loggt den Versand in der follow_ups-Tabelle falls followUpId angegeben.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isAuthed(auth)) return auth;

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (isEmailLimited(ip)) {
      return NextResponse.json({ error: "Zu viele E-Mails. Bitte warten." }, { status: 429 });
    }

    const body = await req.json();
    const { to, subject, typ, nachricht, anrede, stufe, followUpId, leadId } = body;

    if (!to || !subject) {
      return NextResponse.json({ error: "to und subject required" }, { status: 400 });
    }

    // HTML generieren
    let html: string;
    if (typ === "outreach") {
      html = outreachEmail({ anrede: anrede || "Sehr geehrte Damen und Herren", nachricht });
    } else if (typ === "follow_up") {
      html = followUpEmail({ anrede: anrede || "Sehr geehrte Damen und Herren", nachricht, stufe: stufe || 1 });
    } else {
      // Custom HTML
      html = nachricht || body.html || "";
    }

    // Senden
    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Follow-Up als gesendet markieren
    if (followUpId) {
      const supabase = await createClient();
      await supabase
        .from("follow_ups")
        .update({ status: "gesendet", gesendet_am: new Date().toISOString() })
        .eq("id", followUpId);
    }

    // Lead-Status aktualisieren
    if (leadId) {
      const supabase = await createClient();
      await supabase
        .from("sales_leads")
        .update({ status: "kontaktiert" })
        .eq("id", leadId)
        .eq("status", "neu"); // Nur wenn noch "neu"
    }

    return NextResponse.json({ success: true, emailId: result.id });
  } catch (error) {
    console.error("[Email] Send error:", error);
    return NextResponse.json({ error: "E-Mail-Versand fehlgeschlagen" }, { status: 500 });
  }
}
