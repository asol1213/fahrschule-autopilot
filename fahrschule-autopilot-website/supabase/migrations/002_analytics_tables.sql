-- ============================================================
-- Agent 7: Analytics & Sales — Zusätzliche Tabellen
-- ============================================================

-- Telefon-Anrufe (von Retell.ai Webhook)
CREATE TABLE IF NOT EXISTS anrufe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id TEXT NOT NULL,
  anrufer_nummer TEXT,
  dauer_sekunden INTEGER DEFAULT 0,
  zusammenfassung TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'unknown')),
  intent TEXT CHECK (intent IN ('anmeldung', 'termin', 'preisanfrage', 'information', 'beschwerde', 'sonstiges')),
  anrufer_name TEXT,
  anrufer_email TEXT,
  anrufer_telefon TEXT,
  fuehrerscheinklasse TEXT,
  is_new_lead BOOLEAN DEFAULT false,
  needs_follow_up BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Theorie-Trainer Events (serverseitiges Tracking)
CREATE TABLE IF NOT EXISTS theorie_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- anonyme ID oder Schüler-ID
  event_type TEXT NOT NULL CHECK (event_type IN ('question_answered', 'quiz_completed', 'session_started', 'ai_tutor_used')),
  kategorie TEXT,
  richtig BOOLEAN,
  fehlerpunkte INTEGER,
  dauer_sekunden INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo-Besuche (Conversion Tracking)
CREATE TABLE IF NOT EXISTS demo_besuche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'premium')),
  visitor_id TEXT NOT NULL, -- anonyme Cookie-ID
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  seiten_aufrufe INTEGER DEFAULT 1,
  verweildauer_sekunden INTEGER DEFAULT 0,
  hat_cta_geklickt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Leads (Fahrschulen als potenzielle Kunden)
CREATE TABLE IF NOT EXISTS sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fahrschul_name TEXT NOT NULL,
  inhaber TEXT,
  stadt TEXT NOT NULL,
  bundesland TEXT,
  telefon TEXT,
  email TEXT,
  website TEXT,
  google_bewertung DECIMAL(2,1),
  google_bewertungen_anzahl INTEGER,
  status TEXT NOT NULL DEFAULT 'neu' CHECK (status IN ('neu', 'kontaktiert', 'interessiert', 'demo_gebucht', 'demo_gehalten', 'angebot', 'gewonnen', 'verloren', 'kein_interesse')),
  notizen TEXT,
  naechste_aktion TEXT,
  naechste_aktion_am DATE,
  quelle TEXT DEFAULT 'recherche',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-Up Sequenzen
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES sales_leads(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  typ TEXT NOT NULL CHECK (typ IN ('demo_follow_up', 'onboarding_check', 'churn_prevention', 'upselling', 'bewertung')),
  stufe INTEGER NOT NULL DEFAULT 1, -- 1, 2, 3...
  geplant_am TIMESTAMPTZ NOT NULL,
  gesendet_am TIMESTAMPTZ,
  kanal TEXT DEFAULT 'email' CHECK (kanal IN ('email', 'whatsapp', 'telefon')),
  betreff TEXT,
  inhalt TEXT,
  status TEXT NOT NULL DEFAULT 'geplant' CHECK (status IN ('geplant', 'gesendet', 'beantwortet', 'abgebrochen')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anrufe_tenant ON anrufe(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anrufe_created ON anrufe(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_anrufe_intent ON anrufe(tenant_id, intent);
CREATE INDEX IF NOT EXISTS idx_theorie_events_tenant ON theorie_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_theorie_events_type ON theorie_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_demo_besuche_plan ON demo_besuche(plan);
CREATE INDEX IF NOT EXISTS idx_demo_besuche_created ON demo_besuche(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_stadt ON sales_leads(stadt);
CREATE INDEX IF NOT EXISTS idx_follow_ups_geplant ON follow_ups(geplant_am, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id);

-- RLS
ALTER TABLE anrufe ENABLE ROW LEVEL SECURITY;
ALTER TABLE theorie_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_besuche ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Policies (anrufe + theorie_events: tenant-basiert)
CREATE POLICY "Users see own anrufe" ON anrufe
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Users see own theorie_events" ON theorie_events
  FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- Demo/Sales: nur Admin (service_role)
CREATE POLICY "Admin sees all demo_besuche" ON demo_besuche
  FOR ALL USING (true);

CREATE POLICY "Admin sees all sales_leads" ON sales_leads
  FOR ALL USING (true);

CREATE POLICY "Admin sees all follow_ups" ON follow_ups
  FOR ALL USING (true);

-- Updated_at trigger für sales_leads
CREATE TRIGGER sales_leads_updated_at
  BEFORE UPDATE ON sales_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
