-- ============================================================
-- FAHRSCHULE AUTOPILOT — Demo-Daten für Testing
--
-- ANLEITUNG:
-- 1. Supabase Projekt erstellen auf supabase.com
-- 2. SQL Editor → 001_initial_schema.sql ausführen
-- 3. Authentication → Users → "Add User" erstellen:
--    E-Mail: test@fahrschule.de  Passwort: Autopilot2026!
-- 4. Die USER-ID aus dem Auth-Dashboard kopieren
-- 5. Unten bei INSERT INTO tenant_users die USER-ID einsetzen
-- 6. Dieses Script ausführen
-- ============================================================

-- ===== TENANT =====
INSERT INTO tenants (id, slug, name, plan) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fahrschule-weber', 'Fahrschule Weber', 'premium');

-- ===== TENANT USER (DEINE AUTH USER-ID HIER EINSETZEN!) =====
-- INSERT INTO tenant_users (tenant_id, user_id, role) VALUES
--   ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DEINE-SUPABASE-AUTH-USER-ID', 'inhaber');

-- ===== FAHRLEHRER =====
INSERT INTO fahrlehrer (id, tenant_id, vorname, nachname, telefon, email, fuehrerscheinklassen, aktiv) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Thomas', 'Berger', '+49 711 1234567', 'berger@fahrschule-weber.de', ARRAY['B','BE','A'], true),
  ('f2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sandra', 'Koch', '+49 711 2345678', 'koch@fahrschule-weber.de', ARRAY['B','B96'], true),
  ('f3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Michael', 'Roth', '+49 711 3456789', 'roth@fahrschule-weber.de', ARRAY['B','A','A2','A1'], true);

-- ===== SCHÜLER (10 Stück in verschiedenen Status) =====
INSERT INTO schueler (id, tenant_id, vorname, nachname, email, telefon, geburtsdatum, adresse, plz, ort, fuehrerscheinklasse, status, fahrlehrer_id, anmeldungs_datum, whatsapp_einwilligung, email_einwilligung, dsgvo_einwilligung, dsgvo_einwilligung_datum) VALUES
  ('s1000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Leon', 'Müller', 'leon.mueller@gmail.com', '+49 176 11111111', '2006-03-15', 'Königstr. 42', '70173', 'Stuttgart', 'B', 'praxis', 'f1111111-1111-1111-1111-111111111111', '2026-01-10', true, true, true, '2026-01-10T10:00:00Z'),
  ('s1000002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sophie', 'Schmidt', 'sophie.schmidt@web.de', '+49 176 22222222', '2005-07-22', 'Marienstr. 8', '70178', 'Stuttgart', 'B', 'theorie', 'f2222222-2222-2222-2222-222222222222', '2026-02-01', true, true, true, '2026-02-01T09:00:00Z'),
  ('s1000003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maximilian', 'Weber', 'max.weber@outlook.de', '+49 176 33333333', '2006-11-03', 'Friedrichstr. 15', '70174', 'Stuttgart', 'B', 'pruefung', 'f1111111-1111-1111-1111-111111111111', '2025-11-15', true, true, true, '2025-11-15T14:00:00Z'),
  ('s1000004-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Emma', 'Fischer', 'emma.fischer@gmail.com', '+49 176 44444444', '2005-05-12', 'Calwerstr. 3', '70173', 'Stuttgart', 'B', 'bestanden', 'f3333333-3333-3333-3333-333333333333', '2025-09-01', true, true, true, '2025-09-01T11:00:00Z'),
  ('s1000005-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Liam', 'Bauer', 'liam.bauer@gmx.de', '+49 176 55555555', '2007-01-28', 'Rotebühlstr. 22', '70178', 'Stuttgart', 'A2', 'angemeldet', NULL, '2026-03-20', true, false, true, '2026-03-20T16:00:00Z'),
  ('s1000006-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mia', 'Hoffmann', 'mia.hoffmann@icloud.com', '+49 176 66666666', '2006-08-19', 'Tübingerstr. 7', '70178', 'Stuttgart', 'B', 'dokumente_ausstehend', 'f2222222-2222-2222-2222-222222222222', '2026-03-15', true, true, true, '2026-03-15T10:30:00Z'),
  ('s1000007-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Noah', 'Schneider', 'noah.schneider@gmail.com', '+49 176 77777777', '2005-12-01', 'Eberhardstr. 33', '70173', 'Stuttgart', 'B', 'praxis', 'f3333333-3333-3333-3333-333333333333', '2025-12-10', true, true, true, '2025-12-10T09:00:00Z'),
  ('s1000008-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Emilia', 'Wolf', 'emilia.wolf@web.de', '+49 176 88888888', '2006-04-14', 'Hauptstätterstr. 11', '70173', 'Stuttgart', 'B96', 'theorie', 'f1111111-1111-1111-1111-111111111111', '2026-02-20', true, true, true, '2026-02-20T08:00:00Z'),
  ('s1000009-0000-0000-0000-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Finn', 'Braun', 'finn.braun@outlook.de', '+49 176 99999999', '2006-09-25', 'Bolzstr. 5', '70173', 'Stuttgart', 'A', 'praxis', 'f3333333-3333-3333-3333-333333333333', '2025-10-05', true, true, true, '2025-10-05T13:00:00Z'),
  ('s1000010-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hannah', 'Richter', 'hannah.richter@gmail.com', '+49 176 10101010', '2007-02-08', 'Schillerstr. 18', '70174', 'Stuttgart', 'B', 'abgebrochen', 'f2222222-2222-2222-2222-222222222222', '2025-08-01', false, false, true, '2025-08-01T15:00:00Z');

