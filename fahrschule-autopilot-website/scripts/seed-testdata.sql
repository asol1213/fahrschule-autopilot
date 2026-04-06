-- ============================================================
-- Agent 7: Testdaten für alle Dashboards
-- Einfach in Supabase SQL Editor einfügen und ausführen.
-- Erzeugt eine realistische Fahrschule mit 25 Schülern.
-- ============================================================

-- 1. Tenant erstellen
INSERT INTO tenants (id, slug, name, plan) VALUES
  ('11111111-1111-1111-1111-111111111111', 'fahrschule-test', 'Fahrschule Testmeister', 'premium')
ON CONFLICT (id) DO NOTHING;

-- 2. Fahrlehrer
INSERT INTO fahrlehrer (id, tenant_id, vorname, nachname, telefon, email, fuehrerscheinklassen) VALUES
  ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Klaus', 'Wagner', '+49 911 1234567', 'klaus@test.de', ARRAY['B', 'BE']),
  ('aaaa0002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sabine', 'Fischer', '+49 911 2345678', 'sabine@test.de', ARRAY['B', 'A'])
ON CONFLICT (id) DO NOTHING;

-- 3. Schüler (25 Stück, verschiedene Status)
INSERT INTO schueler (id, tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, anmeldungs_datum, ort) VALUES
  ('bbbb0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Max', 'Müller', 'max@test.de', '+49 151 1111111', '2005-03-15', 'B', 'praxis', 'aaaa0001-0000-0000-0000-000000000001', '2026-01-10', 'Nürnberg'),
  ('bbbb0002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Lisa', 'Schmidt', 'lisa@test.de', '+49 151 2222222', '2004-07-22', 'B', 'theorie', 'aaaa0001-0000-0000-0000-000000000001', '2026-02-01', 'Nürnberg'),
  ('bbbb0003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Tim', 'Weber', 'tim@test.de', '+49 151 3333333', '2005-11-08', 'B', 'pruefung', 'aaaa0002-0000-0000-0000-000000000002', '2025-11-15', 'Fürth'),
  ('bbbb0004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Anna', 'Koch', 'anna@test.de', '+49 151 4444444', '2004-01-30', 'B', 'bestanden', 'aaaa0001-0000-0000-0000-000000000001', '2025-09-01', 'Nürnberg'),
  ('bbbb0005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Paul', 'Bauer', 'paul@test.de', '+49 151 5555555', '2005-06-12', 'B', 'angemeldet', NULL, '2026-03-20', 'Erlangen'),
  ('bbbb0006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Sophie', 'Klein', 'sophie@test.de', '+49 151 6666666', '2004-09-05', 'B', 'praxis', 'aaaa0002-0000-0000-0000-000000000002', '2025-12-01', 'Nürnberg'),
  ('bbbb0007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Felix', 'Wolf', 'felix@test.de', '+49 151 7777777', '2005-04-18', 'B', 'dokumente_ausstehend', NULL, '2026-03-15', 'Fürth'),
  ('bbbb0008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Marie', 'Schäfer', 'marie@test.de', '+49 151 8888888', '2004-12-25', 'A', 'theorie', 'aaaa0002-0000-0000-0000-000000000002', '2026-01-20', 'Nürnberg'),
  ('bbbb0009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Leon', 'Neumann', 'leon@test.de', '+49 151 9999999', '2005-08-03', 'B', 'praxis', 'aaaa0001-0000-0000-0000-000000000001', '2025-10-15', 'Erlangen'),
  ('bbbb0010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Emma', 'Schwarz', 'emma@test.de', '+49 152 1111111', '2004-05-20', 'B', 'bestanden', 'aaaa0001-0000-0000-0000-000000000001', '2025-07-01', 'Nürnberg'),
  ('bbbb0011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Jonas', 'Braun', 'jonas@test.de', '+49 152 2222222', '2005-02-14', 'B', 'pruefung', 'aaaa0002-0000-0000-0000-000000000002', '2025-11-01', 'Fürth'),
  ('bbbb0012-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Lena', 'Richter', 'lena@test.de', '+49 152 3333333', '2004-10-10', 'B', 'praxis', 'aaaa0001-0000-0000-0000-000000000001', '2025-12-15', 'Nürnberg'),
  ('bbbb0013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Lukas', 'Zimmermann', 'lukas@test.de', '+49 152 4444444', '2005-07-28', 'BE', 'theorie', 'aaaa0001-0000-0000-0000-000000000001', '2026-02-10', 'Erlangen'),
  ('bbbb0014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'Mia', 'Krüger', 'mia@test.de', '+49 152 5555555', '2004-03-08', 'B', 'angemeldet', NULL, '2026-03-25', 'Nürnberg'),
  ('bbbb0015-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'David', 'Hartmann', 'david@test.de', '+49 152 6666666', '2005-01-22', 'B', 'praxis', 'aaaa0002-0000-0000-0000-000000000002', '2025-11-20', 'Fürth'),
  ('bbbb0016-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'Laura', 'Werner', 'laura@test.de', '+49 152 7777777', '2004-08-15', 'B', 'bestanden', 'aaaa0002-0000-0000-0000-000000000002', '2025-06-01', 'Nürnberg'),
  ('bbbb0017-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'Noah', 'Meier', 'noah@test.de', '+49 152 8888888', '2005-09-30', 'B', 'dokumente_ausstehend', NULL, '2026-03-10', 'Erlangen'),
  ('bbbb0018-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'Hannah', 'Schulz', 'hannah@test.de', '+49 152 9999999', '2004-11-12', 'B', 'theorie', 'aaaa0001-0000-0000-0000-000000000001', '2026-01-05', 'Nürnberg'),
  ('bbbb0019-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'Elias', 'Lang', 'elias@test.de', '+49 153 1111111', '2005-05-05', 'B', 'praxis', 'aaaa0001-0000-0000-0000-000000000001', '2025-10-01', 'Fürth'),
  ('bbbb0020-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'Sophia', 'Hoffmann', 'sophia@test.de', '+49 153 2222222', '2004-04-25', 'B', 'bestanden', 'aaaa0002-0000-0000-0000-000000000002', '2025-05-15', 'Nürnberg'),
  ('bbbb0021-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'Ben', 'Schröder', 'ben@test.de', '+49 153 3333333', '2005-12-01', 'B', 'angemeldet', NULL, '2026-03-28', 'Nürnberg'),
  ('bbbb0022-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', 'Clara', 'König', 'clara@test.de', '+49 153 4444444', '2004-06-18', 'A', 'theorie', 'aaaa0002-0000-0000-0000-000000000002', '2026-02-20', 'Erlangen'),
  ('bbbb0023-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', 'Jan', 'Huber', 'jan@test.de', '+49 153 5555555', '2005-10-10', 'B', 'abgebrochen', NULL, '2025-08-01', 'Fürth'),
  ('bbbb0024-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111', 'Emilia', 'Peters', 'emilia@test.de', '+49 153 6666666', '2004-02-28', 'B', 'praxis', 'aaaa0001-0000-0000-0000-000000000001', '2025-12-20', 'Nürnberg'),
  ('bbbb0025-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', 'Finn', 'Möller', 'finn@test.de', '+49 153 7777777', '2005-07-07', 'B', 'pruefung', 'aaaa0002-0000-0000-0000-000000000002', '2025-10-20', 'Nürnberg')
ON CONFLICT (id) DO NOTHING;

-- 4. Fahrstunden (60 Stück, verschiedene Status + Zeiträume)
INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status, bewertung) VALUES
  -- Vergangene Woche
  ('11111111-1111-1111-1111-111111111111', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 7, '09:00', 90, 'normal', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0006-0000-0000-0000-000000000006', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 7, '10:30', 90, 'normal', 'abgeschlossen', 3),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0009-0000-0000-0000-000000000009', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 7, '14:00', 45, 'normal', 'no_show', NULL),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0012-0000-0000-0000-000000000012', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 6, '09:00', 90, 'sonderfahrt_autobahnfahrt', 'abgeschlossen', 5),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0015-0000-0000-0000-000000000015', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 6, '11:00', 45, 'normal', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0019-0000-0000-0000-000000000019', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 5, '08:00', 90, 'sonderfahrt_ueberlandfahrt', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0024-0000-0000-0000-000000000024', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 5, '14:00', 45, 'normal', 'abgesagt', NULL),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 4, '09:00', 90, 'normal', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0006-0000-0000-0000-000000000006', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 3, '10:00', 45, 'normal', 'abgeschlossen', 3),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0015-0000-0000-0000-000000000015', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 3, '14:00', 45, 'normal', 'no_show', NULL),
  -- Diese Woche
  ('11111111-1111-1111-1111-111111111111', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 2, '09:00', 90, 'pruefungsvorbereitung', 'abgeschlossen', 5),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0009-0000-0000-0000-000000000009', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 2, '11:00', 90, 'sonderfahrt_nachtfahrt', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0012-0000-0000-0000-000000000012', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 1, '09:00', 45, 'normal', 'abgeschlossen', 3),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0024-0000-0000-0000-000000000024', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 1, '14:00', 90, 'normal', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0019-0000-0000-0000-000000000019', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE, '09:00', 90, 'normal', 'geplant', NULL),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0006-0000-0000-0000-000000000006', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE, '11:00', 45, 'normal', 'geplant', NULL),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE + 1, '09:00', 90, 'pruefungsvorbereitung', 'geplant', NULL),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0015-0000-0000-0000-000000000015', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE + 2, '10:00', 45, 'normal', 'geplant', NULL),
  -- Ältere Wochen (für Trend-Charts)
  ('11111111-1111-1111-1111-111111111111', 'bbbb0004-0000-0000-0000-000000000004', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 14, '09:00', 90, 'pruefungsvorbereitung', 'abgeschlossen', 5),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0010-0000-0000-0000-000000000010', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 14, '14:00', 45, 'normal', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0016-0000-0000-0000-000000000016', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 14, '11:00', 90, 'sonderfahrt_autobahnfahrt', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0020-0000-0000-0000-000000000020', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 13, '09:00', 45, 'normal', 'no_show', NULL),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 21, '09:00', 90, 'normal', 'abgeschlossen', 3),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0006-0000-0000-0000-000000000006', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 21, '11:00', 45, 'normal', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0009-0000-0000-0000-000000000009', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 20, '14:00', 90, 'normal', 'no_show', NULL),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0012-0000-0000-0000-000000000012', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 28, '09:00', 45, 'normal', 'abgeschlossen', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0015-0000-0000-0000-000000000015', 'aaaa0002-0000-0000-0000-000000000002', CURRENT_DATE - 28, '11:00', 90, 'sonderfahrt_nachtfahrt', 'abgeschlossen', 5),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0019-0000-0000-0000-000000000019', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 35, '09:00', 45, 'normal', 'abgeschlossen', 3),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0024-0000-0000-0000-000000000024', 'aaaa0001-0000-0000-0000-000000000001', CURRENT_DATE - 35, '14:00', 90, 'normal', 'abgesagt', NULL);

-- 5. Zahlungen (verschiedene Status)
INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, bezahlt_am, mahnungs_stufe) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bbbb0001-0000-0000-0000-000000000001', 350.00, 'Grundgebühr', 'bezahlt', '2026-02-01', '2026-01-28', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0001-0000-0000-0000-000000000001', 455.00, 'Fahrstunden (10x)', 'bezahlt', '2026-03-01', '2026-02-25', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0002-0000-0000-0000-000000000002', 350.00, 'Grundgebühr', 'bezahlt', '2026-03-01', '2026-02-28', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0003-0000-0000-0000-000000000003', 350.00, 'Grundgebühr', 'bezahlt', '2025-12-15', '2025-12-10', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0003-0000-0000-0000-000000000003', 637.50, 'Fahrstunden (14x)', 'offen', '2026-03-15', NULL, 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0005-0000-0000-0000-000000000005', 350.00, 'Grundgebühr', 'offen', '2026-04-01', NULL, 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0006-0000-0000-0000-000000000006', 350.00, 'Grundgebühr', 'bezahlt', '2026-01-01', '2025-12-28', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0006-0000-0000-0000-000000000006', 273.00, 'Fahrstunden (6x)', 'ueberfaellig', '2026-03-01', NULL, 2),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0009-0000-0000-0000-000000000009', 350.00, 'Grundgebühr', 'bezahlt', '2025-11-15', '2025-11-10', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0009-0000-0000-0000-000000000009', 819.00, 'Fahrstunden (18x)', 'ueberfaellig', '2026-02-15', NULL, 3),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0004-0000-0000-0000-000000000004', 2150.00, 'Komplettpaket', 'bezahlt', '2025-10-01', '2025-09-28', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0010-0000-0000-0000-000000000010', 1980.00, 'Komplettpaket', 'bezahlt', '2025-08-01', '2025-07-30', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0012-0000-0000-0000-000000000012', 350.00, 'Grundgebühr', 'bezahlt', '2026-01-15', '2026-01-12', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0015-0000-0000-0000-000000000015', 350.00, 'Grundgebühr', 'bezahlt', '2025-12-20', '2025-12-18', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0016-0000-0000-0000-000000000016', 2350.00, 'Komplettpaket', 'bezahlt', '2025-07-01', '2025-06-28', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0020-0000-0000-0000-000000000020', 2150.00, 'Komplettpaket', 'bezahlt', '2025-06-15', '2025-06-12', 0);

