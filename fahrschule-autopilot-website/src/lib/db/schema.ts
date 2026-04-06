/**
 * CRM Datenbank Schema
 *
 * Definiert alle Tabellen für die Schülerverwaltung.
 * Für Production: Supabase/Postgres mit diesen SQL-Definitionen.
 * Hier: TypeScript-Typen + In-Memory Store für Entwicklung.
 */

// ============================================================
// Enums
// ============================================================

export type SchuelerStatus =
  | "angemeldet"
  | "dokumente_ausstehend"
  | "theorie"
  | "praxis"
  | "pruefung"
  | "bestanden"
  | "abgebrochen";

export type ZahlungsStatus = "offen" | "teilbezahlt" | "bezahlt" | "ueberfaellig" | "storniert";

export type DokumentTyp = "sehtest" | "erste_hilfe" | "passfoto" | "ausweis" | "fuehrerschein_antrag" | "sonstiges";

export type KommunikationsKanal = "whatsapp" | "email" | "telefon" | "website" | "sms";

export type PruefungsTyp = "theorie" | "praxis";

export type PruefungsErgebnis = "bestanden" | "nicht_bestanden";

// ============================================================
// Tabellen
// ============================================================

export interface Schueler {
  id: string;
  tenantId: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  geburtsdatum: string;
  adresse: string;
  plz: string;
  ort: string;
  fuehrerscheinklasse: string;
  vorbesitz?: string;
  status: SchuelerStatus;
  fahrlehrerId?: string;
  anmeldungsDatum: string;
  notizen?: string;
  stripeCustomerId?: string;
  // DSGVO
  whatsappEinwilligung?: boolean;
  emailEinwilligung?: boolean;
  dsgvoEinwilligung?: boolean;
  dsgvoEinwilligungDatum?: string;
  ausbildungBeendetAm?: string;
  loeschungGeplantAm?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Fahrstunde {
  id: string;
  tenantId: string;
  schuelerId: string;
  fahrlehrerId?: string;
  datum: string;       // ISO date
  uhrzeit: string;     // "14:00"
  dauer: number;       // Minuten (45, 90)
  typ: "normal" | "sonderfahrt_ueberlandfahrt" | "sonderfahrt_autobahnfahrt" | "sonderfahrt_nachtfahrt" | "pruefungsvorbereitung";
  bewertung?: number;  // 1-5 Sterne
  notizen?: string;
  status: "geplant" | "abgeschlossen" | "abgesagt" | "no_show";
  deletedAt?: string | null;
  createdAt: string;
}

export interface Zahlung {
  id: string;
  tenantId: string;
  schuelerId: string;
  betrag: number;
  beschreibung: string;
  status: ZahlungsStatus;
  faelligAm: string;
  bezahltAm?: string;
  mahnungsStufe: number; // 0 = keine, 1-3
  stripeSessionId?: string;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Dokument {
  id: string;
  tenantId: string;
  schuelerId: string;
  typ: DokumentTyp;
  dateiname?: string;
  uploadDatum?: string;
  ablaufDatum?: string;
  vorhanden: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Kommunikation {
  id: string;
  tenantId: string;
  schuelerId: string;
  kanal: KommunikationsKanal;
  richtung: "eingehend" | "ausgehend";
  betreff?: string;
  inhalt: string;
  datum: string;
  deletedAt?: string | null;
}

export interface Pruefung {
  id: string;
  tenantId: string;
  schuelerId: string;
  typ: PruefungsTyp;
  datum: string;
  ergebnis?: PruefungsErgebnis;
  fehlerpunkte?: number;
  notizen?: string;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Fahrlehrer {
  id: string;
  tenantId: string;
  vorname: string;
  nachname: string;
  telefon: string;
  email?: string;
  fuehrerscheinklassen: string[];
  aktiv: boolean;
  deletedAt?: string | null;
}

export interface Fahrzeug {
  id: string;
  tenantId: string;
  kennzeichen: string;
  marke: string;
  modell: string;
  baujahr: number;
  fuehrerscheinklasse: string;
  tuevBis: string;
  kilometerstand: number;
  status: "aktiv" | "werkstatt" | "ausgemustert";
  notizen?: string;
  deletedAt?: string | null;
  createdAt: string;
}

// ============================================================
// SQL für Supabase/Postgres (zum Deployment kopieren)
// ============================================================

export const SQL_SCHEMA = `
-- Fahrlehrer
CREATE TABLE IF NOT EXISTS fahrlehrer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT,
  fuehrerscheinklassen TEXT[] DEFAULT ARRAY['B'],
  aktiv BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schüler
CREATE TABLE IF NOT EXISTS schueler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT NOT NULL,
  geburtsdatum DATE NOT NULL,
  adresse TEXT,
  plz TEXT,
  ort TEXT,
  fuehrerscheinklasse TEXT NOT NULL DEFAULT 'B',
  vorbesitz TEXT,
  status TEXT NOT NULL DEFAULT 'angemeldet',
  fahrlehrer_id UUID REFERENCES fahrlehrer(id),
  anmeldungs_datum DATE DEFAULT CURRENT_DATE,
  notizen TEXT,
  stripe_customer_id TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fahrstunden
CREATE TABLE IF NOT EXISTS fahrstunden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  schueler_id UUID NOT NULL REFERENCES schueler(id),
  fahrlehrer_id UUID REFERENCES fahrlehrer(id),
  datum DATE NOT NULL,
  uhrzeit TIME NOT NULL,
  dauer INTEGER NOT NULL DEFAULT 45,
  typ TEXT NOT NULL DEFAULT 'normal',
  bewertung INTEGER CHECK (bewertung >= 1 AND bewertung <= 5),
  notizen TEXT,
  status TEXT NOT NULL DEFAULT 'geplant',
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zahlungen
CREATE TABLE IF NOT EXISTS zahlungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  schueler_id UUID NOT NULL REFERENCES schueler(id),
  betrag DECIMAL(10,2) NOT NULL,
  beschreibung TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offen',
  faellig_am DATE NOT NULL,
  bezahlt_am DATE,
  mahnungs_stufe INTEGER DEFAULT 0,
  stripe_session_id TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dokumente
CREATE TABLE IF NOT EXISTS dokumente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  schueler_id UUID NOT NULL REFERENCES schueler(id),
  typ TEXT NOT NULL,
  dateiname TEXT,
  upload_datum TIMESTAMPTZ,
  ablauf_datum DATE,
  vorhanden BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kommunikation
CREATE TABLE IF NOT EXISTS kommunikation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  schueler_id UUID NOT NULL REFERENCES schueler(id),
  kanal TEXT NOT NULL,
  richtung TEXT NOT NULL,
  betreff TEXT,
  inhalt TEXT NOT NULL,
  datum TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Prüfungen
CREATE TABLE IF NOT EXISTS pruefungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  schueler_id UUID NOT NULL REFERENCES schueler(id),
  typ TEXT NOT NULL,
  datum DATE NOT NULL,
  ergebnis TEXT,
  fehlerpunkte INTEGER,
  notizen TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schueler_tenant ON schueler(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schueler_status ON schueler(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fahrstunden_schueler ON fahrstunden(schueler_id);
CREATE INDEX IF NOT EXISTS idx_fahrstunden_datum ON fahrstunden(tenant_id, datum);
CREATE INDEX IF NOT EXISTS idx_zahlungen_schueler ON zahlungen(schueler_id);
CREATE INDEX IF NOT EXISTS idx_zahlungen_status ON zahlungen(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dokumente_schueler ON dokumente(schueler_id);
CREATE INDEX IF NOT EXISTS idx_pruefungen_schueler ON pruefungen(schueler_id);

-- RLS Policies (Row Level Security)
ALTER TABLE schueler ENABLE ROW LEVEL SECURITY;
ALTER TABLE fahrstunden ENABLE ROW LEVEL SECURITY;
ALTER TABLE zahlungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokumente ENABLE ROW LEVEL SECURITY;
ALTER TABLE kommunikation ENABLE ROW LEVEL SECURITY;
ALTER TABLE pruefungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE fahrlehrer ENABLE ROW LEVEL SECURITY;
`;
