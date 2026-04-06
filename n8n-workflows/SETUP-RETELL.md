# Setup-Anleitung: Telefon-Assistent (Agent 2)

## Übersicht

Der Telefon-Assistent nimmt Anrufe 24/7 entgegen, beantwortet FAQ, erfasst Kontaktdaten und leitet bei Bedarf an den Fahrlehrer weiter. Nach jedem Anruf werden die Daten automatisch im CRM (Google Sheets) gespeichert und Follow-Up-Nachrichten per WhatsApp gesendet.

**Datenfluss:**
```
Anruf → Retell.ai → Webhook (Next.js) → n8n → Google Sheets + WhatsApp + Inhaber-Benachrichtigung
```

---

## Schritt 1: Google Sheets vorbereiten

Erstelle ein Google Spreadsheet mit dem Namen "Fahrschule Autopilot - Telefon" und folgenden Sheets:

### Sheet "Anrufe" — Spalten:
```
Call_ID | Status | Anrufer_Nummer | Richtung | Gestartet_Um | Agent_ID | Dauer_Sekunden | Dauer_Formatiert | Transkription | Recording_URL | Trennungsgrund | Beendet_Um | Zusammenfassung | Stimmung | Intent | Anrufer_Name | Anrufer_Telefon | Anrufer_Email | Fuehrerscheinklasse | Bevorzugte_Zeit | Dringlichkeit | Braucht_FollowUp | Braucht_Review | Ist_Neuer_Lead | Analysiert_Um
```

### Sheet "Leads" — Spalten:
```
Name | Telefon | Email | Quelle | Intent | Fuehrerscheinklasse | Bevorzugte_Zeit | Dringlichkeit | Stimmung | Zusammenfassung | Call_ID | Erstellt_Am | Status | FollowUp_Gesendet
```

### Sheet "Analytics_Telefon" — Spalten:
```
Datum | Call_ID | Dauer_Sekunden | Intent | Stimmung | Ist_Lead | FollowUp_Noetig | Fuehrerscheinklasse
```

### Sheet "Fehler_Log" — Spalten:
```
Datum | Typ | Empfaenger | Nachricht | Fehler | Call_ID
```

---

## Schritt 2: Retell.ai einrichten

1. **Account erstellen:** https://app.retell.ai/signup
2. **Agent erstellen:**
   - Name: "Fahrschul-Assistent"
   - Prompt: Inhalt aus `retell-config/agent-prompt.md` kopieren
   - ALLE Platzhalter [FAHRSCHULNAME], [PREIS] etc. ersetzen!
3. **Voice auswaehlen:**
   - ElevenLabs > Suche "German" > Weibliche Stimme testen
   - Empfohlen: Natuerlich klingende Stimme, nicht zu schnell
4. **Telefonnummer kaufen:**
   - Deutsche Nummer (+49)
   - Am besten Ortsnetz der Stadt (z.B. +49 911 fuer Nuernberg)
   - Kosten: ca. $2/Monat
5. **Call Settings:**
   - Max Duration: 5 Minuten
   - Silence Timeout: 15 Sekunden
   - Responsiveness: 0.6
   - Interruption Sensitivity: 0.6
6. **Webhook konfigurieren:**
   - URL: `https://fahrschulautopilot.de/api/retell`
   - Events: call_started, call_ended, call_analyzed
7. **Call Analysis aktivieren:**
   - Summary: Aktiviert
   - Sentiment: Aktiviert
   - Custom Fields: Siehe `retell-config/agent-prompt.md` (Abschnitt "Call Analysis")
8. **Transfer einrichten:**
   - Nummer: Telefonnummer des Fahrlehrers/Bueros

---

## Schritt 3: Environment Variables setzen

In Vercel Dashboard oder `.env.local`:

```env
# Retell.ai
RETELL_API_KEY=ret_xxxxxxxxxxxxxxxxxxxxx

# n8n Webhook URL (nach Import des Workflows)
WEBHOOK_RETELL_URL=https://n8n.yourdomain.com/webhook/retell-events
```