-- 6. Prüfungen
INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum, ergebnis, fehlerpunkte) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bbbb0004-0000-0000-0000-000000000004', 'theorie', '2025-10-15', 'bestanden', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0004-0000-0000-0000-000000000004', 'praxis', '2025-12-01', 'bestanden', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0010-0000-0000-0000-000000000010', 'theorie', '2025-08-20', 'bestanden', 6),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0010-0000-0000-0000-000000000010', 'praxis', '2025-10-10', 'nicht_bestanden', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0010-0000-0000-0000-000000000010', 'praxis', '2025-11-05', 'bestanden', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0016-0000-0000-0000-000000000016', 'theorie', '2025-07-10', 'bestanden', 2),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0016-0000-0000-0000-000000000016', 'praxis', '2025-09-20', 'bestanden', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0020-0000-0000-0000-000000000020', 'theorie', '2025-06-25', 'nicht_bestanden', 14),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0020-0000-0000-0000-000000000020', 'theorie', '2025-07-15', 'bestanden', 8),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0020-0000-0000-0000-000000000020', 'praxis', '2025-09-01', 'bestanden', 0),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0003-0000-0000-0000-000000000003', 'theorie', '2026-01-20', 'bestanden', 6),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0011-0000-0000-0000-000000000011', 'theorie', '2026-02-15', 'bestanden', 4),
  ('11111111-1111-1111-1111-111111111111', 'bbbb0025-0000-0000-0000-000000000025', 'theorie', '2026-02-01', 'bestanden', 8);

