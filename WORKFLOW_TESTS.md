# Fahrschule Autopilot — Workflow Test Plan
**Datum:** 2026-03-28
**System:** Raspberry Pi 5 (8GB, 512GB SSD)
**n8n:** http://YOUR_PI_IP:5678
**PostgreSQL:** autopilot@postgres:5432/fahrschule
**WhatsApp:** http://YOUR_PI_IP:3002

---

## Vorbereitung

### Demo-Daten in der Datenbank:
| Tabelle | Daten |
|---|---|
| Fahrschule | "Fahrschule Müller Nürnberg" |
| Fahrlehrer | Thomas Müller, Sarah Weber |
| Schüler | Max Schmidt (+4915111111111, 450€ offen), Lisa Meyer (+4915122222222, 0€), Tom Wagner (+4915133333333, 200€ offen) |
| Termine | 3 Termine am 28.03.2026 (10:00, 12:00, 14:00) |
| Warteliste | Tom wartet auf 28.03. 10:00 |
| Zahlungen | Max 450€ offen, Tom 200€ offen |

---

## TEST 1: Termin-Erinnerungen (No-Show Killer)

**Workflow:** `01 - Termin-Erinnerungen (No-Show Killer)`
**Trigger:** Alle 15 Minuten (Schedule)
**Erwartetes Verhalten:**

### Test 1.1 — 24h Erinnerung
- [ ] Workflow öffnen in n8n → manuell "Execute Workflow" klicken
- [ ] Prüfen: `Termine in 24h holen` Node sollte Termine für morgen finden
- [ ] Prüfen: `nachrichten_log` Tabelle hat neue Einträge mit `typ = 'erinnerung_24h'`
- [ ] Prüfen: `termine` Tabelle → `erinnerung_24h_gesendet = true` für gefundene Termine
- [ ] WhatsApp-Nachricht wurde gesendet an Schüler

**SQL zum Verifizieren:**
```sql
-- Auf der Pi ausführen:
docker exec postgres psql -U autopilot -d fahrschule -c "SELECT * FROM nachrichten_log WHERE typ = 'erinnerung_24h';"
docker exec postgres psql -U autopilot -d fahrschule -c "SELECT id, datum, uhrzeit, erinnerung_24h_gesendet FROM termine;"
```

### Test 1.2 — 2h Erinnerung
- [ ] Termin-Datum auf HEUTE setzen (falls nötig)
- [ ] Workflow manuell ausführen
- [ ] Prüfen: `nachrichten_log` hat Einträge mit `typ = 'erinnerung_2h'`
- [ ] Prüfen: `termine` → `erinnerung_2h_gesendet = true`

**SQL zum Termin auf heute setzen:**
```sql
docker exec postgres psql -U autopilot -d fahrschule -c "UPDATE termine SET datum = CURRENT_DATE WHERE id = 1;"
```

### Test 1.3 — Keine Duplikate
- [ ] Workflow nochmal ausführen
- [ ] Prüfen: Keine neuen Einträge in `nachrichten_log` (bereits gesendet)
- [ ] Prüfen: Kein zweites WhatsApp an denselben Schüler

### Ergebnis Test 1:
| Test | Status | Notizen |
|---|---|---|
| 1.1 24h Erinnerung | ⬜ PASS / ⬜ FAIL | |
| 1.2 2h Erinnerung | ⬜ PASS / ⬜ FAIL | |
| 1.3 Keine Duplikate | ⬜ PASS / ⬜ FAIL | |

---

## TEST 2: Feedback-Automatik (Google Bewertungen)

**Workflow:** `02 - Feedback-Automatik (Google Bewertungen)`
**Trigger:** Stündlich (Schedule)
**Erwartetes Verhalten:**

### Test 2.1 — Bestandener Schüler bekommt Feedback-Anfrage
- [ ] Schüler-Status auf 'bestanden' setzen
- [ ] Workflow manuell ausführen
- [ ] Prüfen: `nachrichten_log` hat Eintrag mit `typ = 'feedback_anfrage'`
- [ ] WhatsApp "Wie zufrieden? 1-5" wurde gesendet

**SQL Vorbereitung:**
```sql
docker exec postgres psql -U autopilot -d fahrschule -c "UPDATE schueler SET status = 'bestanden' WHERE vorname = 'Lisa';"
```

### Test 2.2 — Aktiver Schüler bekommt KEINE Anfrage
- [ ] Workflow ausführen
- [ ] Prüfen: Max (status='aktiv') bekommt keine Feedback-Anfrage

### Test 2.3 — Keine doppelte Anfrage innerhalb 7 Tage
- [ ] Workflow nochmal ausführen
- [ ] Lisa darf nicht nochmal angeschrieben werden

### Ergebnis Test 2:
| Test | Status | Notizen |
|---|---|---|
| 2.1 Bestanden → Anfrage | ⬜ PASS / ⬜ FAIL | |
| 2.2 Aktiv → Keine Anfrage | ⬜ PASS / ⬜ FAIL | |
| 2.3 Keine Duplikate | ⬜ PASS / ⬜ FAIL | |

