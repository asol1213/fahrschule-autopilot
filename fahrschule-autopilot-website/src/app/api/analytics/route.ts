import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { detectAnomalies, getISOWeek } from "@/lib/analytics/anomalies";

const checkLimit = rateLimit("analytics", 30, 60_000);

/**
 * GET /api/analytics?tenantId=xxx&range=6m
 *
 * Liefert Zeitreihen-Daten für das Analytics-Dashboard.
 * Alle Daten basierend auf Supabase-Tabellen.
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

  const range = req.nextUrl.searchParams.get("range") || "6m";
  const months = range === "12m" ? 12 : range === "3m" ? 3 : 6;

  const supabase = await createClient();
  const now = new Date();

  // Berechne Startdatum
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const startStr = startDate.toISOString().split("T")[0];

  // Wochenstart (Montag) für die letzten 8 Wochen
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - 7 * 8);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  // Parallele Abfragen
  const [
    { data: zahlungen },
    { data: schueler },
    { data: fahrstunden },
    { data: pruefungen },
    { data: schuelerAll },
    { data: offeneZahlungen },
  ] = await Promise.all([
    supabase
      .from("zahlungen")
      .select("betrag, status, bezahlt_am, created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", startStr),
    supabase
      .from("schueler")
      .select("status, anmeldungs_datum, created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", startStr),
    supabase
      .from("fahrstunden")
      .select("datum, status, fahrlehrer_id")
      .eq("tenant_id", tenantId)
      .gte("datum", weekStartStr),
    supabase
      .from("pruefungen")
      .select("typ, ergebnis, datum")
      .eq("tenant_id", tenantId)
      .gte("datum", startStr),
    supabase
      .from("schueler")
      .select("id, status, vorname, nachname")
      .eq("tenant_id", tenantId)
      .not("status", "eq", "bestanden")
      .not("status", "eq", "abgebrochen"),
    supabase
      .from("zahlungen")
      .select("betrag, status, schueler_id, faellig_am, schueler(vorname, nachname)")
      .eq("tenant_id", tenantId)
      .in("status", ["offen", "ueberfaellig"]),
  ]);

  // --- Umsatz pro Monat ---
  const umsatzMap = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    umsatzMap.set(key, 0);
  }
  (zahlungen || []).forEach((z) => {
    if (z.status === "bezahlt" && z.bezahlt_am) {
      const key = (z.bezahlt_am as string).slice(0, 7);
      if (umsatzMap.has(key)) {
        umsatzMap.set(key, (umsatzMap.get(key) || 0) + Number(z.betrag));
      }
    }
  });
  const umsatzProMonat = Array.from(umsatzMap.entries())
    .map(([monat, betrag]) => ({
      monat,
      label: new Date(monat + "-01").toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
      betrag: Math.round(betrag),
    }))
    .reverse();

  // --- Anmeldungen pro Monat ---
  const anmeldungenMap = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    anmeldungenMap.set(key, 0);
  }
  (schueler || []).forEach((s) => {
    const key = (s.anmeldungs_datum as string || s.created_at as string).slice(0, 7);
    if (anmeldungenMap.has(key)) {
      anmeldungenMap.set(key, (anmeldungenMap.get(key) || 0) + 1);
    }
  });
  const anmeldungenProMonat = Array.from(anmeldungenMap.entries())
    .map(([monat, count]) => ({
      monat,
      label: new Date(monat + "-01").toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
      count,
    }))
    .reverse();

  // --- No-Shows pro Woche ---
  const noShowWeeks = new Map<string, { total: number; noShows: number }>();
  for (let i = 0; i < 8; i++) {
    const wStart = new Date(now);
    wStart.setDate(wStart.getDate() - wStart.getDay() + 1 - 7 * i);
    const key = wStart.toISOString().split("T")[0];
    noShowWeeks.set(key, { total: 0, noShows: 0 });
  }
  (fahrstunden || []).forEach((f) => {
    const d = new Date(f.datum as string);
    const monday = new Date(d);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const key = monday.toISOString().split("T")[0];
    const entry = noShowWeeks.get(key);
    if (entry) {
      entry.total++;
      if (f.status === "no_show") entry.noShows++;
    }
  });
  const noShowsProWoche = Array.from(noShowWeeks.entries())
    .map(([woche, data]) => ({
      woche,
      label: `KW ${getISOWeek(new Date(woche))}`,
      rate: data.total > 0 ? Math.round((data.noShows / data.total) * 100) : 0,
      count: data.noShows,
      total: data.total,
    }))
    .reverse();

  // --- Fahrstunden pro Woche (nach Status) ---
  const stundenWeeks = new Map<string, { geplant: number; abgeschlossen: number; noShow: number; abgesagt: number }>();
  for (let i = 0; i < 8; i++) {
    const wStart = new Date(now);
    wStart.setDate(wStart.getDate() - wStart.getDay() + 1 - 7 * i);
    const key = wStart.toISOString().split("T")[0];
    stundenWeeks.set(key, { geplant: 0, abgeschlossen: 0, noShow: 0, abgesagt: 0 });
  }
  (fahrstunden || []).forEach((f) => {
    const d = new Date(f.datum as string);
    const monday = new Date(d);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const key = monday.toISOString().split("T")[0];
    const entry = stundenWeeks.get(key);
    if (entry) {
      if (f.status === "geplant") entry.geplant++;
      else if (f.status === "abgeschlossen") entry.abgeschlossen++;
      else if (f.status === "no_show") entry.noShow++;
      else if (f.status === "abgesagt") entry.abgesagt++;
    }
  });
  const fahrstundenProWoche = Array.from(stundenWeeks.entries())
    .map(([woche, data]) => ({
      woche,
      label: `KW ${getISOWeek(new Date(woche))}`,
      ...data,
    }))
    .reverse();

  // --- Prüfungen pro Monat ---
  const pruefMap = new Map<string, { bestanden: number; nichtBestanden: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    pruefMap.set(key, { bestanden: 0, nichtBestanden: 0 });
  }
  (pruefungen || []).forEach((p) => {
    const key = (p.datum as string).slice(0, 7);
    const entry = pruefMap.get(key);
    if (entry) {
      if (p.ergebnis === "bestanden") entry.bestanden++;
      else if (p.ergebnis === "nicht_bestanden") entry.nichtBestanden++;
    }
  });
  const pruefungenProMonat = Array.from(pruefMap.entries())
    .map(([monat, data]) => ({
      monat,
      label: new Date(monat + "-01").toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
      ...data,
    }))
    .reverse();

  // --- Prüfungs-Zusammenfassung (für PieChart) ---
  const allPruef = pruefungen || [];
  const pruefungsSummary = {
    theorieBestanden: allPruef.filter((p) => p.typ === "theorie" && p.ergebnis === "bestanden").length,
    theorieNicht: allPruef.filter((p) => p.typ === "theorie" && p.ergebnis === "nicht_bestanden").length,
    praxisBestanden: allPruef.filter((p) => p.typ === "praxis" && p.ergebnis === "bestanden").length,
    praxisNicht: allPruef.filter((p) => p.typ === "praxis" && p.ergebnis === "nicht_bestanden").length,
  };

  // --- Schüler-Pipeline (aktuell) ---
  const statusCounts: Record<string, number> = {};
  (schuelerAll || []).forEach((s) => {
    const st = s.status as string;
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });
  const schuelerPipeline = [
    { status: "angemeldet", label: "Angemeldet", count: statusCounts["angemeldet"] || 0, color: "#3b82f6" },
    { status: "dokumente_ausstehend", label: "Dokumente", count: statusCounts["dokumente_ausstehend"] || 0, color: "#f97316" },
    { status: "theorie", label: "Theorie", count: statusCounts["theorie"] || 0, color: "#a855f7" },
    { status: "praxis", label: "Praxis", count: statusCounts["praxis"] || 0, color: "#06b6d4" },
    { status: "pruefung", label: "Prüfung", count: statusCounts["pruefung"] || 0, color: "#eab308" },
  ];

  // --- Prüfungsreife Schüler (mit Namen) ---
  const pruefungsreif = (schuelerAll || [])
    .filter((s) => s.status === "pruefung")
    .map((s) => ({ name: `${s.vorname} ${s.nachname}`, id: s.id }));

  // --- Anomalien ---
  const anomalies = detectAnomalies(noShowsProWoche, offeneZahlungen || [], schuelerAll || [], pruefungsreif);

  return NextResponse.json({
    tenantId,
    generatedAt: new Date().toISOString(),
    range,
    umsatzProMonat,
    anmeldungenProMonat,
    noShowsProWoche,
    fahrstundenProWoche,
    pruefungenProMonat,
    pruefungsSummary,
    schuelerPipeline,
    anomalies,
  });
}

