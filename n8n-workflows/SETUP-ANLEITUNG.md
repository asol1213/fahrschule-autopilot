# Fahrschule Autopilot — Komplette Setup-Anleitung

## Uebersicht: Alle Workflows

| #  | Workflow | Datei | Trigger | Beschreibung |
|----|---------|-------|---------|-------------|
| 1  | Termin-Erinnerungen | `termin-erinnerungen-twilio.json` | Alle 15 Min | 24h + 2h Erinnerungen vor Fahrstunden |
| 2  | Feedback & Bewertungen | `feedback-bewertungen-twilio.json` | Stuendlich + Webhook | Google-Bewertungen nach Pruefung |
| 3  | Terminbuchung | `terminbuchung-twilio.json` | Webhook | Online-Terminbuchung + Fahrlehrer-Notification |
| 4  | Zahlungserinnerungen | `zahlungserinnerungen-twilio.json` | Alle 6h | 3-stufig: Tag 7, 14, 21 nach Faelligkeit |
| 5  | Onboarding-Flow | `onboarding-flow-twilio.json` | Webhook + Alle 12h | Willkommen (WA + E-Mail) + Dokumente + Follow-Ups + Theorie-Termin |
| 6  | Empfehlung & Glueckwuensche | `empfehlung-und-glueckwuensche-twilio.json` | Alle 2h | Pruefungsbestaetigung, Glueckwuensche, Empfehlung |
| 7  | Theorie & Dokumente Reminder | `theorie-und-dokumente-reminder-twilio.json` | Taeglich 18 Uhr | Theorie-Trainer + fehlende Dokumente Reminder |
| 8  | Inbound FAQ-Bot | `inbound-faq-bot-twilio.json` | Webhook | Claude Opus AI: FAQ + Verschiebung + Absage + Dokument + Beschwerde |
| 9  | Wartelisten-Management | `wartelisten-management-twilio.json` | Webhook + Stuendlich | Freie Slots + 4h Timeout-Fallback + JA/NEIN Handler |
| 10 | Fahrlehrer-Zuweisung | `fahrlehrer-zuweisung-twilio.json` | Webhook | Schueler + Fahrlehrer gleichzeitig benachrichtigen |
| 11 | DSGVO Archivierung | `dsgvo-archivierung-twilio.json` | Monatlich (1. um 3 Uhr) | Automatische Anonymisierung + Archivierung nach 6 Monaten |

---

## Schritt 1: n8n installieren

### Option A: n8n Cloud (empfohlen zum Start)
- Geh zu https://n8n.cloud
- Account erstellen (14 Tage kostenlos, danach ab ~20 EUR/Monat)

### Option B: Selbst hosten (Hetzner CX31, ~15 EUR/Monat)
```bash
docker run -d --restart unless-stopped \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  --name n8n \
  n8nio/n8n
```

Oder mit Docker Compose (siehe `docker-compose.yml` im Hauptverzeichnis).

---

## Schritt 2: Twilio Account einrichten

1. https://www.twilio.com/try-twilio
2. Account erstellen (kostenlos zum Testen)
3. WhatsApp Sandbox aktivieren:
   - Console → Messaging → Try it out → Send a WhatsApp message
4. Fuer Produktion: WhatsApp Business Profile beantragen (~1-2 Wochen)

### Twilio Kosten pro Fahrschule:
- WhatsApp Template Message: ~0,04 EUR/Nachricht
- Bei 50 Schuelern, alle Workflows aktiv: ~30-50 EUR/Monat

---

## Schritt 3: Alle Workflows importieren

1. In n8n: Menu → Import from File
2. Alle `.json` Dateien aus `/n8n-workflows/` importieren
3. Workflows werden geladen aber sind noch inaktiv

---

## Schritt 4: Credentials einrichten

### Twilio:
- Settings → Credentials → Add Credential → Twilio
- Account SID + Auth Token von Twilio Console

