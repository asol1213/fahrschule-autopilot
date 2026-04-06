/**
 * Shared Helpers für CSV/PDF Export — extrahiert für Testbarkeit.
 */

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(val: unknown): string {
  if (!val) return "";
  return new Date(val as string).toLocaleDateString("de-DE");
}

export function statusLabel(status: unknown): string {
  const labels: Record<string, string> = {
    angemeldet: "Angemeldet",
    dokumente_ausstehend: "Dokumente ausstehend",
    theorie: "In Theorie",
    praxis: "In Praxis",
    pruefung: "Prüfung geplant",
    bestanden: "Bestanden",
    abgebrochen: "Abgebrochen",
    offen: "Offen",
    teilbezahlt: "Teilbezahlt",
    bezahlt: "Bezahlt",
    ueberfaellig: "Überfällig",
    storniert: "Storniert",
    geplant: "Geplant",
    abgeschlossen: "Abgeschlossen",
    abgesagt: "Abgesagt",
    no_show: "No-Show",
  };
  return labels[status as string] || (status as string) || "";
}

export function typLabel(typ: unknown): string {
  const labels: Record<string, string> = {
    normal: "Normal",
    sonderfahrt_ueberlandfahrt: "Überlandfahrt",
    sonderfahrt_autobahnfahrt: "Autobahnfahrt",
    sonderfahrt_nachtfahrt: "Nachtfahrt",
    pruefungsvorbereitung: "Prüfungsvorbereitung",
  };
  return labels[typ as string] || (typ as string) || "";
}
