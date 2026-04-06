import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-pruefungsreife", 30, 60_000);

/**
 * GET /api/crm/pruefungsreife?schuelerId=xxx&tenantId=xxx
 * Composite readiness check: Theorie + Praxis + Dokumente + Fahrstunden
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const schuelerId = req.nextUrl.searchParams.get("schuelerId");
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  if (!schuelerId || !tenantId) {
    return NextResponse.json({ error: "schuelerId und tenantId erforderlich" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  try {
    const supabase = await createClient();

    const [
      { data: schueler },
      { data: fahrstunden },
      { data: dokumente },
      { data: pruefungen },
    ] = await Promise.all([
      supabase.from("schueler").select("*").eq("id", schuelerId).eq("tenant_id", tenantId).is("deleted_at", null).single(),
      supabase.from("fahrstunden").select("typ, status, bewertung, dauer").eq("schueler_id", schuelerId).eq("tenant_id", tenantId).is("deleted_at", null).eq("status", "abgeschlossen"),
      supabase.from("dokumente").select("typ, vorhanden").eq("schueler_id", schuelerId).eq("tenant_id", tenantId).is("deleted_at", null),
      supabase.from("pruefungen").select("typ, ergebnis").eq("schueler_id", schuelerId).eq("tenant_id", tenantId).is("deleted_at", null),
    ]);

    if (!schueler) {
      return NextResponse.json({ error: "Schüler nicht gefunden" }, { status: 404 });
    }

    const completedLessons = fahrstunden || [];
    const docs = dokumente || [];
    const exams = pruefungen || [];

    // Dokumente Check
    const requiredDocs = ["sehtest", "erste_hilfe", "passfoto", "ausweis", "fuehrerschein_antrag"];
    const vorhandeneDocs = docs.filter((d) => d.vorhanden).map((d) => d.typ);
    const fehlendeDocs = requiredDocs.filter((d) => !vorhandeneDocs.includes(d));
    const dokumenteOk = fehlendeDocs.length === 0;

    // Theorie Check
    const theorieExams = exams.filter((e) => e.typ === "theorie");
    const theorieBestanden = theorieExams.some((e) => e.ergebnis === "bestanden");

    // Fahrstunden Check (Minimum requirements for Klasse B)
    const normalLessons = completedLessons.filter((f) => f.typ === "normal");
    const ueberlandfahrten = completedLessons.filter((f) => f.typ === "sonderfahrt_ueberlandfahrt");
    const autobahnfahrten = completedLessons.filter((f) => f.typ === "sonderfahrt_autobahnfahrt");
    const nachtfahrten = completedLessons.filter((f) => f.typ === "sonderfahrt_nachtfahrt");

    // Legal minimums for Klasse B
    const minNormal = 12; // Grundfahrstunden (bei Vorbesitz weniger)
    const minUeberland = 5;
    const minAutobahn = 4;
    const minNacht = 3;

    const fahrstundenStatus = {
      normal: { ist: normalLessons.length, soll: minNormal, ok: normalLessons.length >= minNormal },
      ueberland: { ist: ueberlandfahrten.length, soll: minUeberland, ok: ueberlandfahrten.length >= minUeberland },
      autobahn: { ist: autobahnfahrten.length, soll: minAutobahn, ok: autobahnfahrten.length >= minAutobahn },
      nacht: { ist: nachtfahrten.length, soll: minNacht, ok: nachtfahrten.length >= minNacht },
    };

    const fahrstundenOk = Object.values(fahrstundenStatus).every((s) => s.ok);

    // Average instructor rating
    const ratings = completedLessons.filter((f) => f.bewertung).map((f) => f.bewertung as number);
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    const ratingOk = avgRating >= 3.5;

    // Composite score (0-100)
    let score = 0;
    if (dokumenteOk) score += 20;
    if (theorieBestanden) score += 25;
    if (fahrstundenOk) score += 30;
    if (ratingOk) score += 15;
    if (avgRating >= 4.5) score += 10; // Bonus for excellent ratings

    const pruefungsreif = dokumenteOk && theorieBestanden && fahrstundenOk && ratingOk;

    return NextResponse.json({
      schuelerId,
      name: `${schueler.vorname} ${schueler.nachname}`,
      pruefungsreif,
      score,
      details: {
        dokumente: {
          ok: dokumenteOk,
          vorhanden: vorhandeneDocs.length,
          erforderlich: requiredDocs.length,
          fehlend: fehlendeDocs,
        },
        theorie: {
          ok: theorieBestanden,
          versuche: theorieExams.length,
          bestanden: theorieBestanden,
        },
        fahrstunden: fahrstundenStatus,
        fahrstundenGesamt: completedLessons.length,
        bewertung: {
          ok: ratingOk,
          durchschnitt: avgRating,
          anzahl: ratings.length,
          minimum: 3.5,
        },
      },
      empfehlung: pruefungsreif
        ? "Schüler ist prüfungsreif. Praktische Prüfung kann angemeldet werden."
        : `Noch nicht prüfungsreif. Fehlend: ${[
            !dokumenteOk && "Dokumente",
            !theorieBestanden && "Theorieprüfung",
            !fahrstundenOk && "Pflichtstunden",
            !ratingOk && "Fahrlehrer-Bewertung zu niedrig",
          ]
            .filter(Boolean)
            .join(", ")}`,
    });
  } catch {
    return NextResponse.json({ error: "Fehler bei Prüfungsreife-Check" }, { status: 500 });
  }
}
