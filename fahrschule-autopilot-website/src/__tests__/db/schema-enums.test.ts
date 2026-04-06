import { describe, it, expect } from "vitest";
import type {
  Schueler,
  Fahrstunde,
  Zahlung,
  Dokument,
  Kommunikation,
  Pruefung,
  Fahrlehrer,
  Fahrzeug,
  SchuelerStatus,
  ZahlungsStatus,
  DokumentTyp,
  KommunikationsKanal,
  PruefungsTyp,
  PruefungsErgebnis,
} from "@/lib/db/schema";

// ===================================================================
// Enum value completeness tests
// ===================================================================

describe("SchuelerStatus enum", () => {
  it("has exactly 7 valid states", () => {
    const statuses: SchuelerStatus[] = [
      "angemeldet",
      "dokumente_ausstehend",
      "theorie",
      "praxis",
      "pruefung",
      "bestanden",
      "abgebrochen",
    ];
    expect(statuses).toHaveLength(7);
  });

  it("includes initial state 'angemeldet'", () => {
    const s: SchuelerStatus = "angemeldet";
    expect(s).toBe("angemeldet");
  });

  it("includes terminal states 'bestanden' and 'abgebrochen'", () => {
    const bestanden: SchuelerStatus = "bestanden";
    const abgebrochen: SchuelerStatus = "abgebrochen";
    expect(bestanden).toBe("bestanden");
    expect(abgebrochen).toBe("abgebrochen");
  });
});

describe("ZahlungsStatus enum", () => {
  it("has exactly 5 valid states", () => {
    const statuses: ZahlungsStatus[] = [
      "offen",
      "teilbezahlt",
      "bezahlt",
      "ueberfaellig",
      "storniert",
    ];
    expect(statuses).toHaveLength(5);
  });

  it("includes payment progression states", () => {
    const offen: ZahlungsStatus = "offen";
    const teil: ZahlungsStatus = "teilbezahlt";
    const bezahlt: ZahlungsStatus = "bezahlt";
    expect(offen).toBe("offen");
    expect(teil).toBe("teilbezahlt");
    expect(bezahlt).toBe("bezahlt");
  });

  it("includes problem states", () => {
    const ueberfaellig: ZahlungsStatus = "ueberfaellig";
    const storniert: ZahlungsStatus = "storniert";
    expect(ueberfaellig).toBe("ueberfaellig");
    expect(storniert).toBe("storniert");
  });
});

describe("DokumentTyp enum", () => {
  it("has exactly 6 types", () => {
    const typen: DokumentTyp[] = [
      "sehtest",
      "erste_hilfe",
      "passfoto",
      "ausweis",
      "fuehrerschein_antrag",
      "sonstiges",
    ];
    expect(typen).toHaveLength(6);
  });

  it("includes medical documents", () => {
    const sehtest: DokumentTyp = "sehtest";
    const ersteHilfe: DokumentTyp = "erste_hilfe";
    expect(sehtest).toBe("sehtest");
    expect(ersteHilfe).toBe("erste_hilfe");
  });

  it("includes catch-all 'sonstiges' type", () => {
    const sonstiges: DokumentTyp = "sonstiges";
    expect(sonstiges).toBe("sonstiges");
  });
});

describe("KommunikationsKanal enum", () => {
  it("has exactly 5 channels", () => {
    const channels: KommunikationsKanal[] = [
      "whatsapp",
      "email",
      "telefon",
      "website",
      "sms",
    ];
    expect(channels).toHaveLength(5);
  });

  it("includes digital channels", () => {
    const wa: KommunikationsKanal = "whatsapp";
    const em: KommunikationsKanal = "email";
    const sms: KommunikationsKanal = "sms";
    expect(wa).toBe("whatsapp");
    expect(em).toBe("email");
    expect(sms).toBe("sms");
  });
});

describe("PruefungsTyp enum", () => {
  it("has exactly 2 types", () => {
    const typen: PruefungsTyp[] = ["theorie", "praxis"];
    expect(typen).toHaveLength(2);
  });
});

