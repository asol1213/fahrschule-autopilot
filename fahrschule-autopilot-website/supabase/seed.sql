-- ==============================================================
-- SEED DATA: Testdaten fuer lokale Entwicklung
--
-- ANLEITUNG:
-- 1. Erstelle zuerst einen User in Supabase Auth (Dashboard > Authentication > Users > Add user)
--    E-Mail: test@fahrschule-autopilot.de / Passwort: Test1234!
-- 2. Kopiere die User-UUID und ersetze den Platzhalter unten
-- 3. Fuehre dieses Script im Supabase SQL Editor aus
-- ==============================================================

-- !!! ERSETZE DIESE UUID mit der echten User-UUID aus Supabase Auth !!!
-- Geh zu: Supabase Dashboard > Authentication > Users > kopiere die UUID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- <-- HIER ERSETZEN
  tenant_uuid UUID;
  fahrlehrer1_uuid UUID;
  fahrlehrer2_uuid UUID;
  s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID; s6 UUID; s7 UUID; s8 UUID;
BEGIN

-- 1. Tenant erstellen
INSERT INTO tenants (slug, name, plan, owner_user_id)
VALUES ('fahrschule-weber', 'Fahrschule Weber', 'premium', test_user_id)
RETURNING id INTO tenant_uuid;

-- 2. User mit Tenant verknuepfen
INSERT INTO tenant_users (tenant_id, user_id, role)
VALUES (tenant_uuid, test_user_id, 'inhaber');

-- 3. Fahrlehrer
INSERT INTO fahrlehrer (tenant_id, vorname, nachname, telefon, email, fuehrerscheinklassen)
VALUES
  (tenant_uuid, 'Andreas', 'Weber', '+49 711 456 7890', 'andreas@fahrschule-weber.de', ARRAY['B','BE','A'])
RETURNING id INTO fahrlehrer1_uuid;

INSERT INTO fahrlehrer (tenant_id, vorname, nachname, telefon, email, fuehrerscheinklassen)
VALUES
  (tenant_uuid, 'Maria', 'Fischer', '+49 711 456 7891', 'maria@fahrschule-weber.de', ARRAY['B','B96'])
RETURNING id INTO fahrlehrer2_uuid;

-- 4. Schueler (8 Stueck, verschiedene Status)
INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, ort, plz, adresse, dsgvo_einwilligung, email_einwilligung)
VALUES
  (tenant_uuid, 'Max', 'Mustermann', 'max@test.de', '+49 176 1234 5678', '2005-03-15', 'B', 'praxis', fahrlehrer1_uuid, 'Stuttgart', '70173', 'Koenigstr. 10', true, true)
RETURNING id INTO s1;

INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, ort, plz, adresse, dsgvo_einwilligung, email_einwilligung)
VALUES
  (tenant_uuid, 'Lisa', 'Schmidt', 'lisa@test.de', '+49 176 2345 6789', '2004-07-22', 'B', 'theorie', fahrlehrer2_uuid, 'Stuttgart', '70174', 'Marienstr. 5', true, true)
RETURNING id INTO s2;

INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, ort, plz, adresse, dsgvo_einwilligung, email_einwilligung)
VALUES
  (tenant_uuid, 'Tim', 'Mueller', 'tim@test.de', '+49 176 3456 7890', '2005-11-01', 'B', 'pruefung', fahrlehrer1_uuid, 'Stuttgart', '70178', 'Hauptstr. 20', true, false)
RETURNING id INTO s3;

INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, ort, plz, dsgvo_einwilligung)
VALUES
  (tenant_uuid, 'Anna', 'Wagner', 'anna@test.de', '+49 176 4567 8901', '2006-01-30', 'B', 'angemeldet', 'Esslingen', '73728', true)
RETURNING id INTO s4;

INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, ort, plz, dsgvo_einwilligung)
VALUES
  (tenant_uuid, 'Jonas', 'Becker', 'jonas@test.de', '+49 176 5678 9012', '2004-09-10', 'A2', 'praxis', fahrlehrer1_uuid, 'Stuttgart', '70176', true)