-- ===== DOKUMENTE (Checkliste für jeden Schüler) =====
-- Leon (praxis) — alle vorhanden
INSERT INTO dokumente (tenant_id, schueler_id, typ, vorhanden, upload_datum) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'sehtest', true, '2026-01-12'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'erste_hilfe', true, '2026-01-12'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'passfoto', true, '2026-01-12'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'ausweis', true, '2026-01-12'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'fuehrerschein_antrag', true, '2026-01-15');
-- Mia (dokumente_ausstehend) — 2 von 5
INSERT INTO dokumente (tenant_id, schueler_id, typ, vorhanden) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000006-0000-0000-0000-000000000006', 'sehtest', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000006-0000-0000-0000-000000000006', 'erste_hilfe', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000006-0000-0000-0000-000000000006', 'passfoto', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000006-0000-0000-0000-000000000006', 'ausweis', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000006-0000-0000-0000-000000000006', 'fuehrerschein_antrag', false);
-- Sophie (theorie) — alle vorhanden
INSERT INTO dokumente (tenant_id, schueler_id, typ, vorhanden, upload_datum) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 'sehtest', true, '2026-02-05'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 'erste_hilfe', true, '2026-02-05'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 'passfoto', true, '2026-02-05'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 'ausweis', true, '2026-02-05'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 'fuehrerschein_antrag', true, '2026-02-08');

-- ===== FAHRSTUNDEN (realistische Verteilung) =====
-- Leon: 15 Fahrstunden (praxis-Phase)
INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status, bewertung) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-03', '09:00', 90, 'normal', 'abgeschlossen', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-05', '10:00', 90, 'normal', 'abgeschlossen', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-10', '09:00', 90, 'normal', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-12', '14:00', 90, 'normal', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-17', '09:00', 90, 'normal', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-19', '10:00', 90, 'normal', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-24', '09:00', 90, 'normal', 'abgeschlossen', 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-02-26', '14:00', 90, 'normal', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-03-03', '09:00', 90, 'sonderfahrt_ueberlandfahrt', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-03-05', '09:00', 90, 'sonderfahrt_ueberlandfahrt', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-03-10', '09:00', 90, 'sonderfahrt_autobahnfahrt', 'abgeschlossen', 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-03-12', '14:00', 90, 'sonderfahrt_autobahnfahrt', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-03-17', '20:00', 90, 'sonderfahrt_nachtfahrt', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', '2026-03-19', '20:00', 90, 'sonderfahrt_nachtfahrt', 'abgeschlossen', 5),
  -- Kommende Fahrstunde diese Woche
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'f1111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, '10:00', 90, 'pruefungsvorbereitung', 'geplant', NULL);

-- Noah: 8 Fahrstunden, davon 1 no_show
INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status, bewertung) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'f3333333-3333-3333-3333-333333333333', '2026-01-15', '09:00', 90, 'normal', 'abgeschlossen', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'f3333333-3333-3333-3333-333333333333', '2026-01-20', '14:00', 90, 'normal', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'f3333333-3333-3333-3333-333333333333', '2026-01-27', '09:00', 90, 'normal', 'no_show', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'f3333333-3333-3333-3333-333333333333', '2026-02-03', '14:00', 90, 'normal', 'abgeschlossen', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'f3333333-3333-3333-3333-333333333333', CURRENT_DATE + 2, '14:00', 90, 'normal', 'geplant', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'f3333333-3333-3333-3333-333333333333', CURRENT_DATE + 4, '09:00', 90, 'sonderfahrt_ueberlandfahrt', 'geplant', NULL);

-- Weitere Termine diese Woche für Kalender-Test
INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 'f2222222-2222-2222-2222-222222222222', CURRENT_DATE, '08:00', 90, 'normal', 'geplant'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000003-0000-0000-0000-000000000003', 'f1111111-1111-1111-1111-111111111111', CURRENT_DATE, '14:00', 90, 'pruefungsvorbereitung', 'geplant'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000008-0000-0000-0000-000000000008', 'f1111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, '08:00', 45, 'normal', 'geplant'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000009-0000-0000-0000-000000000009', 'f3333333-3333-3333-3333-333333333333', CURRENT_DATE + 1, '16:00', 90, 'sonderfahrt_autobahnfahrt', 'geplant'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 'f2222222-2222-2222-2222-222222222222', CURRENT_DATE + 3, '10:00', 90, 'normal', 'geplant');

