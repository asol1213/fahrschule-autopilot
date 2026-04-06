CREATE TABLE IF NOT EXISTS vertraege (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    schueler_id UUID NOT NULL,
    vertragstyp TEXT NOT NULL DEFAULT 'ausbildungsvertrag' CHECK (vertragstyp IN ('ausbildungsvertrag', 'dsgvo_einwilligung')),
    status TEXT NOT NULL DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'gesendet', 'unterschrieben')),
    vertragsdaten JSONB DEFAULT '{}',
    unterschrift_url TEXT,
    unterschrieben_am TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vertraege_tenant ON vertraege (tenant_id, schueler_id) WHERE status != 'entwurf';

ALTER TABLE vertraege ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant sieht eigene Verträge" ON vertraege FOR ALL USING (tenant_id = ANY(get_user_tenant_ids()));
