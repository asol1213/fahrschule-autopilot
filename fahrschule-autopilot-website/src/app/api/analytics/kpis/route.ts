import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("analytics-kpis", 30, 60_000);

/**
 * GET /api/analytics/kpis?tenantId=xxx
 *
 * Berechnet operative KPIs für das Fahrschul-Dashboard:
 * - Durchlaufzeit Anmeldung → Bestanden
 * - Dokumenten-Vollständigkeitsrate
 * - Ø Tage bis Dokumente komplett
 * - Abbruchrate
 * - Dokumente pro Typ Statistik
 * - Schüler-Fortschritt Übersicht
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  const supabase = await createClient();

  // Parallele Abfragen
  const [
    { data: alleSchuelerMitDoks },
    { data: bestandene },
    { data: abgebrochene },
  ] = await Promise.all([
    // Alle Schüler MIT Dokumenten (gleicher JOIN wie Dokumente-Seite)
    supabase
      .from("schueler")
      .select("id, status, vorname, nachname, anmeldungs_datum, created_at, dokumente(id, schueler_id, typ, vorhanden, upload_datum, created_at)")
      .eq("tenant_id", tenantId)
      .limit(500),
    // Bestandene Schüler (mit Prüfungsdatum)
    supabase
      .from("schueler")
      .select("id, anmeldungs_datum, created_at, pruefungen(datum, ergebnis, typ)")
      .eq("tenant_id", tenantId)
      .eq("status", "bestanden")
      .limit(500),
    // Abgebrochene Schüler
    supabase
      .from("schueler")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "abgebrochen")
      .limit(500),
  ]);

  const all = (alleSchuelerMitDoks || []) as Array<{
    id: string; status: string; vorname: string; nachname: string;
    anmeldungs_datum: string | null; created_at: string;
    dokumente: Array<{ id: string; schueler_id: string; typ: string; vorhanden: boolean; upload_datum: string | null; created_at: string }>;
  }>;
  const passed = bestandene || [];
  const dropped = abgebrochene || [];
  // Flatten all dokumente from all schueler
  const docs = all.flatMap((s) => s.dokumente || []);

  // --- 1. Durchlaufzeit Anmeldung → Bestanden (in Tagen) ---
  const durchlaufzeiten: number[] = [];
  for (const s of passed) {
    const anmeldung = s.anmeldungs_datum || s.created_at;
    if (!anmeldung) continue;
    // Letztes bestandenes Praxis-Prüfungsdatum finden
    const praxisBestanden = (s.pruefungen as Array<{ datum: string; ergebnis: string; typ: string }> || [])
      .filter((p) => p.ergebnis === "bestanden" && p.typ === "praxis")
      .sort((a, b) => b.datum.localeCompare(a.datum))[0];
    if (praxisBestanden) {
      const days = Math.round(
        (new Date(praxisBestanden.datum).getTime() - new Date(anmeldung).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days > 0) durchlaufzeiten.push(days);
    }
  }
  const avgDurchlaufzeit = durchlaufzeiten.length > 0
    ? Math.round(durchlaufzeiten.reduce((a, b) => a + b, 0) / durchlaufzeiten.length)
    : null;
  const minDurchlaufzeit = durchlaufzeiten.length > 0 ? Math.min(...durchlaufzeiten) : null;
  const maxDurchlaufzeit = durchlaufzeiten.length > 0 ? Math.max(...durchlaufzeiten) : null;

  // --- 2. Dokumenten-Vollständigkeitsrate ---
  // Pro Schüler: alle 5 Pflichtdokumente vorhanden?
  const requiredTypes = ["sehtest", "erste_hilfe", "passfoto", "ausweis", "fuehrerschein_antrag"];
  const aktiveSchueler = all.filter((s) => s.status !== "bestanden" && s.status !== "abgebrochen");

  const schuelerDokStatus: Array<{
    id: string;
    name: string;
    total: number;
    vorhanden: number;
    complete: boolean;
  }> = [];

  for (const s of aktiveSchueler) {
    const schuelerDocs = docs.filter((d) => d.schueler_id === s.id);
    const vorhandenCount = requiredTypes.filter((typ) =>
      schuelerDocs.some((d) => d.typ === typ && d.vorhanden)
    ).length;
    schuelerDokStatus.push({
      id: s.id,
      name: `${s.vorname} ${s.nachname}`,
      total: requiredTypes.length,
      vorhanden: vorhandenCount,
      complete: vorhandenCount === requiredTypes.length,
    });
  }

  const dokumenteVollstaendigRate = aktiveSchueler.length > 0
    ? Math.round((schuelerDokStatus.filter((s) => s.complete).length / aktiveSchueler.length) * 100)
    : 0;

  // --- 3. Ø Tage bis Dokumente komplett ---
  const tagebisDokKomplett: number[] = [];
  for (const s of all) {
    const anmeldung = s.anmeldungs_datum || s.created_at;
    if (!anmeldung) continue;
    const schuelerDocs = docs.filter((d) => d.schueler_id === s.id);
    const allComplete = requiredTypes.every((typ) =>
      schuelerDocs.some((d) => d.typ === typ && d.vorhanden)
    );
    if (allComplete) {
      // Letztes Upload-Datum der Pflichtdokumente
      const lastUpload = schuelerDocs
        .filter((d) => requiredTypes.includes(d.typ) && d.vorhanden && d.upload_datum)
        .sort((a, b) => (b.upload_datum as string).localeCompare(a.upload_datum as string))[0];
      if (lastUpload?.upload_datum) {
        const days = Math.round(
          (new Date(lastUpload.upload_datum).getTime() - new Date(anmeldung).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (days >= 0) tagebisDokKomplett.push(days);
      }
    }
  }
  const avgTageBisDokKomplett = tagebisDokKomplett.length > 0
    ? Math.round(tagebisDokKomplett.reduce((a, b) => a + b, 0) / tagebisDokKomplett.length)
    : null;

  // --- 4. Abbruchrate ---
  const totalAnmeldungen = all.length;
  const abbruchRate = totalAnmeldungen > 0
    ? Math.round((dropped.length / totalAnmeldungen) * 100)
    : 0;

  // --- 5. Dokumente pro Typ ---
  const dokumenteProTyp = requiredTypes.map((typ) => {
    const typDocs = docs.filter((d) => d.typ === typ);
    const vorhanden = typDocs.filter((d) => d.vorhanden).length;
    const total = aktiveSchueler.length; // Jeder aktive Schüler braucht jedes Dokument
    const labels: Record<string, string> = {
      sehtest: "Sehtest",
      erste_hilfe: "Erste-Hilfe-Kurs",
      passfoto: "Passfoto",
      ausweis: "Personalausweis/Pass",
      fuehrerschein_antrag: "Führerscheinantrag",
    };
    return {
      typ,
      label: labels[typ] || typ,
      vorhanden,
      fehlend: total - vorhanden,
      rate: total > 0 ? Math.round((vorhanden / total) * 100) : 0,
    };
  });

  // --- 6. Schüler-Fortschritt (Status-Verteilung mit Durchlaufzeit) ---
  const statusLabels: Record<string, string> = {
    angemeldet: "Angemeldet",
    dokumente_ausstehend: "Dokumente ausstehend",
    theorie: "Theorie-Phase",
    praxis: "Praxis-Phase",
    pruefung: "Prüfungs-Phase",
    bestanden: "Bestanden",
    abgebrochen: "Abgebrochen",
  };

  const statusVerteilung = Object.entries(
    all.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    status,
    label: statusLabels[status] || status,
    count,
  }));

  return NextResponse.json({
    durchlaufzeit: {
      avg: avgDurchlaufzeit,
      min: minDurchlaufzeit,
      max: maxDurchlaufzeit,
      anzahl: durchlaufzeiten.length,
    },
    dokumenteVollstaendig: {
      rate: dokumenteVollstaendigRate,
      complete: schuelerDokStatus.filter((s) => s.complete).length,
      total: aktiveSchueler.length,
    },
    tageBisDokKomplett: {
      avg: avgTageBisDokKomplett,
      anzahl: tagebisDokKomplett.length,
    },
    abbruch: {
      rate: abbruchRate,
      count: dropped.length,
      total: totalAnmeldungen,
    },
    dokumenteProTyp,
    statusVerteilung,
    schuelerDokStatus,
  });
}