RETURNING id INTO s5;

INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, ort, plz, dsgvo_einwilligung)
VALUES
  (tenant_uuid, 'Sophie', 'Klein', 'sophie@test.de', '+49 176 6789 0123', '2005-05-18', 'B', 'dokumente_ausstehend', 'Ludwigsburg', '71634', true)
RETURNING id INTO s6;

INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, ort, plz, dsgvo_einwilligung, ausbildung_beendet_am)
VALUES
  (tenant_uuid, 'Lukas', 'Hoffmann', 'lukas@test.de', '+49 176 7890 1234', '2004-04-02', 'B', 'bestanden', fahrlehrer2_uuid, 'Stuttgart', '70199', true, '2026-02-15')
RETURNING id INTO s7;

INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, ort, plz, dsgvo_einwilligung)
VALUES
  (tenant_uuid, 'Emma', 'Braun', 'emma@test.de', '+49 176 8901 2345', '2005-08-25', 'B', 'praxis', fahrlehrer2_uuid, 'Stuttgart', '70173', true)
RETURNING id INTO s8;

-- 5. Fahrstunden
INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status, bewertung) VALUES
  (tenant_uuid, s1, fahrlehrer1_uuid, CURRENT_DATE - 14, '14:00', 90, 'normal', 'abgeschlossen', 4),
  (tenant_uuid, s1, fahrlehrer1_uuid, CURRENT_DATE - 7, '10:00', 90, 'normal', 'abgeschlossen', 4),
  (tenant_uuid, s1, fahrlehrer1_uuid, CURRENT_DATE - 3, '16:00', 45, 'sonderfahrt_autobahnfahrt', 'abgeschlossen', 5),
  (tenant_uuid, s1, fahrlehrer1_uuid, CURRENT_DATE + 2, '14:00', 90, 'sonderfahrt_nachtfahrt', 'geplant', NULL),
  (tenant_uuid, s3, fahrlehrer1_uuid, CURRENT_DATE - 10, '08:00', 90, 'pruefungsvorbereitung', 'abgeschlossen', 3),
  (tenant_uuid, s3, fahrlehrer1_uuid, CURRENT_DATE - 5, '09:00', 45, 'normal', 'no_show', NULL),
  (tenant_uuid, s5, fahrlehrer1_uuid, CURRENT_DATE - 2, '11:00', 90, 'normal', 'abgeschlossen', 4),
  (tenant_uuid, s5, fahrlehrer1_uuid, CURRENT_DATE + 5, '11:00', 90, 'sonderfahrt_ueberlandfahrt', 'geplant', NULL),
  (tenant_uuid, s8, fahrlehrer2_uuid, CURRENT_DATE - 1, '15:00', 90, 'normal', 'abgeschlossen', 5),
  (tenant_uuid, s8, fahrlehrer2_uuid, CURRENT_DATE + 3, '15:00', 90, 'normal', 'geplant', NULL),
  (tenant_uuid, s7, fahrlehrer2_uuid, CURRENT_DATE - 30, '10:00', 90, 'pruefungsvorbereitung', 'abgeschlossen', 5);

