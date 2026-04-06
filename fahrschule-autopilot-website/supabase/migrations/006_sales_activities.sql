-- ============================================================
-- Agent 7 Optimization: Sales Funnel Tracking
-- ============================================================

-- Sales Activities (trackt jeden Touchpoint im Sales-Funnel)
CREATE TABLE IF NOT EXISTS sales_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  stufe TEXT NOT NULL CHECK (stufe IN (
    'outreach', 'antwort', 'discovery_call', 'demo', 'angebot', 'kunde', 'verloren'
  )),
  kanal TEXT CHECK (kanal IN ('email', 'telefon', 'whatsapp', 'website', 'persoenlich')),
  notizen TEXT,
  erstellt_von TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_activities_lead ON sales_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_stufe ON sales_activities(stufe);
CREATE INDEX IF NOT EXISTS idx_sales_activities_created ON sales_activities(created_at);

ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin sees all sales_activities" ON sales_activities FOR ALL USING (true);

-- ============================================================
-- NPS Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schueler_id UUID REFERENCES schueler(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  kommentar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nps_tenant ON nps_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nps_created ON nps_responses(tenant_id, created_at);

ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own nps" ON nps_responses
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));