---

## TEST 3: Feedback Antwort (5★→Google, sonst intern)

**Workflow:** `03 - Feedback Antwort (5★→Google, sonst intern)`
**Trigger:** Webhook POST
**URL:** `http://YOUR_PI_IP:5678/webhook/feedback-response`

### Test 3.1 — 5 Sterne → Google Review Link
- [ ] Webhook aufrufen mit 5 Sternen
- [ ] Prüfen: `bewertungen` hat neuen Eintrag mit `sterne = 5`
- [ ] Prüfen: `nachrichten_log` hat Eintrag mit `typ = 'google_review_link'`
- [ ] WhatsApp mit Google-Link wurde gesendet

**Curl-Test:**
```bash
curl -X POST http://YOUR_PI_IP:5678/webhook/feedback-response \
  -H "Content-Type: application/json" \
  -d '{"fahrschule_id": 1, "schueler_id": 2, "sterne": 5, "kommentar": "Super Fahrschule!", "vorname": "Lisa"}'
```

### Test 3.2 — 3 Sterne → Internes Feedback
- [ ] Webhook aufrufen mit 3 Sternen
- [ ] Prüfen: `bewertungen` hat Eintrag mit `sterne = 3`
- [ ] Prüfen: `nachrichten_log` hat `typ = 'feedback_danke'` (NICHT google_review_link)

**Curl-Test:**
```bash
curl -X POST http://YOUR_PI_IP:5678/webhook/feedback-response \
  -H "Content-Type: application/json" \
  -d '{"fahrschule_id": 1, "schueler_id": 1, "sterne": 3, "kommentar": "War ok", "vorname": "Max"}'
```

### Test 3.3 — 1 Stern → Internes Feedback (kein Google)
- [ ] Webhook mit 1 Stern
- [ ] Prüfen: Kein Google-Link gesendet

### Ergebnis Test 3:
| Test | Status | Notizen |
|---|---|---|
| 3.1 5★ → Google Link | ⬜ PASS / ⬜ FAIL | |
| 3.2 3★ → Intern | ⬜ PASS / ⬜ FAIL | |
| 3.3 1★ → Intern | ⬜ PASS / ⬜ FAIL | |

---

## TEST 4: Zahlungserinnerungen

**Workflow:** `04 - Zahlungserinnerungen`
**Trigger:** Täglich (Schedule)
**Erwartetes Verhalten:**

### Test 4.1 — Offene Zahlung → Erinnerung
- [ ] Workflow manuell ausführen
- [ ] Prüfen: Max (450€ offen) bekommt Erinnerung
- [ ] Prüfen: Tom (200€ offen) bekommt Erinnerung
- [ ] Prüfen: `nachrichten_log` hat Einträge mit `typ = 'zahlungserinnerung'`
- [ ] Prüfen: `zahlungen` → `erinnerung_gesendet = true`

**SQL zum Verifizieren:**
```sql
docker exec postgres psql -U autopilot -d fahrschule -c "SELECT s.vorname, z.betrag, z.erinnerung_gesendet FROM zahlungen z JOIN schueler s ON z.schueler_id = s.id;"
```

### Test 4.2 — Bezahlte Zahlung → KEINE Erinnerung
- [ ] Eine Zahlung als bezahlt markieren
- [ ] Workflow ausführen
- [ ] Prüfen: Keine Erinnerung für bezahlte Zahlung

**SQL Vorbereitung:**
```sql
docker exec postgres psql -U autopilot -d fahrschule -c "UPDATE zahlungen SET status = 'bezahlt', bezahlt_am = NOW() WHERE schueler_id = 3;"
```

### Test 4.3 — Keine Erinnerung innerhalb 7 Tage nach letzter
- [ ] Workflow nochmal ausführen
- [ ] Max darf nicht nochmal erinnert werden (erst nach 7 Tagen)

### Ergebnis Test 4:
| Test | Status | Notizen |
|---|---|---|
| 4.1 Offene Zahlung → Erinnerung | ⬜ PASS / ⬜ FAIL | |
| 4.2 Bezahlt → Keine Erinnerung | ⬜ PASS / ⬜ FAIL | |
| 4.3 7-Tage Cooldown | ⬜ PASS / ⬜ FAIL | |

---

## TEST 5: Wartelisten-Management (Absage → Nächster)

**Workflow:** `05 - Wartelisten-Management (Absage → Nächster)`
**Trigger:** Webhook POST
**URL:** `http://YOUR_PI_IP:5678/webhook/termin-absage`

### Test 5.1 — Absage → Warteliste-Schüler kontaktiert
- [ ] Webhook aufrufen (Max sagt 10:00 Termin ab)
- [ ] Prüfen: `termine` → Termin ID 1 status = 'abgesagt'
- [ ] Prüfen: Tom (auf Warteliste für 10:00) bekommt Angebot
- [ ] Prüfen: `nachrichten_log` hat `typ = 'warteliste_angebot'`
- [ ] Prüfen: `warteliste` → Tom status = 'angefragt'

