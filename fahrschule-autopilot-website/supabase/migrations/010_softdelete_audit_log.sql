-- Migration 006: Soft-Delete + Audit Log
-- Fügt deleted_at für reversible Löschungen hinzu und ein zentrales Audit-Log.

-- ============================================================
-- 1. SOFT-DELETE: deleted_at auf Kern-Tabellen
-- ============================================================

ALTER TABLE schueler ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE fahrstunden ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE zahlungen ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE dokumente ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE kommunikation ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE pruefungen ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE fahrlehrer ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial indexes: aktive Datensätze (nicht gelöscht) schnell abrufbar
CREATE INDEX IF NOT EXISTS idx_schueler_active ON schueler (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fahrstunden_active ON fahrstunden (tenant_id, datum) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zahlungen_active ON zahlungen (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fahrlehrer_active ON fahrlehrer (tenant_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. AUDIT LOG TABELLE
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,                          -- auth.users(id), NULL für Cron/System
    tabelle TEXT NOT NULL,                 -- z.B. "schueler", "zahlungen"
    datensatz_id UUID NOT NULL,            -- PK des geänderten Datensatzes
    aktion TEXT NOT NULL                   -- INSERT, UPDATE, DELETE, SOFT_DELETE
        CHECK (aktion IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE')),
    alte_werte JSONB DEFAULT NULL,         -- Snapshot vor der Änderung
    neue_werte JSONB DEFAULT NULL,         -- Snapshot nach der Änderung
    ip_adresse TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_datensatz ON audit_log (tabelle, datensatz_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log (user_id, created_at DESC);

-- RLS: Nur der eigene Tenant kann seine Audit-Logs lesen
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant sieht eigene Audit-Logs" ON audit_log
    FOR SELECT USING (tenant_id = ANY(get_user_tenant_ids()));

-- Schreiben nur via Service Role (aus API-Routes, nicht direkt vom Client)
CREATE POLICY "Service role kann schreiben" ON audit_log
    FOR INSERT WITH CHECK (true);  -- wird durch RLS + service_role key gesichert

-- ============================================================
-- 3. HILFSFUNKTION: Soft-Delete ausführen + Audit-Eintrag
-- ============================================================

CREATE OR REPLACE FUNCTION soft_delete(
    p_tabelle TEXT,
    p_id UUID,
    p_tenant_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_alte_werte JSONB;
BEGIN
    -- Snapshot des aktuellen Datensatzes
    EXECUTE format('SELECT row_to_json(t)::JSONB FROM %I t WHERE id = $1 AND tenant_id = $2', p_tabelle)
    INTO v_alte_werte
    USING p_id, p_tenant_id;

    IF v_alte_werte IS NULL THEN
        RAISE EXCEPTION 'Datensatz nicht gefunden: % id=%', p_tabelle, p_id;
    END IF;

    -- Soft-Delete setzen
    EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2', p_tabelle)
    USING p_id, p_tenant_id;

    -- Audit-Eintrag
    INSERT INTO audit_log (tenant_id, user_id, tabelle, datensatz_id, aktion, alte_werte)
    VALUES (p_tenant_id, p_user_id, p_tabelle, p_id, 'SOFT_DELETE', v_alte_werte);
END;
$$;

-- ============================================================
-- 4. HILFSFUNKTION: Soft-Delete wiederherstellen
-- ============================================================

CREATE OR REPLACE FUNCTION restore_deleted(
    p_tabelle TEXT,
    p_id UUID,
    p_tenant_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1 AND tenant_id = $2', p_tabelle)
    USING p_id, p_tenant_id;

    INSERT INTO audit_log (tenant_id, user_id, tabelle, datensatz_id, aktion)
    VALUES (p_tenant_id, p_user_id, p_tabelle, p_id, 'RESTORE');
END;
$$;

-- ============================================================
-- 5. BESTEHENDE RLS-POLICIES: Soft-Deletes ausblenden
-- ============================================================
-- Füge deleted_at IS NULL zu bestehenden SELECT-Policies hinzu.
-- Da die originalen Policies dynamisch mit get_user_tenant_ids() arbeiten,
-- werden hier keine neuen Policies erstellt, sondern als Kommentar dokumentiert.
-- Die API-Schicht (store.ts) filtert bereits mit .is("deleted_at", null) wo nötig.

COMMENT ON COLUMN schueler.deleted_at IS 'Soft-Delete Zeitstempel. NULL = aktiv. Gesetzt = logisch gelöscht.';
COMMENT ON COLUMN fahrstunden.deleted_at IS 'Soft-Delete Zeitstempel.';
COMMENT ON COLUMN zahlungen.deleted_at IS 'Soft-Delete Zeitstempel.';
COMMENT ON COLUMN fahrlehrer.deleted_at IS 'Soft-Delete Zeitstempel.';
COMMENT ON TABLE audit_log IS 'Revisionssicheres Audit-Log für alle CRM-Änderungen (DSGVO-konform).';