-- 7. Anrufe (Telefon-Analytics)
INSERT INTO anrufe (tenant_id, call_id, anrufer_nummer, dauer_sekunden, zusammenfassung, sentiment, intent, anrufer_name, is_new_lead, needs_follow_up, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'call_001', '+49 176 1111111', 180, 'Anrufer interessiert sich für Führerschein Klasse B, fragt nach Preisen und Verfügbarkeit.', 'positive', 'preisanfrage', 'Thomas Gruber', true, true, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'call_002', '+49 176 2222222', 95, 'Schüler möchte Fahrstunde verschieben auf nächste Woche.', 'neutral', 'termin', 'Max Müller', false, false, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_003', '+49 176 3333333', 240, 'Anmeldung für Führerschein B, alle Details aufgenommen.', 'positive', 'anmeldung', 'Sarah Klein', true, true, NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_004', '+49 176 4444444', 60, 'Frage zu Theorie-Prüfungstermin.', 'neutral', 'information', NULL, false, false, NOW() - INTERVAL '4 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_005', '+49 176 5555555', 320, 'Beschwerde über kurzfristig abgesagte Fahrstunde.', 'negative', 'beschwerde', 'Peter Engel', false, true, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_006', '+49 176 6666666', 150, 'Preisanfrage Klasse A Motorrad.', 'positive', 'preisanfrage', 'Julia Roth', true, true, NOW() - INTERVAL '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_007', '+49 176 7777777', 45, 'Kurzer Anruf, Anrufer hat aufgelegt.', 'unknown', 'sonstiges', NULL, false, false, NOW() - INTERVAL '7 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_008', '+49 176 8888888', 200, 'Möchte Sohn zur Fahrschule anmelden.', 'positive', 'anmeldung', 'Markus Stein', true, true, NOW() - INTERVAL '8 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_009', '+49 176 9999999', 110, 'Fragt wann Prüfungstermine frei sind.', 'neutral', 'termin', 'Lisa Schmidt', false, false, NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-111111111111', 'call_010', '+49 177 1111111', 280, 'Intensive Preisberatung, vergleicht mit anderen Fahrschulen.', 'positive', 'preisanfrage', 'Michael Baum', true, true, NOW() - INTERVAL '10 days');

