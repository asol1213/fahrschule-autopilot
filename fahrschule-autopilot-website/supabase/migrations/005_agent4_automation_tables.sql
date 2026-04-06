-- ============================================================
-- Agent 4: WhatsApp & Kommunikation — Zusaetzliche Tabellen
-- Migration 005
-- ============================================================

-- Automation-Log: Einheitliches Log fuer alle automatischen Nachrichten
CREATE TABLE IF NOT EXISTS automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID REFERENCES schueler(id) ON DELETE SET NULL,
  telefon TEXT NOT NULL,
  typ TEXT NOT NULL,
  -- typ: termin_24h, termin_2h, zahlung_stufe1, zahlung_stufe2, zahlung_stufe3,
  --      onboarding_willkommen, onboarding_followup_tag3, onboarding_followup_tag7,
  --      onboarding_followup_tag14, theorie_reminder, dokumente_reminder,
  --      pruefung_bestaetigung, glueckwuensche, empfehlung, feedback_anfrage,
  --      warteliste_angebot, fahrlehrer_zuweisung, opt_out, opt_in
  kanal TEXT NOT NULL DEFAULT 'whatsapp' CHECK (kanal IN ('whatsapp', 'email', 'sms')),
  status TEXT NOT NULL DEFAULT 'gesendet' CHECK (status IN ('gesendet', 'zugestellt', 'gelesen', 'fehler')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warteliste
CREATE TABLE IF NOT EXISTS warteliste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID REFERENCES schueler(id) ON DELETE SET NULL,
  schueler_name TEXT NOT NULL,
  telefon TEXT NOT NULL,
  wunsch_tage TEXT,
  wunsch_zeiten TEXT,
  fahrlehrer_id UUID REFERENCES fahrlehrer(id),
  prioritaet INTEGER DEFAULT 5 CHECK (prioritaet >= 1 AND prioritaet <= 10),
  status TEXT NOT NULL DEFAULT 'wartend'
    CHECK (status IN ('wartend', 'angeboten', 'gebucht', 'abgelehnt', 'abgelaufen')),
  angeboten_am TIMESTAMPTZ,
  angebot_ablauf TIMESTAMPTZ,
  slot_datum DATE,
  slot_zeit TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beschwerden
CREATE TABLE IF NOT EXISTS beschwerden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID REFERENCES schueler(id) ON DELETE SET NULL,
  telefon TEXT NOT NULL,
  nachricht TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offen'
    CHECK (status IN ('offen', 'in_bearbeitung', 'erledigt')),
  eskaliert_an TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verschiebungen
CREATE TABLE IF NOT EXISTS verschiebungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID REFERENCES schueler(id) ON DELETE SET NULL,
  telefon TEXT NOT NULL,
  nachricht TEXT NOT NULL,
  original_termin_id UUID REFERENCES fahrstunden(id),
  status TEXT NOT NULL DEFAULT 'offen'
    CHECK (status IN ('offen', 'umgebucht', 'abgelehnt')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buchungsanfragen (Online-Terminbuchung bevor sie bestaetigt wird)
CREATE TABLE IF NOT EXISTS buchungsanfragen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  buchungs_nr TEXT UNIQUE NOT NULL,
  schueler_name TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT,
  wunsch_datum DATE,
  wunsch_zeit TIME,
  art TEXT DEFAULT 'Fahrstunde',
  fahrlehrer_wunsch TEXT,
  fuehrerscheinklasse TEXT DEFAULT 'B',
  nachricht TEXT,
  status TEXT NOT NULL DEFAULT 'neu'
    CHECK (status IN ('neu', 'bestaetigt', 'alternativ', 'abgelehnt', 'storniert')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Felder zu schueler hinzufuegen die fuer WA-Automation noetig sind
ALTER TABLE schueler ADD COLUMN IF NOT EXISTS wa_opt_out BOOLEAN DEFAULT false;
ALTER TABLE schueler ADD COLUMN IF NOT EXISTS wa_opt_out_datum TIMESTAMPTZ;
ALTER TABLE schueler ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'ausstehend'
  CHECK (onboarding_status IN ('ausstehend', 'gestartet', 'dokumente_fehlend', 'abgeschlossen'));
ALTER TABLE schueler ADD COLUMN IF NOT EXISTS letzte_theorie_aktivitaet TIMESTAMPTZ;
ALTER TABLE schueler ADD COLUMN IF NOT EXISTS feedback_status TEXT
  CHECK (feedback_status IN ('offen', 'gefragt', 'erhalten', 'google_gesendet'));

-- Feld zu zahlungen hinzufuegen
ALTER TABLE zahlungen ADD COLUMN IF NOT EXISTS letzte_mahnung_am TIMESTAMPTZ;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_automation_log_tenant ON automation_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_log_telefon ON automation_log(telefon);
CREATE INDEX IF NOT EXISTS idx_automation_log_typ ON automation_log(tenant_id, typ);
CREATE INDEX IF NOT EXISTS idx_automation_log_created ON automation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_warteliste_tenant ON warteliste(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warteliste_status ON warteliste(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_beschwerden_tenant ON beschwerden(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_buchungsanfragen_tenant ON buchungsanfragen(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_schueler_wa_opt_out ON schueler(tenant_id, wa_opt_out);
CREATE INDEX IF NOT EXISTS idx_schueler_onboarding ON schueler(tenant_id, onboarding_status);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE warteliste ENABLE ROW LEVEL SECURITY;
ALTER TABLE beschwerden ENABLE ROW LEVEL SECURITY;
ALTER TABLE verschiebungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE buchungsanfragen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own automation_log" ON automation_log
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own warteliste" ON warteliste
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own beschwerden" ON beschwerden
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own verschiebungen" ON verschiebungen
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own buchungsanfragen" ON buchungsanfragen
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- Service-Role Bypass (fuer n8n Workflows die mit service_role key arbeiten)
-- Wird benoetigt weil n8n nicht als authentifizierter User agiert
CREATE POLICY "Service role full access automation_log" ON automation_log
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access warteliste" ON warteliste
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access beschwerden" ON beschwerden
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access verschiebungen" ON verschiebungen
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access buchungsanfragen" ON buchungsanfragen
  FOR ALL USING (true) WITH CHECK (true);

-- Updated_at Triggers
CREATE TRIGGER warteliste_updated_at
  BEFORE UPDATE ON warteliste
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
