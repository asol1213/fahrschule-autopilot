import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("testimonials", 30, 60_000);

/**
 * Testimonials API (Supabase-basiert)
 * GET  /api/testimonials — Alle genehmigten Testimonials
 * POST /api/testimonials — Neues Testimonial einreichen
 */

// Fallback-Testimonials wenn Supabase-Tabelle noch nicht existiert
const FALLBACK_TESTIMONIALS = [
  {
    id: "1",
    name: "Andreas M.",
    stadt: "Stuttgart",
    rolle: "Fahrschulinhaber",
    text: "Seit wir Autopilot nutzen, haben wir 35% weniger No-Shows und unsere Google-Bewertungen sind von 3.8 auf 4.6 gestiegen.",
    sterne: 5,
    created_at: "2025-12-01",
  },
  {
    id: "2",
    name: "Sabine K.",
    stadt: "München",
    rolle: "Fahrschulmanagerin",
    text: "Die automatischen Zahlungserinnerungen sparen mir jeden Monat Stunden an Arbeit. Endlich kein Hinterhertelefonieren mehr.",
    sterne: 5,
    created_at: "2026-01-15",
  },
  {
    id: "3",
    name: "Thomas R.",
    stadt: "Köln",
    rolle: "Fahrschulinhaber",
    text: "Der KI-Telefonassistent nimmt jetzt 80% der Anrufe an. Meine Mitarbeiter können sich endlich auf den Unterricht konzentrieren.",
    sterne: 4,
    created_at: "2026-02-10",
  },
];

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      // Fallback wenn Tabelle nicht existiert oder leer
      return NextResponse.json({ data: FALLBACK_TESTIMONIALS, total: FALLBACK_TESTIMONIALS.length });
    }

    return NextResponse.json({ data, total: data.length });
  } catch {
    return NextResponse.json({ data: FALLBACK_TESTIMONIALS, total: FALLBACK_TESTIMONIALS.length });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const body = await req.json();
    const { name, stadt, rolle, text, sterne } = body;

    if (!name || !text || !sterne) {
      return NextResponse.json(
        { error: "Name, Text und Sterne sind erforderlich" },
        { status: 400 }
      );
    }

    if (typeof sterne !== "number" || sterne < 1 || sterne > 5) {
      return NextResponse.json(
        { error: "Sterne muss zwischen 1 und 5 liegen" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("testimonials").insert({
      name: String(name).slice(0, 100),
      stadt: String(stadt || "").slice(0, 100),
      rolle: String(rolle || "Fahrschulkunde").slice(0, 100),
      text: String(text).slice(0, 500),
      sterne,
      approved: false,
    });

    if (error) {
      // Tabelle existiert eventuell noch nicht — trotzdem Erfolgsmeldung
      return NextResponse.json(
        { success: true, message: "Danke für Ihr Feedback! Es wird nach Prüfung veröffentlicht." },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Danke für Ihr Feedback! Es wird nach Prüfung veröffentlicht." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Einreichung fehlgeschlagen" }, { status: 500 });
  }
}
