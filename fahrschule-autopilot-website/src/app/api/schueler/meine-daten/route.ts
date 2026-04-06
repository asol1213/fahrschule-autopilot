import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("schueler-meine-daten", 30, 60_000);

/**
 * GET /api/schueler/meine-daten
 * Returns the authenticated student's dashboard data:
 * schueler record, upcoming fahrstunden, dokumente status, open zahlungen
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const supabase = await createClient();

    // 1. Get current auth user
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // 2. Find student record (links auth user to tenant)
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id, tenant_id, name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (studentErr || !student) {
      return NextResponse.json(
        { error: "Kein Schüler-Konto gefunden." },
        { status: 404 }
      );
    }

    // 3. Find the schueler record by email match within the tenant
    const { data: schueler, error: schuelerErr } = await supabase
      .from("schueler")
      .select(
        "id, vorname, nachname, email, fuehrerscheinklasse, status, created_at, fahrlehrer(vorname, nachname)"
      )
      .eq("tenant_id", student.tenant_id)
      .eq("email", user.email!)
      .maybeSingle();

    if (schuelerErr || !schueler) {
      // Fallback: return minimal data from the student record
      return NextResponse.json({
        student: {
          name: student.name || user.user_metadata?.name || user.email,
          email: user.email,
        },
        schueler: null,
        fahrstunden: [],
        dokumente: [],
        zahlungen: [],
      });
    }

    // 4. Load all related data in parallel
    const today = new Date().toISOString().split("T")[0];

    const [fahrstundenRes, dokumenteRes, zahlungenRes] = await Promise.all([
      // Upcoming fahrstunden
      supabase
        .from("fahrstunden")
        .select(
          "id, datum, uhrzeit, dauer, typ, status, fahrlehrer(vorname, nachname)"
        )
        .eq("tenant_id", student.tenant_id)
        .eq("schueler_id", schueler.id)
        .gte("datum", today)
        .neq("status", "abgesagt")
        .order("datum", { ascending: true })
        .order("uhrzeit", { ascending: true })
        .limit(10),

      // Dokumente
      supabase
        .from("dokumente")
        .select("id, typ, vorhanden, ablauf_datum")
        .eq("schueler_id", schueler.id),

      // Open zahlungen
      supabase
        .from("zahlungen")
        .select("id, betrag, beschreibung, status, faellig_am")
        .eq("tenant_id", student.tenant_id)
        .eq("schueler_id", schueler.id)
        .order("faellig_am", { ascending: true }),
    ]);

    return NextResponse.json({
      student: {
        name: student.name || `${schueler.vorname} ${schueler.nachname}`,
        email: user.email,
      },
      schueler: {
        id: schueler.id,
        vorname: schueler.vorname,
        nachname: schueler.nachname,
        fuehrerscheinklasse: schueler.fuehrerscheinklasse,
        status: schueler.status,
        created_at: schueler.created_at,
        fahrlehrer: schueler.fahrlehrer,
        tenant_id: student.tenant_id,
      },
      fahrstunden: fahrstundenRes.data || [],
      dokumente: dokumenteRes.data || [],
      zahlungen: zahlungenRes.data || [],
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("nicht konfiguriert")) {
      return NextResponse.json(
        { error: "Supabase ist nicht konfiguriert." },
        { status: 503 }
      );
    }
    console.error("[meine-daten]", err);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