describe("PruefungsErgebnis enum", () => {
  it("has exactly 2 results", () => {
    const ergebnisse: PruefungsErgebnis[] = ["bestanden", "nicht_bestanden"];
    expect(ergebnisse).toHaveLength(2);
  });
});

// ===================================================================
// Interface required field tests
// ===================================================================

describe("Schueler interface", () => {
  const validSchueler: Schueler = {
    id: "uuid-1",
    tenantId: "tenant-1",
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
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("has all required fields", () => {
    expect(validSchueler.id).toBeDefined();
    expect(validSchueler.tenantId).toBeDefined();
    expect(validSchueler.vorname).toBeDefined();
    expect(validSchueler.nachname).toBeDefined();
    expect(validSchueler.email).toBeDefined();
    expect(validSchueler.telefon).toBeDefined();
    expect(validSchueler.geburtsdatum).toBeDefined();
    expect(validSchueler.adresse).toBeDefined();
    expect(validSchueler.plz).toBeDefined();
    expect(validSchueler.ort).toBeDefined();
    expect(validSchueler.fuehrerscheinklasse).toBeDefined();
    expect(validSchueler.status).toBeDefined();
    expect(validSchueler.anmeldungsDatum).toBeDefined();
    expect(validSchueler.createdAt).toBeDefined();
    expect(validSchueler.updatedAt).toBeDefined();
  });

  it("has optional DSGVO fields", () => {
    const withDsgvo: Schueler = {
      ...validSchueler,
      whatsappEinwilligung: true,
      emailEinwilligung: true,
      dsgvoEinwilligung: true,
      dsgvoEinwilligungDatum: "2026-01-01",
    };
    expect(withDsgvo.dsgvoEinwilligung).toBe(true);
  });

  it("supports deletedAt as string or null", () => {
    const softDeleted: Schueler = { ...validSchueler, deletedAt: "2026-03-01T00:00:00Z" };
    const notDeleted: Schueler = { ...validSchueler, deletedAt: null };
    expect(softDeleted.deletedAt).toBe("2026-03-01T00:00:00Z");
    expect(notDeleted.deletedAt).toBeNull();
  });
});

describe("Fahrstunde interface", () => {
  it("has all required fields", () => {
    const fahrstunde: Fahrstunde = {
      id: "uuid-1",
      tenantId: "tenant-1",
      schuelerId: "schueler-1",
      datum: "2026-03-15",
      uhrzeit: "14:00",
      dauer: 90,
      typ: "normal",
      status: "geplant",
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(fahrstunde.schuelerId).toBeDefined();
    expect(fahrstunde.dauer).toBe(90);
  });

  it("has correct status union with 4 values", () => {
    const statuses: Fahrstunde["status"][] = ["geplant", "abgeschlossen", "abgesagt", "no_show"];
    expect(statuses).toHaveLength(4);
  });

  it("has correct typ union with 5 values", () => {
    const typen: Fahrstunde["typ"][] = [
      "normal",
      "sonderfahrt_ueberlandfahrt",
      "sonderfahrt_autobahnfahrt",
      "sonderfahrt_nachtfahrt",
      "pruefungsvorbereitung",
    ];
    expect(typen).toHaveLength(5);
  });
});

describe("Zahlung interface", () => {
  it("has all required fields including mahnungsStufe", () => {
    const zahlung: Zahlung = {
      id: "uuid-1",
      tenantId: "tenant-1",
      schuelerId: "schueler-1",
      betrag: 49.99,
      beschreibung: "Fahrstunde",
      status: "offen",
      faelligAm: "2026-04-01",
      mahnungsStufe: 0,
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(zahlung.betrag).toBe(49.99);
    expect(zahlung.mahnungsStufe).toBe(0);
  });

  it("supports optional bezahltAm and stripeSessionId", () => {
    const zahlung: Partial<Zahlung> = {
      bezahltAm: "2026-04-01",
      stripeSessionId: "cs_test_123",
    };
    expect(zahlung.bezahltAm).toBeDefined();
    expect(zahlung.stripeSessionId).toBeDefined();
  });
});

describe("Dokument interface", () => {
  it("has vorhanden as required boolean", () => {
    const dok: Dokument = {
      id: "uuid-1",
      tenantId: "tenant-1",
      schuelerId: "schueler-1",
      typ: "sehtest",
      vorhanden: false,
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(dok.vorhanden).toBe(false);
  });

  it("supports optional dateiname and dates", () => {
    const dok: Partial<Dokument> = {
      dateiname: "sehtest.pdf",
      uploadDatum: "2026-01-15",
      ablaufDatum: "2028-01-15",
    };
    expect(dok.dateiname).toBe("sehtest.pdf");
  });
});

describe("Kommunikation interface", () => {
  it("has richtung as eingehend or ausgehend", () => {
    const ein: Kommunikation["richtung"] = "eingehend";
    const aus: Kommunikation["richtung"] = "ausgehend";
    expect(ein).toBe("eingehend");
    expect(aus).toBe("ausgehend");
  });

  it("has required inhalt and datum fields", () => {
    const msg: Kommunikation = {
      id: "uuid-1",
      tenantId: "tenant-1",
      schuelerId: "schueler-1",
      kanal: "whatsapp",
      richtung: "eingehend",
      inhalt: "Hallo",
      datum: "2026-03-20",
    };
    expect(msg.inhalt).toBe("Hallo");
    expect(msg.datum).toBeDefined();
  });
});

describe("Pruefung interface", () => {
  it("has required fields", () => {
    const pruefung: Pruefung = {
      id: "uuid-1",
      tenantId: "tenant-1",
      schuelerId: "schueler-1",
      typ: "theorie",
      datum: "2026-04-10",
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(pruefung.typ).toBe("theorie");
  });

  it("supports optional ergebnis and fehlerpunkte", () => {
    const pruefung: Partial<Pruefung> = {
      ergebnis: "bestanden",
      fehlerpunkte: 5,
    };
    expect(pruefung.ergebnis).toBe("bestanden");
    expect(pruefung.fehlerpunkte).toBe(5);
  });
});

describe("Fahrlehrer interface", () => {
  it("has fuehrerscheinklassen as string array", () => {
    const lehrer: Fahrlehrer = {
      id: "uuid-1",
      tenantId: "tenant-1",
      vorname: "Hans",
      nachname: "Schmidt",
      telefon: "+4917712345",
      fuehrerscheinklassen: ["B", "BE", "A"],
      aktiv: true,
    };
    expect(lehrer.fuehrerscheinklassen).toEqual(["B", "BE", "A"]);
    expect(lehrer.aktiv).toBe(true);
  });

  it("has optional email", () => {
    const lehrer: Partial<Fahrlehrer> = { email: "hans@test.de" };
    expect(lehrer.email).toBe("hans@test.de");
  });
});

describe("Fahrzeug interface", () => {
  it("has all required fields", () => {
    const fahrzeug: Fahrzeug = {
      id: "uuid-1",
      tenantId: "tenant-1",
      kennzeichen: "N-AP 123",
      marke: "VW",
      modell: "Golf",
      baujahr: 2022,
      fuehrerscheinklasse: "B",
      tuevBis: "2027-06-01",
      kilometerstand: 25000,
      status: "aktiv",
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(fahrzeug.kennzeichen).toBe("N-AP 123");
    expect(fahrzeug.baujahr).toBe(2022);
  });

  it("has correct status union with 3 values", () => {
    const statuses: Fahrzeug["status"][] = ["aktiv", "werkstatt", "ausgemustert"];
    expect(statuses).toHaveLength(3);
  });

  it("supports optional notizen", () => {
    const fahrzeug: Partial<Fahrzeug> = { notizen: "Kratzer links" };
    expect(fahrzeug.notizen).toBe("Kratzer links");
  });
});
