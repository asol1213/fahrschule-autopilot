-- Migration 008: Theorie-Trainer Fortschritts-Persistierung
-- Speichert den Lernfortschritt jedes Schülers serversseitig,
-- damit er geräteübergreifend verfügbar ist.

CREATE TABLE IF NOT EXISTS public.theorie_progress (
  id             uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp             integer       NOT NULL DEFAULT 0,
  best_streak    integer       NOT NULL DEFAULT 0,
  total_correct  integer       NOT NULL DEFAULT 0,
  total_wrong    integer       NOT NULL DEFAULT 0,
  exams_passed   integer       NOT NULL DEFAULT 0,
  exams_failed   integer       NOT NULL DEFAULT 0,
  daily_goal     integer       NOT NULL DEFAULT 20,
  daily_done     integer       NOT NULL DEFAULT 0,
  daily_date     date          NOT NULL DEFAULT CURRENT_DATE,
  questions      jsonb         NOT NULL DEFAULT '{}',
  updated_at     timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT theorie_progress_user_unique UNIQUE (user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS theorie_progress_user_id_idx ON public.theorie_progress (user_id);

-- Row-Level Security: each user sees only their own row
ALTER TABLE public.theorie_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own theorie progress"
  ON public.theorie_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own theorie progress"
  ON public.theorie_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own theorie progress"
  ON public.theorie_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Automatically update updated_at on every change
CREATE OR REPLACE FUNCTION public.set_theorie_progress_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER theorie_progress_updated_at
  BEFORE UPDATE ON public.theorie_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_theorie_progress_updated_at();
