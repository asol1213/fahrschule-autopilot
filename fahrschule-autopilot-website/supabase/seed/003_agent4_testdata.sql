-- ============================================================
-- Agent 4: Test-Daten fuer WhatsApp-Automation Workflows
-- Tenant: Fahrschule Testmeister (11111111-1111-1111-1111-111111111111)
-- ============================================================

-- Sicherstellen dass die Tabellen existieren (Migration 005 muss gelaufen sein)

-- ============================================================
-- Warteliste: 3 wartende Schueler
-- ============================================================
INSERT INTO warteliste (tenant_id, schueler_name, telefon, wunsch_tage, wunsch_zeiten, prioritaet, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Warteliste Eins', '+491701000001', 'montag dienstag mittwoch', 'vormittags', 3, 'wartend'),
  ('11111111-1111-1111-1111-111111111111', 'Warteliste Zwei', '+491701000002', 'donnerstag freitag', 'nachmittags', 5, 'wartend'),
  ('11111111-1111-1111-1111-111111111111', 'Warteliste Drei', '+491701000003', 'montag freitag', 'vormittags nachmittags', 2, 'wartend')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Zahlungen: Ueberfaellige Rechnungen fuer Mahnungs-Tests
-- (setzt voraus dass Schueler aus dem Standard-Seed existieren)
-- ============================================================
-- Finde existierende Schueler-IDs
DO $$
DECLARE
  v_schueler_1 UUID;
  v_schueler_2 UUID;
  v_schueler_3 UUID;
BEGIN
  SELECT id INTO v_schueler_1 FROM schueler
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status = 'theorie' LIMIT 1;
  SELECT id INTO v_schueler_2 FROM schueler
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status = 'praxis' LIMIT 1;
  SELECT id INTO v_schueler_3 FROM schueler
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status = 'angemeldet' LIMIT 1;

  -- Stufe 1 Test: 8 Tage ueberfaellig
  IF v_schueler_1 IS NOT NULL THEN
    INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, mahnungs_stufe)
    VALUES ('11111111-1111-1111-1111-111111111111', v_schueler_1, 180.00, 'Grundgebuehr Klasse B', 'offen', CURRENT_DATE - INTERVAL '8 days', 0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Stufe 2 Test: 15 Tage ueberfaellig
  IF v_schueler_2 IS NOT NULL THEN
    INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, mahnungs_stufe)
    VALUES ('11111111-1111-1111-1111-111111111111', v_schueler_2, 325.00, '5 Fahrstunden', 'offen', CURRENT_DATE - INTERVAL '15 days', 0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Stufe 3 Test: 22 Tage ueberfaellig
  IF v_schueler_3 IS NOT NULL THEN
    INSERT INTO zahlungen (tenant_id, schueler_id, betrag, beschreibung, status, faellig_am, mahnungs_stufe)
    VALUES ('11111111-1111-1111-1111-111111111111', v_schueler_3, 450.00, 'Pruefungsgebuehr + Restbetrag', 'ueberfaellig', CURRENT_DATE - INTERVAL '22 days', 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- Fahrstunden: Termine fuer morgen und in 2h (Erinnerungs-Tests)
-- ============================================================
DO $$
DECLARE
  v_schueler UUID;
  v_fahrlehrer UUID;
BEGIN
  SELECT id INTO v_schueler FROM schueler
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status = 'praxis' LIMIT 1;
  SELECT id INTO v_fahrlehrer FROM fahrlehrer
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND aktiv = true LIMIT 1;

  IF v_schueler IS NOT NULL AND v_fahrlehrer IS NOT NULL THEN
    -- Termin morgen um 10:00 (fuer 24h-Erinnerung)
    INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status)
    VALUES ('11111111-1111-1111-1111-111111111111', v_schueler, v_fahrlehrer,
            CURRENT_DATE + INTERVAL '1 day', '10:00', 90, 'normal', 'geplant')
    ON CONFLICT DO NOTHING;

    -- Termin in ~2.5h (fuer 2h-Erinnerung)
    INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status)
    VALUES ('11111111-1111-1111-1111-111111111111', v_schueler, v_fahrlehrer,
            CURRENT_DATE, (CURRENT_TIME + INTERVAL '2.5 hours')::TIME, 45, 'normal', 'geplant')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- Schueler-Updates fuer Theorie-Reminder Tests