-- 8. Demo-Besuche (Conversion Tracking)
INSERT INTO demo_besuche (plan, visitor_id, referrer, utm_source, hat_cta_geklickt, verweildauer_sekunden, created_at) VALUES
  ('premium', 'v_abc123', 'https://google.de/search', 'google', true, 180, NOW() - INTERVAL '1 day'),
  ('pro', 'v_def456', 'https://linkedin.com', 'linkedin', false, 45, NOW() - INTERVAL '2 days'),
  ('starter', 'v_ghi789', NULL, NULL, false, 30, NOW() - INTERVAL '3 days'),
  ('premium', 'v_jkl012', 'https://google.de/search', 'google', true, 240, NOW() - INTERVAL '4 days'),
  ('pro', 'v_mno345', 'https://facebook.com', 'facebook', true, 120, NOW() - INTERVAL '5 days'),
  ('premium', 'v_pqr678', NULL, 'direkt', false, 60, NOW() - INTERVAL '6 days'),
  ('starter', 'v_stu901', 'https://google.de/search', 'google', false, 20, NOW() - INTERVAL '7 days'),
  ('pro', 'v_vwx234', 'https://linkedin.com', 'linkedin', true, 300, NOW() - INTERVAL '8 days'),
  ('premium', 'v_abc999', 'https://google.de/search', 'google', true, 420, NOW() - INTERVAL '9 days'),
  ('premium', 'v_xyz111', NULL, 'empfehlung', true, 350, NOW() - INTERVAL '10 days');

