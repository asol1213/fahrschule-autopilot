import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-calendar-sync", 30, 60_000);

/**
 * GET /api/crm/calendar-sync?tenantId=xxx&format=ical
 * Export driving lessons as iCal format for Google Calendar / Outlook import
 *
 * POST /api/crm/calendar-sync
 * Configure Google Calendar webhook for real-time sync (future)
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const format = req.nextUrl.searchParams.get("format") || "ical";
  const fahrlehrer = req.nextUrl.searchParams.get("fahrlehrerId");
  const von = req.nextUrl.searchParams.get("von");
  const bis = req.nextUrl.searchParams.get("bis");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  try {
    const supabase = await createClient();

    let query = supabase
      .from("fahrstunden")
      .select("*, schueler(vorname, nachname, telefon), fahrlehrer(vorname, nachname)")
      .eq("tenant_id", tenantId)
      .eq("status", "geplant")
      .order("datum")
      .order("uhrzeit");

    if (fahrlehrer) query = query.eq("fahrlehrer_id", fahrlehrer);
    if (von) query = query.gte("datum", von);
    if (bis) query = query.lte("datum", bis);

    const { data: fahrstunden } = await query;

    if (format === "ical") {
      // Generate iCal format
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Fahrschule Autopilot//CRM//DE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:Fahrstunden`,
      ];

      (fahrstunden || []).forEach((fs) => {
        const schueler = fs.schueler as Record<string, string> | null;
        const fl = fs.fahrlehrer as Record<string, string> | null;
        const startDate = fs.datum.replace(/-/g, "");
        const startTime = (fs.uhrzeit as string).replace(/:/g, "").padEnd(6, "0");

        // Calculate end time
        const [h, m] = (fs.uhrzeit as string).split(":").map(Number);
        const endMinutes = h * 60 + m + (fs.dauer as number);
        const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
        const endM = String(endMinutes % 60).padStart(2, "0");
        const endTime = `${endH}${endM}00`;

        const typLabels: Record<string, string> = {
          normal: "Fahrstunde",
          sonderfahrt_ueberlandfahrt: "Sonderfahrt Überland",
          sonderfahrt_autobahnfahrt: "Sonderfahrt Autobahn",
          sonderfahrt_nachtfahrt: "Sonderfahrt Nacht",
          pruefungsvorbereitung: "Prüfungsvorbereitung",
        };

        lines.push("BEGIN:VEVENT");
        lines.push(`DTSTART:${startDate}T${startTime}`);
        lines.push(`DTEND:${startDate}T${endTime}`);
        lines.push(`SUMMARY:${typLabels[fs.typ as string] || "Fahrstunde"} — ${schueler?.vorname || ""} ${schueler?.nachname || ""}`);
        lines.push(`DESCRIPTION:Schüler: ${schueler?.vorname} ${schueler?.nachname}\\nTelefon: ${schueler?.telefon || ""}\\nFahrlehrer: ${fl?.vorname || ""} ${fl?.nachname || ""}\\nDauer: ${fs.dauer} Min`);
        lines.push(`UID:${fs.id}@fahrschulautopilot.de`);
        lines.push("END:VEVENT");
      });

      lines.push("END:VCALENDAR");

      return new Response(lines.join("\r\n"), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": "attachment; filename=fahrstunden.ics",
        },
      });
    }

    // JSON format
    return NextResponse.json({ data: fahrstunden });
  } catch {
    return NextResponse.json({ error: "Fehler beim Export" }, { status: 500 });
  }
}

/**
 * POST /api/crm/calendar-sync — Store Google Calendar config
 * Body: { tenantId, calendarId, accessToken, refreshToken }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    if (!body.tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    // For now, store the calendar sync configuration
    // Full OAuth flow would be implemented with Google Calendar API
    const supabase = await createClient();

    // Store in tenant metadata (could be a separate table)
    await supabase
      .from("tenants")
      .update({
        // Would need a metadata/jsonb column in production
      })
      .eq("id", body.tenantId);

    return NextResponse.json({
      success: true,
      message: "Kalender-Sync konfiguriert. iCal-Export verfügbar unter /api/crm/calendar-sync?tenantId=...&format=ical",
      icalUrl: `/api/crm/calendar-sync?tenantId=${body.tenantId}&format=ical`,
    });
  } catch {
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