**Curl-Test:**
```bash
curl -X POST http://YOUR_PI_IP:5678/webhook/termin-absage \
  -H "Content-Type: application/json" \
  -d '{"termin_id": 1}'
```

**SQL zum Verifizieren:**
```sql
docker exec postgres psql -U autopilot -d fahrschule -c "SELECT * FROM termine WHERE id = 1;"
docker exec postgres psql -U autopilot -d fahrschule -c "SELECT * FROM warteliste;"
docker exec postgres psql -U autopilot -d fahrschule -c "SELECT * FROM nachrichten_log WHERE typ = 'warteliste_angebot';"
```

### Test 5.2 — Absage ohne Warteliste → Kein Fehler
- [ ] Webhook für Termin ohne Wartelisten-Match
- [ ] Workflow läuft durch ohne Fehler
- [ ] Keine WhatsApp gesendet

**Curl-Test:**
```bash
curl -X POST http://YOUR_PI_IP:5678/webhook/termin-absage \
  -H "Content-Type: application/json" \
  -d '{"termin_id": 2}'
```

### Ergebnis Test 5:
| Test | Status | Notizen |
|---|---|---|
| 5.1 Absage → Warteliste kontaktiert | ⬜ PASS / ⬜ FAIL | |
| 5.2 Absage ohne Warteliste → OK | ⬜ PASS / ⬜ FAIL | |

---

## INTEGRATION TESTS

### Test 6 — End-to-End: Kompletter Schüler-Lifecycle
1. [ ] Neuer Schüler wird angelegt
2. [ ] Termin wird erstellt für morgen
3. [ ] 24h Erinnerung wird gesendet
4. [ ] 2h Erinnerung wird gesendet
5. [ ] Schüler besteht Prüfung → status = 'bestanden'
6. [ ] Feedback-Anfrage wird gesendet
7. [ ] Schüler gibt 5 Sterne → Google Review Link
8. [ ] Offene Zahlung → Zahlungserinnerung
9. [ ] Alle Nachrichten im Log

**SQL für kompletten Lifecycle:**
```sql
-- 1. Neuer Schüler
docker exec postgres psql -U autopilot -d fahrschule -c "
INSERT INTO schueler (fahrschule_id, fahrlehrer_id, vorname, nachname, whatsapp, offener_betrag)
VALUES (1, 1, 'TestUser', 'Lifecycle', '+4915199999999', 300.00);
"

-- 2. Termin morgen
docker exec postgres psql -U autopilot -d fahrschule -c "
INSERT INTO termine (fahrschule_id, schueler_id, fahrlehrer_id, datum, uhrzeit)
VALUES (1, (SELECT id FROM schueler WHERE vorname='TestUser'), 1, CURRENT_DATE + 1, '16:00');
"

-- 5. Bestanden
docker exec postgres psql -U autopilot -d fahrschule -c "
UPDATE schueler SET status = 'bestanden' WHERE vorname = 'TestUser';
"

-- 8. Zahlung
docker exec postgres psql -U autopilot -d fahrschule -c "
INSERT INTO zahlungen (fahrschule_id, schueler_id, betrag, beschreibung, created_at)
VALUES (1, (SELECT id FROM schueler WHERE vorname='TestUser'), 300.00, 'Lifecycle Test', NOW() - INTERVAL '5 days');
"
```

### Test 7 — Stress Test
- [ ] 50 Schüler anlegen mit Terminen
- [ ] Alle Workflows gleichzeitig laufen lassen
- [ ] CPU/RAM Auslastung prüfen
- [ ] Keine Fehler in n8n Execution Log

---

## RESET: Datenbank zurücksetzen nach Tests

```sql
docker exec postgres psql -U autopilot -d fahrschule -c "
DELETE FROM nachrichten_log;
DELETE FROM bewertungen;
DELETE FROM warteliste;
DELETE FROM zahlungen;
DELETE FROM termine;
DELETE FROM schueler WHERE vorname = 'TestUser';
UPDATE termine SET erinnerung_24h_gesendet = false, erinnerung_2h_gesendet = false;
UPDATE zahlungen SET erinnerung_gesendet = false, erinnerung_datum = NULL;
"
```

---

## Zusammenfassung

| Workflow | Tests | Bestanden | Fehlgeschlagen |
|---|---|---|---|
| 01 Termin-Erinnerungen | 3 | ⬜ | ⬜ |
| 02 Feedback-Automatik | 3 | ⬜ | ⬜ |
| 03 Feedback Antwort | 3 | ⬜ | ⬜ |
| 04 Zahlungserinnerungen | 3 | ⬜ | ⬜ |
| 05 Wartelisten-Management | 2 | ⬜ | ⬜ |
| 06 End-to-End Lifecycle | 1 | ⬜ | ⬜ |
| 07 Stress Test | 1 | ⬜ | ⬜ |
| **GESAMT** | **16** | **⬜/16** | **⬜/16** |

---

*Erstellt am 28.03.2026 von Fahrschule Autopilot Test Suite*
