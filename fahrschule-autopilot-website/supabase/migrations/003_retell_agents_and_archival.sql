-- ============================================================
-- Agent 2: Multi-Tenant Agent Mapping + DSGVO Archivierung
-- ============================================================

-- Retell Agent Mapping: Jede Fahrschule hat ihren eigenen Retell Agent
CREATE TABLE IF NOT EXISTS retell_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,               -- Retell Agent-ID
  agent_name TEXT DEFAULT 'Fahrschul-Assistent',
  phone_number TEXT,                     -- Zugewiesene Telefonnummer (+49...)
  voice_provider TEXT DEFAULT 'elevenlabs',
  voice_id TEXT,
  language TEXT DEFAULT 'de-DE',
  max_duration_seconds INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT true,
  prompt_version INTEGER DEFAULT 1,      -- Tracking welche Prompt-Version aktiv ist
  custom_prompt_overrides JSONB,         -- Fahrschul-spezifische Anpassungen
  metadata JSONB,                        -- Zusätzliche Config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, agent_id)
);

-- Index für schnelles Lookup: Agent-ID → Tenant
CREATE INDEX IF NOT EXISTS idx_retell_agents_agent_id ON retell_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_retell_agents_tenant ON retell_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_retell_agents_phone ON retell_agents(phone_number);

-- RLS
ALTER TABLE retell_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own retell_agents" ON retell_agents
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- Updated_at Trigger
CREATE TRIGGER retell_agents_updated_at
  BEFORE UPDATE ON retell_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DSGVO: Anrufe Archivierung & Auto-Löschung
-- ============================================================

-- Archiv-Tabelle für alte Anrufe (anonymisiert)
CREATE TABLE IF NOT EXISTS anrufe_archiv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  original_id UUID,                      -- Referenz zum ursprünglichen Anruf
  call_id TEXT,
  archiviert_am TIMESTAMPTZ DEFAULT NOW(),

  -- Anonymisierte Daten (Personendaten entfernt)
  dauer_sekunden INTEGER,
  intent TEXT,
  sentiment TEXT,
  fuehrerscheinklasse TEXT,
  is_new_lead BOOLEAN,
  monat TEXT,                            -- "2026-03" statt exaktem Datum

  -- Keine personenbezogenen Daten:
  -- KEIN anrufer_name, anrufer_telefon, anrufer_email
  -- KEIN recording_url (wird gelöscht)
  -- KEIN zusammenfassung (kann personenbezogen sein)
  -- KEIN anrufer_nummer

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anrufe_archiv_tenant ON anrufe_archiv(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anrufe_archiv_monat ON anrufe_archiv(tenant_id, monat);

ALTER TABLE anrufe_archiv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own anrufe_archiv" ON anrufe_archiv
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- ============================================================
-- Anrufe Tabelle: Zusätzliche Spalten für DSGVO
-- ============================================================

-- Recording-Consent Tracking
ALTER TABLE anrufe ADD COLUMN IF NOT EXISTS recording_consent TEXT
  DEFAULT 'unbekannt' CHECK (recording_consent IN ('ja', 'nein', 'unbekannt'));

-- Löschungs-Markierung
ALTER TABLE anrufe ADD COLUMN IF NOT EXISTS loeschung_geplant_am TIMESTAMPTZ;
ALTER TABLE anrufe ADD COLUMN IF NOT EXISTS archiviert BOOLEAN DEFAULT false;

-- Index für Archivierungs-Job
CREATE INDEX IF NOT EXISTS idx_anrufe_loeschung
  ON anrufe(loeschung_geplant_am)
  WHERE loeschung_geplant_am IS NOT NULL AND archiviert = false;

-- ============================================================
-- Funktion: Anrufe archivieren (DSGVO-konform)
-- ============================================================

-- Archiviert Anrufe die älter als X Tage sind
-- Behält anonymisierte Statistik-Daten, löscht Personendaten
CREATE OR REPLACE FUNCTION archiviere_alte_anrufe(
  tage_behalten INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
  archiviert_count INTEGER := 0;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (tage_behalten || ' days')::INTERVAL;

  -- 1. Anonymisierte Kopie in Archiv
  INSERT INTO anrufe_archiv (
    tenant_id, original_id, call_id, dauer_sekunden,
    intent, sentiment, fuehrerscheinklasse, is_new_lead, monat
  )
  SELECT
    tenant_id, id, call_id, dauer_sekunden,
    intent, sentiment, fuehrerscheinklasse, is_new_lead,
    TO_CHAR(created_at, 'YYYY-MM')
  FROM anrufe
  WHERE created_at < cutoff_date
    AND archiviert = false;

  GET DIAGNOSTICS archiviert_count = ROW_COUNT;

  -- 2. Original-Anrufe löschen (mit allen Personendaten)
  DELETE FROM anrufe
  WHERE created_at < cutoff_date
    AND archiviert = false;

  RETURN archiviert_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Funktion: Einzelnen Anruf auf Wunsch löschen (DSGVO Art. 17)
-- ============================================================

CREATE OR REPLACE FUNCTION loesche_anruf_dsgvo(
  p_anruf_id UUID,
  p_tenant_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Archivieren (anonymisiert)
  INSERT INTO anrufe_archiv (
    tenant_id, original_id, call_id, dauer_sekunden,
    intent, sentiment, fuehrerscheinklasse, is_new_lead, monat
  )
  SELECT
    tenant_id, id, call_id, dauer_sekunden,
    intent, sentiment, fuehrerscheinklasse, is_new_lead,
    TO_CHAR(created_at, 'YYYY-MM')
  FROM anrufe
  WHERE id = p_anruf_id AND tenant_id = p_tenant_id;

  -- Original löschen
  DELETE FROM anrufe
  WHERE id = p_anruf_id AND tenant_id = p_tenant_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Funktion: Recording-URL löschen (wenn kein Consent)
-- ============================================================

CREATE OR REPLACE FUNCTION loesche_recordings_ohne_consent()
RETURNS INTEGER AS $$
DECLARE
  geloescht INTEGER := 0;
BEGIN
  UPDATE anrufe
  SET recording_url = NULL
  WHERE recording_consent = 'nein'
    AND recording_url IS NOT NULL;

  GET DIAGNOSTICS geloescht = ROW_COUNT;
  RETURN geloescht;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Erweiterte RLS Policies für anrufe (granular)
-- ============================================================

-- Bestehende Policy droppen und neu erstellen (falls vorhanden)
DROP POLICY IF EXISTS "Users see own anrufe" ON anrufe;

-- SELECT: Tenant-User sehen ihre Anrufe
CREATE POLICY "anrufe_select" ON anrufe
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- INSERT: Nur über API (service_role) oder eigener Tenant
CREATE POLICY "anrufe_insert" ON anrufe
  FOR INSERT WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));

-- UPDATE: Eigene Anrufe aktualisieren (z.B. archivieren)
CREATE POLICY "anrufe_update" ON anrufe
  FOR UPDATE USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- DELETE: Eigene Anrufe löschen (DSGVO)
CREATE POLICY "anrufe_delete" ON anrufe
  FOR DELETE USING (tenant_id IN (SELECT get_user_tenant_ids()));