---

## Schritt 4: n8n Workflow importieren

1. n8n Dashboard oeffnen
2. "Import Workflow" > Datei waehlen: `n8n-workflows/retell-telefon-assistent.json`
3. Platzhalter ersetzen:
   - `SPREADSHEET_ID_HIER` → Google Sheets ID (aus der URL)
   - `GOOGLE_SHEETS_CREDENTIALS` → Google Sheets OAuth2 Credentials
   - `INHABER_TELEFONNUMMER` → WhatsApp-Nummer des Inhabers
   - `FAHRSCHULNAME` und `WEBSITE` in der Follow-Up-Nachricht
   - `CALENDLY_URL` → Calendly-Buchungslink der Fahrschule
4. Google Sheets Credentials verbinden
5. Workflow aktivieren
6. Webhook-URL kopieren und in Vercel als `WEBHOOK_RETELL_URL` setzen

---

## Schritt 5: Testen

### Testanrufe durchfuehren:

| Test | Szenario | Erwartetes Ergebnis |
|------|----------|---------------------|
| 1 | Preisanfrage Klasse B | Preise genannt, Beratungstermin vorgeschlagen |
| 2 | Anmeldung komplett | Name+Nummer aufgenommen, Website-Link erwaehnt |
| 3 | BF17-Frage | BF17-Infos gegeben, Eltern-Beratung angeboten |
| 4 | "Ich will einen Menschen sprechen" | Transfer an Fahrlehrer |
| 5 | Beschwerde | Transfer + Inhaber-Benachrichtigung |
| 6 | Auffrischungsstunde | Info gegeben, Termin vorgeschlagen |
| 7 | Auslaendischer Fuehrerschein | Beratungstermin empfohlen |
| 8 | Stille (Anrufer sagt nichts) | Timeout-Nachricht nach 15s |

### Checklist nach jedem Test:

- [ ] Anruf in Sheet "Anrufe" eingetragen?
- [ ] Call Analysis (Summary, Sentiment, Intent) korrekt?
- [ ] Name/Telefon korrekt extrahiert?
- [ ] Lead in Sheet "Leads" angelegt (wenn Anmeldung/Termin)?
- [ ] WhatsApp Follow-Up gesendet?
- [ ] Bei Beschwerde: Inhaber per WhatsApp benachrichtigt?
- [ ] Analytics in Sheet "Analytics_Telefon" geloggt?

---

## Schritt 6: Go Live

1. Retell-Telefonnummer auf der Website anzeigen (PhoneAssistantSection)
2. Nummer in Google My Business eintragen
3. Nummer auf Visitenkarten/Flyern der Fahrschule

---

## Troubleshooting

| Problem | Loesung |
|---------|---------|
| Webhook kommt nicht an | WEBHOOK_RETELL_URL pruefen, n8n Workflow aktiv? |
| Signatur-Fehler 401 | RETELL_API_KEY in .env.local pruefen |
| Google Sheets schreibt nicht | Credentials in n8n pruefen, Sheet-Name exakt? |
| WhatsApp wird nicht gesendet | WhatsApp-Service laeuft? (Docker: `docker ps`) |
| AI antwortet auf Englisch | Retell Agent Language auf "de-DE" pruefen |
| Anrufer wird nicht verbunden (Transfer) | Transfer-Nummer in Retell Dashboard pruefen |
| Anruf bricht nach 5 Min ab | Max Duration ist 5 Min — bei Bedarf erhoehen |

---

## Kosten pro Kunde

| Posten | Kosten |
|--------|--------|
| Retell.ai (LLM + Voice) | ~EUR0.30-0.65/Anruf |
| Telefonnummer | ~EUR2/Monat |
| n8n (self-hosted) | EUR0 (laeuft auf VPS) |
| Google Sheets | EUR0 |
| WhatsApp Follow-Up | ~EUR0.05/Nachricht |
| **Gesamt bei 10 Anrufen/Tag** | **~EUR100-200/Monat** |
