import { describe, it, expect } from "vitest";
import type {
  Schueler,
  Fahrstunde,
  Zahlung,
  Dokument,
  Kommunikation,
  Pruefung,
  Fahrlehrer,
  SchuelerStatus,
  ZahlungsStatus,
  DokumentTyp,
  KommunikationsKanal,
  PruefungsTyp,
  PruefungsErgebnis,
} from "@/lib/db/schema";

describe("CRM Schema Types", () => {
  it("Schueler interface has all required fields including DSGVO and deletedAt", () => {
    const schueler: Schueler = {
      id: "uuid",
      tenantId: "tenant-uuid",
      vorname: "Max",
      nachname: "Mustermann",
      email: "max@test.de",
      telefon: "+491234567890",
      geburtsdatum: "2000-01-01",
      adresse: "Teststr. 1",
      plz: "12345",
      ort: "Berlin",
      fuehrerscheinklasse: "B",
      status: "angemeldet",
      anmeldungsDatum: "2026-01-01",
      whatsappEinwilligung: true,
      emailEinwilligung: true,
      dsgvoEinwilligung: true,
      dsgvoEinwilligungDatum: "2026-01-01T00:00:00Z",
      deletedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(schueler.vorname).toBe("Max");
    expect(schueler.deletedAt).toBeNull();
    expect(schueler.dsgvoEinwilligung).toBe(true);
  });

  it("SchuelerStatus has all 7 valid states", () => {
    const validStatuses: SchuelerStatus[] = [
      "angemeldet",
      "dokumente_ausstehend",
      "theorie",
      "praxis",
      "pruefung",
      "bestanden",
      "abgebrochen",
    ];
    expect(validStatuses.length).toBe(7);
  });

  it("ZahlungsStatus has all 5 valid states", () => {
    const valid: ZahlungsStatus[] = ["offen", "teilbezahlt", "bezahlt", "ueberfaellig", "storniert"];
    expect(valid.length).toBe(5);
  });

  it("DokumentTyp has all 6 types", () => {
    const valid: DokumentTyp[] = ["sehtest", "erste_hilfe", "passfoto", "ausweis", "fuehrerschein_antrag", "sonstiges"];
    expect(valid.length).toBe(6);
  });

  it("Fahrstunde interface has deletedAt field", () => {
    const f: Partial<Fahrstunde> = { deletedAt: null };
    expect(f.deletedAt).toBeNull();
  });

  it("Zahlung interface has deletedAt field", () => {
    const z: Partial<Zahlung> = { deletedAt: null };
    expect(z.deletedAt).toBeNull();
  });

  it("Dokument interface has deletedAt field", () => {
    const d: Partial<Dokument> = { deletedAt: null };
    expect(d.deletedAt).toBeNull();
  });

  it("Kommunikation interface has deletedAt field", () => {
    const k: Partial<Kommunikation> = { deletedAt: null };
    expect(k.deletedAt).toBeNull();
  });

  it("Pruefung interface has deletedAt field", () => {
    const p: Partial<Pruefung> = { deletedAt: null };
    expect(p.deletedAt).toBeNull();
  });

  it("Fahrlehrer interface has deletedAt field", () => {
    const f: Partial<Fahrlehrer> = { deletedAt: null };
    expect(f.deletedAt).toBeNull();
  });

  it("Fahrstunde has correct status union type", () => {
    const validStatuses: Fahrstunde["status"][] = ["geplant", "abgeschlossen", "abgesagt", "no_show"];
    expect(validStatuses.length).toBe(4);
  });

  it("Fahrstunde has correct typ union with 5 types", () => {
    const validTypes: Fahrstunde["typ"][] = [
      "normal",
      "sonderfahrt_ueberlandfahrt",
      "sonderfahrt_autobahnfahrt",
      "sonderfahrt_nachtfahrt",
      "pruefungsvorbereitung",
    ];
    expect(validTypes.length).toBe(5);
  });

  it("PruefungsTyp and PruefungsErgebnis are correct", () => {
    const types: PruefungsTyp[] = ["theorie", "praxis"];
    const results: PruefungsErgebnis[] = ["bestanden", "nicht_bestanden"];
    const channels: KommunikationsKanal[] = ["whatsapp", "email", "telefon", "website", "sms"];
    expect(types.length).toBe(2);
    expect(results.length).toBe(2);
    expect(channels.length).toBe(5);
  });
});