-- 9. Sales Leads
INSERT INTO sales_leads (fahrschul_name, inhaber, stadt, bundesland, telefon, email, website, google_bewertung, google_bewertungen_anzahl, status, quelle) VALUES
  ('Fahrschule Adler', 'Hans Adler', 'München', 'Bayern', '+49 89 1234567', 'info@fahrschule-adler.de', 'www.fahrschule-adler.de', 4.2, 45, 'kontaktiert', 'recherche'),
  ('Fahrschule Stern', 'Maria Stern', 'Stuttgart', 'Baden-Württemberg', '+49 711 2345678', 'info@stern-fahrschule.de', NULL, 4.8, 120, 'interessiert', 'linkedin'),
  ('Fahrschule Blitz', 'Otto Blitz', 'Frankfurt', 'Hessen', '+49 69 3456789', NULL, 'www.blitz-fahrschule.de', 3.9, 28, 'neu', 'recherche'),
  ('Fahrschule Tempo', 'Petra Tempo', 'Köln', 'NRW', '+49 221 4567890', 'petra@tempo-fahrschule.de', NULL, 4.5, 87, 'demo_gebucht', 'google'),
  ('Fahrschule König', 'Frank König', 'Hamburg', 'Hamburg', '+49 40 5678901', 'info@koenig-fahrschule.de', 'www.koenig-fahrschule.de', 4.1, 63, 'angebot', 'empfehlung'),
  ('Fahrschule Start', 'Eva Start', 'Berlin', 'Berlin', '+49 30 6789012', NULL, NULL, 3.7, 15, 'neu', 'recherche'),
  ('Fahrschule Flink', 'Bernd Flink', 'Nürnberg', 'Bayern', '+49 911 7890123', 'bernd@flink.de', 'www.flink-fahrschule.de', 4.6, 95, 'gewonnen', 'recherche'),
  ('Fahrschule Sicher', 'Claudia Sicher', 'Dresden', 'Sachsen', '+49 351 8901234', NULL, NULL, 4.0, 42, 'kein_interesse', 'recherche');

-- 10. Theorie Events (Beispieldaten)
INSERT INTO theorie_events (tenant_id, user_identifier, event_type, kategorie, richtig, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'th_user001', 'session_started', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'th_user001', 'question_answered', 'Gefahrenlehre', true, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'th_user001', 'question_answered', 'Gefahrenlehre', true, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'th_user001', 'question_answered', 'Gefahrenlehre', false, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'th_user001', 'question_answered', 'Vorfahrt', true, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'th_user001', 'question_answered', 'Vorfahrt', true, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'th_user001', 'ai_tutor_used', 'Gefahrenlehre', NULL, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'th_user002', 'session_started', NULL, NULL, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user002', 'question_answered', 'Verkehrszeichen', true, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user002', 'question_answered', 'Verkehrszeichen', false, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user002', 'question_answered', 'Umweltschutz', true, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user002', 'quiz_completed', NULL, NULL, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user003', 'session_started', NULL, NULL, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user003', 'question_answered', 'Technik', true, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user003', 'question_answered', 'Technik', true, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user003', 'question_answered', 'Technik', true, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'th_user003', 'ai_tutor_used', 'Technik', NULL, NOW() - INTERVAL '5 days');

-- ============================================================
-- FERTIG! Tenant-ID für API-Calls:
-- 11111111-1111-1111-1111-111111111111
-- ============================================================
