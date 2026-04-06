-- ============================================================
-- Fahrschule Autopilot CRM Schema
-- Agent 5: CRM & Admin Agent
-- ============================================================

-- Tenant-User Mapping (connects Supabase Auth to tenant)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'premium')),
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'inhaber' CHECK (role IN ('inhaber', 'fahrlehrer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Fahrlehrer
CREATE TABLE IF NOT EXISTS fahrlehrer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT,
  fuehrerscheinklassen TEXT[] DEFAULT ARRAY['B'],
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schueler
CREATE TABLE IF NOT EXISTS schueler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  status TEXT NOT NULL DEFAULT 'angemeldet'
    CHECK (status IN ('angemeldet','dokumente_ausstehend','theorie','praxis','pruefung','bestanden','abgebrochen')),
  fahrlehrer_id UUID REFERENCES fahrlehrer(id),
  anmeldungs_datum DATE DEFAULT CURRENT_DATE,
  notizen TEXT,
  -- DSGVO
  whatsapp_einwilligung BOOLEAN DEFAULT false,
  email_einwilligung BOOLEAN DEFAULT false,
  dsgvo_einwilligung BOOLEAN DEFAULT false,
  dsgvo_einwilligung_datum TIMESTAMPTZ,
  ausbildung_beendet_am DATE,
  loeschung_geplant_am DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fahrstunden
CREATE TABLE IF NOT EXISTS fahrstunden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  fahrlehrer_id UUID REFERENCES fahrlehrer(id),
  datum DATE NOT NULL,
  uhrzeit TIME NOT NULL,
  dauer INTEGER NOT NULL DEFAULT 45,
  typ TEXT NOT NULL DEFAULT 'normal'
    CHECK (typ IN ('normal','sonderfahrt_ueberlandfahrt','sonderfahrt_autobahnfahrt','sonderfahrt_nachtfahrt','pruefungsvorbereitung')),
  bewertung INTEGER CHECK (bewertung >= 1 AND bewertung <= 5),
  notizen TEXT,
  status TEXT NOT NULL DEFAULT 'geplant'
    CHECK (status IN ('geplant','abgeschlossen','abgesagt','no_show','warteliste')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zahlungen
CREATE TABLE IF NOT EXISTS zahlungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  betrag DECIMAL(10,2) NOT NULL,
  beschreibung TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offen'
    CHECK (status IN ('offen','teilbezahlt','bezahlt','ueberfaellig','storniert')),
  faellig_am DATE NOT NULL,
  bezahlt_am DATE,
  mahnungs_stufe INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dokumente
CREATE TABLE IF NOT EXISTS dokumente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  typ TEXT NOT NULL
    CHECK (typ IN ('sehtest','erste_hilfe','passfoto','ausweis','fuehrerschein_antrag','sonstiges')),
  dateiname TEXT,
  datei_url TEXT,
  upload_datum TIMESTAMPTZ,
  ablauf_datum DATE,
  vorhanden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kommunikation
CREATE TABLE IF NOT EXISTS kommunikation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  kanal TEXT NOT NULL CHECK (kanal IN ('whatsapp','email','telefon','website','sms')),
  richtung TEXT NOT NULL CHECK (richtung IN ('eingehend','ausgehend')),
  betreff TEXT,
  inhalt TEXT NOT NULL,
  datum TIMESTAMPTZ DEFAULT NOW()
);

-- Pruefungen
CREATE TABLE IF NOT EXISTS pruefungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
  typ TEXT NOT NULL CHECK (typ IN ('theorie','praxis')),
  datum DATE NOT NULL,
  ergebnis TEXT CHECK (ergebnis IN ('bestanden','nicht_bestanden')),
  fehlerpunkte INTEGER,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schueler_tenant ON schueler(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schueler_status ON schueler(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fahrstunden_schueler ON fahrstunden(schueler_id);
CREATE INDEX IF NOT EXISTS idx_fahrstunden_datum ON fahrstunden(tenant_id, datum);
CREATE INDEX IF NOT EXISTS idx_fahrstunden_fahrlehrer ON fahrstunden(fahrlehrer_id, datum);
CREATE INDEX IF NOT EXISTS idx_zahlungen_schueler ON zahlungen(schueler_id);
CREATE INDEX IF NOT EXISTS idx_zahlungen_status ON zahlungen(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dokumente_schueler ON dokumente(schueler_id);
CREATE INDEX IF NOT EXISTS idx_pruefungen_schueler ON pruefungen(schueler_id);
CREATE INDEX IF NOT EXISTS idx_kommunikation_schueler ON kommunikation(schueler_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fahrlehrer ENABLE ROW LEVEL SECURITY;
ALTER TABLE schueler ENABLE ROW LEVEL SECURITY;
ALTER TABLE fahrstunden ENABLE ROW LEVEL SECURITY;
ALTER TABLE zahlungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokumente ENABLE ROW LEVEL SECURITY;
ALTER TABLE kommunikation ENABLE ROW LEVEL SECURITY;
ALTER TABLE pruefungen ENABLE ROW LEVEL SECURITY;

-- Helper function: get tenant_ids for current user
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
$$;

-- RLS Policies
CREATE POLICY "Users see own tenants" ON tenants
  FOR ALL USING (id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own tenant_users" ON tenant_users
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users see own fahrlehrer" ON fahrlehrer
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own schueler" ON schueler
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own fahrstunden" ON fahrstunden
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own zahlungen" ON zahlungen
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own dokumente" ON dokumente
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own kommunikation" ON kommunikation
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own pruefungen" ON pruefungen
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schueler_updated_at
  BEFORE UPDATE ON schueler
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