-- ===== ZAHLUNGEN =====
-- Leon: Einige bezahlt, eine offen
INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, bezahlt_am, mahnungs_stufe) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 350.00, 'Grundgebühr Klasse B', 'bezahlt', '2026-01-24', '2026-01-22', 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 110.00, 'Fahrstunde 90 Min — 03.02.2026', 'bezahlt', '2026-02-17', '2026-02-15', 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 110.00, 'Fahrstunde 90 Min — 05.02.2026', 'bezahlt', '2026-02-19', '2026-02-18', 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 130.00, 'Sonderfahrt Überland 90 Min — 03.03.2026', 'offen', '2026-03-17', NULL, 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 130.00, 'Sonderfahrt Autobahn 90 Min — 10.03.2026', 'offen', '2026-03-24', NULL, 0);

-- Sophie: Grundgebühr bezahlt
INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, bezahlt_am) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000002-0000-0000-0000-000000000002', 350.00, 'Grundgebühr Klasse B', 'bezahlt', '2026-02-15', '2026-02-14');

-- Maximilian: Überfällige Zahlung
INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, mahnungs_stufe) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000003-0000-0000-0000-000000000003', 110.00, 'Fahrstunde 90 Min — 15.02.2026', 'ueberfaellig', '2026-03-01', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000003-0000-0000-0000-000000000003', 130.00, 'Sonderfahrt Nacht — 20.02.2026', 'ueberfaellig', '2026-03-06', 1);

-- Noah: Offen
INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 350.00, 'Grundgebühr Klasse B', 'offen', '2026-03-30');

-- ===== PRÜFUNGEN =====
-- Leon: Theorie bestanden
INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum, ergebnis, fehlerpunkte) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'theorie', '2026-02-01', 'bestanden', 4);

-- Maximilian: Theorie bestanden, Praxis noch offen
INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum, ergebnis, fehlerpunkte) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000003-0000-0000-0000-000000000003', 'theorie', '2025-12-20', 'bestanden', 6),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000003-0000-0000-0000-000000000003', 'praxis', CURRENT_DATE + 5, NULL, NULL);

-- Emma: Alles bestanden
INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum, ergebnis, fehlerpunkte) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000004-0000-0000-0000-000000000004', 'theorie', '2025-10-15', 'bestanden', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000004-0000-0000-0000-000000000004', 'praxis', '2025-12-10', 'bestanden', NULL);

-- Noah: Theorie durchgefallen, dann bestanden
INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum, ergebnis, fehlerpunkte) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'theorie', '2026-01-10', 'nicht_bestanden', 14),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000007-0000-0000-0000-000000000007', 'theorie', '2026-02-14', 'bestanden', 8);

-- ===== KOMMUNIKATION =====
INSERT INTO kommunikation (tenant_id, schueler_id, kanal, richtung, betreff, inhalt, datum) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'whatsapp', 'ausgehend', 'Willkommen', 'Hallo Leon, willkommen bei Fahrschule Weber! Dein Fahrlehrer ist Thomas Berger.', '2026-01-10T10:30:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'whatsapp', 'ausgehend', 'Erinnerung', 'Erinnerung: Morgen 09:00 Uhr Fahrstunde mit Thomas.', '2026-02-02T18:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000001-0000-0000-0000-000000000001', 'telefon', 'eingehend', 'Rückfrage Prüfungstermin', 'Leon hat angerufen und nach dem Prüfungstermin gefragt. Wurde informiert.', '2026-03-15T11:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000003-0000-0000-0000-000000000003', 'whatsapp', 'ausgehend', 'Zahlungserinnerung', 'Hallo Maximilian, wir haben noch eine offene Rechnung über 110€. Bitte überweisen.', '2026-03-08T09:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000003-0000-0000-0000-000000000003', 'email', 'ausgehend', 'Mahnung Stufe 2', 'Zweite Mahnung: Offener Betrag 110€ seit 01.03.2026.', '2026-03-15T09:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000004-0000-0000-0000-000000000004', 'whatsapp', 'ausgehend', 'Herzlichen Glückwunsch!', 'Emma, herzlichen Glückwunsch zur bestandenen Prüfung! Gute Fahrt!', '2025-12-10T16:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 's1000006-0000-0000-0000-000000000006', 'whatsapp', 'ausgehend', 'Fehlende Dokumente', 'Hallo Mia, uns fehlen noch: Erste-Hilfe-Nachweis, Personalausweis und Führerscheinantrag.', '2026-03-18T10:00:00Z');