### Google Sheets:
- Settings → Credentials → Add Credential → Google Sheets OAuth2
- Google Cloud Console → Sheets API aktivieren → OAuth Credentials erstellen

### Anthropic (fuer FAQ-Bot):
- Settings → Credentials → Add Credential → HTTP Header Auth
- Oder nutze die Environment Variable `ANTHROPIC_API_KEY`

---

## Schritt 5: Umgebungsvariablen setzen

In n8n → Settings → Environment Variables:

### Pflicht:
```
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FAHRSCHUL_NAME=Fahrschule Muster
FAHRSCHULINHABER_TELEFON=+491721234567
FAHRLEHRER_TELEFON=+491721234567
WEBSITE_URL=https://fahrschulautopilot.de
ANTHROPIC_API_KEY=sk-ant-...
N8N_WEBHOOK_BASE_URL=https://dein-n8n.server.de  (kein trailing slash!)
EMAIL_FROM=info@deine-fahrschule.de
```

### Optional aber empfohlen:
```
FAHRSCHUL_ADRESSE=Musterstrasse 1, 90402 Nuernberg
FAHRSCHUL_TELEFON=+4991112345
OEFFNUNGSZEITEN=Mo-Fr 9-18 Uhr, Sa 9-13 Uhr
KOSTEN_KLASSE_B=ca. 2.500-3.500 EUR
THEORIE_ZEITEN=Di + Do, 18:30-20:00 Uhr
GOOGLE_REVIEW_LINK=https://g.page/r/...
```

### Neue Credentials (Workflow 5 + 10):
- **SMTP** fuer Willkommens-E-Mail: Settings → Credentials → SMTP
  - Host, Port, User, Password des E-Mail-Providers
  - Gmail: smtp.gmail.com, Port 587, App-Passwort
  - Strato/Ionos: smtp.strato.de, Port 587

### Fahrlehrer-Konfiguration (fuer Terminbuchung):
```
FAHRLEHRER_CONFIG={"default":"+491721234567","Schmidt":"+491721234567","Klein":"+491739876543"}
```

---

## Schritt 6: Google Sheets einrichten

Erstelle ein Google Sheet mit folgenden Tabellenlaettern:

### Sheet: "Termine"
| Datum | Uhrzeit | Schueler | Telefon | Fahrlehrer | Art | Status |
|-------|---------|----------|---------|------------|-----|--------|

### Sheet: "Schueler"
| Schueler_ID | Name | Telefon | Email | Klasse | Anmelde_Datum | Status | Dokumente_Status | Fehlende_Dokumente | Theorie_Status | Letzte_Theorie_Aktivitaet | Pruefung_Datum | Pruefung_Ergebnis | Pruefung_Bestanden | Feedback_Status |
|-------------|------|---------|-------|--------|---------------|--------|------------------|--------------------|----------------|---------------------------|----------------|-------------------|--------------------|-----------------|

### Sheet: "Zahlungen"
| Rechnungs_Nr | Schueler | Telefon | Betrag | Beschreibung | Faellig | Status |
|-------------|----------|---------|--------|-------------|---------|--------|

### Sheet: "Warteliste"
| Schueler | Telefon | Wunsch_Tage | Wunsch_Zeiten | Fahrlehrer | Prioritaet | Status |
|----------|---------|-------------|---------------|------------|------------|--------|

### Sheet: "Buchungen"
| Buchungs_ID | Schueler | Telefon | Email | Wunsch_Datum | Wunsch_Zeit | Art | Status |
|-------------|----------|---------|-------|--------------|-------------|-----|--------|

### Sheet: "Archiv"
| Schueler_ID | Name_Anonymisiert | Telefon_Anonymisiert | Klasse | Letzter_Status | Archiv_Grund | Archiviert_am |
|-------------|-------------------|----------------------|--------|----------------|-------------|---------------|

