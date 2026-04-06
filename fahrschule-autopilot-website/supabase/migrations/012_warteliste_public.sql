CREATE TABLE IF NOT EXISTS warteliste_public (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vorname TEXT NOT NULL,
    nachname TEXT NOT NULL,
    email TEXT NOT NULL,
    telefon TEXT NOT NULL,
    fuehrerscheinklasse TEXT NOT NULL DEFAULT 'B',
    status TEXT NOT NULL DEFAULT 'wartend' CHECK (status IN ('wartend', 'kontaktiert', 'angemeldet', 'abgesagt')),
    notizen TEXT,
    dsgvo_einwilligung BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_warteliste_public_tenant ON warteliste_public (tenant_id, status);
ALTER TABLE warteliste_public ENABLE ROW LEVEL SECURITY;
