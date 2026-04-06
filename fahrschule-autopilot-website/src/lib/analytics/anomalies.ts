/**
 * Anomalie-Erkennung — extrahiert aus /api/analytics für Testbarkeit und Wiederverwendung.
 */

export interface Anomaly {
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  metric?: string;
}

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function detectAnomalies(
  noShowData: Array<{ rate: number; count: number }>,
  offeneZahlungen: Array<Record<string, unknown>>,
  aktiveSchueler: Array<Record<string, unknown>>,
  pruefungsreif: Array<{ name: string; id: string }>,
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // No-Show Anomalie
  if (noShowData.length >= 5) {
    const recent = noShowData[noShowData.length - 1];
    const prev = noShowData.slice(-5, -1);
    const avgRate = prev.reduce((s, w) => s + w.rate, 0) / prev.length;
    if (recent.rate > avgRate * 1.2 && recent.rate > 5) {
      anomalies.push({
        type: "warning",
        title: "Erhöhte No-Show-Rate",
        message: `Die No-Show-Rate ist diese Woche bei ${recent.rate}% (Durchschnitt: ${Math.round(avgRate)}%). ${recent.count} Fahrstunden wurden verpasst.`,
        metric: `${recent.rate}%`,
      });
    }
  }

  // Überfällige Zahlungen
  const ueberfaellig = offeneZahlungen.filter((z) => z.status === "ueberfaellig");
  const summeUeberfaellig = ueberfaellig.reduce((s, z) => s + Number(z.betrag), 0);
  if (summeUeberfaellig > 500) {
    anomalies.push({
      type: "danger",
      title: "Überfällige Zahlungen",
      message: `€${summeUeberfaellig.toLocaleString("de-DE")} in ${ueberfaellig.length} überfälligen Rechnungen. Automatische Mahnung empfohlen.`,
      metric: `€${summeUeberfaellig.toLocaleString("de-DE")}`,
    });
  }

  // Prüfungsreife Schüler MIT NAMEN
  if (pruefungsreif.length > 0) {
    const namen = pruefungsreif.slice(0, 5).map((s) => s.name).join(", ");
    const mehr = pruefungsreif.length > 5 ? ` und ${pruefungsreif.length - 5} weitere` : "";
    anomalies.push({
      type: "info",
      title: "Prüfungskandidaten",
      message: `${pruefungsreif.length} Schüler ${pruefungsreif.length === 1 ? "ist" : "sind"} prüfungsreif: ${namen}${mehr}`,
      metric: String(pruefungsreif.length),
    });
  }

  // Inaktive Schüler (in Theorie/Praxis aber keine Aktivität)
  const inAusbildung = aktiveSchueler.filter((s) => ["theorie", "praxis"].includes(s.status as string));
  if (inAusbildung.length > 10) {
    anomalies.push({
      type: "info",
      title: "Schüler in Ausbildung",
      message: `${inAusbildung.length} Schüler befinden sich aktuell in der Ausbildung (Theorie/Praxis).`,
      metric: String(inAusbildung.length),
    });
  }

  return anomalies;
}