### Log-Sheets (werden automatisch befuellt):
- "Gesendet" — Termin-Erinnerungen Log
- "Feedback_Log" — Bewertungs-Anfragen Log
- "Zahlungserinnerungen_Log" — Mahnungen Log
- "Onboarding_Log" — Onboarding-Schritte Log
- "Pruefung_Nachrichten_Log" — Pruefungs-Nachrichten Log
- "Reminder_Log" — Theorie/Dokumente Reminder Log
- "Nachrichten_Log" — Alle eingehenden WhatsApp-Nachrichten
- "Wartelisten_Log" — Wartelisten-Angebote Log
- "Verschiebungen_Log" — Terminverschiebungs-Anfragen
- "Beschwerden_Log" — Beschwerden-Eskalationen
- "Zuweisungen_Log" — Fahrlehrer-Zuweisungen
- "DSGVO_Log" — Opt-Out + Archivierungs-Audit-Trail
- "Archiv" — Anonymisierte archivierte Schueler-Daten

---

## Schritt 7: Workflows aktivieren

1. Jeden Workflow oeffnen
2. "SPREADSHEET_ID_HIER" durch die echte Google Sheet ID ersetzen
3. Credentials zuweisen (Twilio + Google Sheets)
4. Workflow aktivieren (Toggle oben rechts)
5. Testen mit "Execute Workflow"

---

## Schritt 8: Webhook-URLs konfigurieren

Folgende Webhook-URLs muessen in der Website / im CRM konfiguriert werden:

| Endpoint | Methode | Zweck |
|----------|---------|-------|
| `/webhook/neue-anmeldung` | POST | Neue Schueler-Anmeldung → Onboarding starten |
| `/webhook/terminbuchung` | POST | Terminbuchung von Website |
| `/webhook/whatsapp-inbound` | POST | Eingehende WhatsApp → Zentraler FAQ-Bot/Router |
| `/webhook/feedback-trigger` | POST | Manuell Feedback-Anfrage ausloesen |
| `/webhook/termin-absage` | POST | Terminabsage → Warteliste aktivieren |
| `/webhook/warteliste-antwort` | POST | JA/NEIN des Schuelers auf Wartelisten-Angebot |
| `/webhook/feedback-response` | POST | Eingehende Feedback-Bewertung (1-5 Sterne) |
| `/webhook/fahrlehrer-zuweisung` | POST | Fahrlehrer einem Schueler zuweisen → beide benachrichtigen |

---

## Architektur-Uebersicht

```
Schueler (WhatsApp)
    │
    ├── Ausgehend (Proaktiv)
    │   ├── Termin-Erinnerungen (24h + 2h)
    │   ├── Zahlungserinnerungen (3-stufig)
    │   ├── Onboarding (Willkommen + Follow-Ups)
    │   ├── Pruefung (Bestaetigung + Glueckwuensche)
    │   ├── Empfehlungsnachricht
    │   ├── Theorie-Trainer Reminder
    │   └── Dokumente-Erinnerung
    │
    ├── Eingehend (Reaktiv)
    │   ├── FAQ-Bot (AI-Claude) → Automatische Antwort
    │   ├── Absage → Fahrlehrer + Warteliste
    │   ├── Dokument → Bestaetigung + Inhaber
    │   ├── Beschwerde → Eskalation an Inhaber
    │   └── Bewertung → Google-Review oder internes Feedback
    │
    └── Management
        ├── Warteliste → Top 3 Kandidaten kontaktieren
        └── Terminbuchung → Fahrlehrer-Zuweisung + Bestaetigung

Alle Events → Google Sheets Logging
Kritische Events → Inhaber-Benachrichtigung
```

---

## Kosten-Kalkulation pro Fahrschule

| Posten | Geschaetzt |
|--------|-----------|
| Twilio WhatsApp (50 Schueler) | ~30-50 EUR/Monat |
| Claude API (FAQ-Bot) | ~5-15 EUR/Monat |
| n8n (self-hosted) | ~15 EUR/Monat |
| Google Sheets | 0 EUR |
| **Gesamt Infrastruktur** | **~50-80 EUR/Monat** |