-- 6. Zahlungen
INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, bezahlt_am) VALUES
  (tenant_uuid, s1, 400.00, 'Grundgebuehr Klasse B', 'bezahlt', CURRENT_DATE - 60, CURRENT_DATE - 55),
  (tenant_uuid, s1, 280.00, 'Fahrstunden (4x70)', 'bezahlt', CURRENT_DATE - 14, CURRENT_DATE - 12),
  (tenant_uuid, s1, 140.00, 'Fahrstunden (2x70)', 'offen', CURRENT_DATE + 7, NULL),
  (tenant_uuid, s2, 400.00, 'Grundgebuehr Klasse B', 'bezahlt', CURRENT_DATE - 30, CURRENT_DATE - 28),
  (tenant_uuid, s2, 90.00, 'Theoriepruefung', 'offen', CURRENT_DATE + 14, NULL),
  (tenant_uuid, s3, 400.00, 'Grundgebuehr Klasse B', 'bezahlt', CURRENT_DATE - 90, CURRENT_DATE - 85),
  (tenant_uuid, s3, 350.00, 'Fahrstunden (5x70)', 'ueberfaellig', CURRENT_DATE - 10, NULL),
  (tenant_uuid, s4, 400.00, 'Grundgebuehr Klasse B', 'offen', CURRENT_DATE + 30, NULL),
  (tenant_uuid, s5, 450.00, 'Grundgebuehr Klasse A2', 'bezahlt', CURRENT_DATE - 45, CURRENT_DATE - 40),
  (tenant_uuid, s7, 400.00, 'Grundgebuehr Klasse B', 'bezahlt', CURRENT_DATE - 120, CURRENT_DATE - 115),
  (tenant_uuid, s7, 200.00, 'Pruefungsgebuehr Praxis', 'bezahlt', CURRENT_DATE - 20, CURRENT_DATE - 18),
  (tenant_uuid, s8, 400.00, 'Grundgebuehr Klasse B', 'bezahlt', CURRENT_DATE - 40, CURRENT_DATE - 38);

-- 7. Pruefungen
INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum, ergebnis, fehlerpunkte) VALUES
  (tenant_uuid, s7, 'theorie', CURRENT_DATE - 60, 'bestanden', 4),
  (tenant_uuid, s7, 'praxis', CURRENT_DATE - 20, 'bestanden', NULL),
  (tenant_uuid, s3, 'theorie', CURRENT_DATE - 45, 'bestanden', 8),
  (tenant_uuid, s1, 'theorie', CURRENT_DATE - 30, 'bestanden', 6),
  (tenant_uuid, s2, 'theorie', CURRENT_DATE - 5, 'nicht_bestanden', 14);

-- 8. Dokumente
INSERT INTO dokumente (tenant_id, schueler_id, typ, vorhanden) VALUES
  (tenant_uuid, s1, 'sehtest', true),
  (tenant_uuid, s1, 'erste_hilfe', true),
  (tenant_uuid, s1, 'passfoto', true),
  (tenant_uuid, s2, 'sehtest', true),
  (tenant_uuid, s2, 'erste_hilfe', false),
  (tenant_uuid, s3, 'sehtest', true),
  (tenant_uuid, s3, 'erste_hilfe', true),
  (tenant_uuid, s3, 'passfoto', true),
  (tenant_uuid, s4, 'sehtest', false),
  (tenant_uuid, s4, 'erste_hilfe', false),
  (tenant_uuid, s6, 'sehtest', false),
  (tenant_uuid, s6, 'erste_hilfe', false),
  (tenant_uuid, s6, 'passfoto', false);

-- 9. Kommunikation
INSERT INTO kommunikation (tenant_id, schueler_id, kanal, richtung, betreff, inhalt, datum) VALUES
  (tenant_uuid, s1, 'whatsapp', 'ausgehend', 'Erinnerung Fahrstunde', 'Hallo Max, Erinnerung an deine Fahrstunde morgen um 14 Uhr.', NOW() - INTERVAL '2 days'),
  (tenant_uuid, s3, 'email', 'ausgehend', 'Zahlungserinnerung', 'Offener Betrag: 350 EUR. Bitte um zeitnahe Ueberweisung.', NOW() - INTERVAL '5 days'),
  (tenant_uuid, s4, 'whatsapp', 'eingehend', 'Dokumente', 'Hallo, wo kann ich den Sehtest machen?', NOW() - INTERVAL '1 day'),
  (tenant_uuid, s6, 'email', 'ausgehend', 'Willkommen', 'Willkommen bei Fahrschule Weber! Bitte bringe folgende Dokumente mit...', NOW() - INTERVAL '3 days');

RAISE NOTICE 'Seed-Daten erfolgreich erstellt! Tenant-ID: %', tenant_uuid;
RAISE NOTICE 'Login mit: test@fahrschule-autopilot.de / Test1234!';

END $$;
