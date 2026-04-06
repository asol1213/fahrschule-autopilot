-- ==============================================================
-- Migration 004: Testimonials-Tabelle
-- Ersetzt die Filesystem-basierte Lösung durch Supabase-Persistenz
-- ==============================================================

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stadt TEXT DEFAULT '',
  rolle TEXT DEFAULT 'Fahrschulkunde',
  text TEXT NOT NULL,
  sterne INT NOT NULL CHECK (sterne >= 1 AND sterne <= 5),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index für öffentliche Abfrage (approved + sorted)
CREATE INDEX idx_testimonials_approved ON testimonials(approved, created_at DESC);

-- RLS: Öffentlich lesbar (nur genehmigte), Insert für alle, Update/Delete nur via Service Role
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Genehmigte Testimonials sind öffentlich lesbar"
  ON testimonials FOR SELECT
  USING (approved = true);

CREATE POLICY "Jeder kann Testimonial einreichen"
  ON testimonials FOR INSERT
  WITH CHECK (approved = false);
