-- ============================================================
-- Supabase Storage Bucket für Dokument-Uploads
-- Ausführen im SQL Editor NACH der Schema-Migration
-- ============================================================

-- Storage Bucket erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dokumente',
  'dokumente',
  false,
  10485760, -- 10 MB max
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Nur authentifizierte User mit passendem Tenant können hoch-/runterladen
CREATE POLICY "Tenant-eigene Dokumente lesen"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dokumente'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant-eigene Dokumente hochladen"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dokumente'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant-eigene Dokumente löschen"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dokumente'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM tenant_users WHERE user_id = auth.uid()
    )
  );
