CREATE TABLE IF NOT EXISTS fahrzeuge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kennzeichen TEXT NOT NULL,
    marke TEXT NOT NULL,
    modell TEXT NOT NULL,
    baujahr INTEGER NOT NULL,
    fuehrerscheinklasse TEXT NOT NULL DEFAULT 'B',
    tuev_bis DATE NOT NULL,
    kilometerstand INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'werkstatt', 'ausgemustert')),
    notizen TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fahrzeuge_tenant ON fahrzeuge (tenant_id) WHERE deleted_at IS NULL;
ALTER TABLE fahrzeuge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant sieht eigene Fahrzeuge" ON fahrzeuge FOR ALL USING (tenant_id = ANY(get_user_tenant_ids()));
