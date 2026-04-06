-- ============================================================
-- Migration 007: Agent 2 Telefon-Assistent Fixes
-- - Index auf call_id für schnelle Lookups
-- - Intent-Werte erweitern (umschreibung, auffrischung)
-- - DSGVO Audit-Log Tabelle
-- ============================================================

-- 1. Index auf call_id (fehlte — verursacht Full-Table-Scans)
CREATE INDEX IF NOT EXISTS idx_anrufe_call_id ON anrufe(call_id);

-- 2. Intent CHECK Constraint erweitern
-- Alte Constraint droppen (falls vorhanden) und neu erstellen
ALTER TABLE anrufe DROP CONSTRAINT IF EXISTS anrufe_intent_check;
ALTER TABLE anrufe ADD CONSTRAINT anrufe_intent_check
  CHECK (intent IS NULL OR intent IN (
    'anmeldung', 'termin', 'preisanfrage', 'information',
    'beschwerde', 'umschreibung', 'auffrischung', 'sonstiges'
  ));

-- 3. DSGVO Audit-Log: Protokolliert alle Lösch-/Archivierungsaktionen
CREATE TABLE IF NOT EXISTS dsgvo_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  aktion TEXT NOT NULL,           -- 'archivierung', 'einzelloeschung', 'recording_loeschung'
  betroffene_anrufe INTEGER DEFAULT 0,
  details JSONB,                  -- Zusätzliche Infos (IDs, Parameter)
  ausgefuehrt_von TEXT,           -- 'cron', 'api', 'manuell'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsgvo_audit_tenant ON dsgvo_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dsgvo_audit_created ON dsgvo_audit_log(created_at);

ALTER TABLE dsgvo_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own dsgvo_audit_log" ON dsgvo_audit_log
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));