-- ============================================================
UPDATE schueler
SET letzte_theorie_aktivitaet = NOW() - INTERVAL '5 days',
    onboarding_status = 'gestartet'
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND status = 'theorie'
  AND letzte_theorie_aktivitaet IS NULL;

-- ============================================================
-- Buchungsanfragen: Test-Buchung
-- ============================================================
INSERT INTO buchungsanfragen (tenant_id, buchungs_nr, schueler_name, telefon, email, wunsch_datum, wunsch_zeit, art, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'BK-TEST001',
  'Neuer Interessent',
  '+491701000099',
  'test@example.com',
  CURRENT_DATE + INTERVAL '7 days',
  '14:00',
  'Fahrstunde',
  'neu'
) ON CONFLICT (buchungs_nr) DO NOTHING;

-- ============================================================
-- DSGVO Opt-Out Test-Schueler
-- ============================================================
DO $$
DECLARE
  v_fahrlehrer UUID;
BEGIN
  SELECT id INTO v_fahrlehrer FROM fahrlehrer
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND aktiv = true LIMIT 1;

  -- Schueler mit wa_opt_out = true (darf KEINE WhatsApp-Nachrichten erhalten)
  INSERT INTO schueler (tenant_id, vorname, nachname, email, telefon, geburtsdatum, fuehrerscheinklasse, status, fahrlehrer_id, ort, plz, dsgvo_einwilligung, wa_opt_out, wa_opt_out_datum, onboarding_status)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Sabine', 'OptOut', 'sabine@test.de', '+491709999001', '2003-05-20', 'B', 'praxis', v_fahrlehrer, 'Stuttgart', '70173', true, true, NOW(), 'abgeschlossen')
  ON CONFLICT DO NOTHING;

  -- Fahrstunde fuer Opt-Out Schueler morgen (Erinnerung sollte NICHT gesendet werden)
  IF v_fahrlehrer IS NOT NULL THEN
    INSERT INTO fahrstunden (tenant_id, schueler_id, fahrlehrer_id, datum, uhrzeit, dauer, typ, status)
    SELECT '11111111-1111-1111-1111-111111111111', s.id, v_fahrlehrer,
           CURRENT_DATE + INTERVAL '1 day', '10:00', 90, 'normal', 'geplant'
    FROM schueler s WHERE s.telefon = '+491709999001' AND s.tenant_id = '11111111-1111-1111-1111-111111111111'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- Pruefungen fuer Empfehlung/Glueckwuensche Tests
-- ============================================================
DO $$
DECLARE
  v_schueler_bestanden UUID;
  v_schueler_morgen UUID;
BEGIN
  -- Schueler der bestanden hat (Glueckwuensche + Empfehlung Test)
  SELECT id INTO v_schueler_bestanden FROM schueler
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status = 'pruefung' LIMIT 1;

  -- Schueler mit Pruefung morgen (Bestaetigung Test)
  SELECT id INTO v_schueler_morgen FROM schueler
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status = 'praxis' LIMIT 1;

  IF v_schueler_bestanden IS NOT NULL THEN
    INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum, ergebnis, fehlerpunkte)
    VALUES ('11111111-1111-1111-1111-111111111111', v_schueler_bestanden, 'Praktische Pruefung', CURRENT_DATE - 3, 'bestanden', 0)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_schueler_morgen IS NOT NULL THEN
    INSERT INTO pruefungen (tenant_id, schueler_id, typ, datum)
    VALUES ('11111111-1111-1111-1111-111111111111', v_schueler_morgen, 'Theoretische Pruefung', CURRENT_DATE + 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- Verify: Zaehle alle Test-Daten
-- ============================================================
-- SELECT 'warteliste' AS tabelle, count(*) FROM warteliste WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
-- UNION ALL SELECT 'zahlungen (offen/ueberfaellig)', count(*) FROM zahlungen WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status IN ('offen', 'ueberfaellig')
-- UNION ALL SELECT 'fahrstunden (geplant)', count(*) FROM fahrstunden WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND status = 'geplant'
-- UNION ALL SELECT 'buchungsanfragen', count(*) FROM buchungsanfragen WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
