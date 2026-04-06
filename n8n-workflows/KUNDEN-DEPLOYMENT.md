# Fahrschule Autopilot — Kunden-Deployment in 15 Minuten

## Voraussetzungen (einmalig fuer DICH als Anbieter)
- n8n Cloud Account ODER selbst-gehostetes n8n
- Twilio Account mit WhatsApp Sandbox oder Business Profile
- Anthropic API Key (fuer den FAQ-Bot)

---

## Fuer jeden neuen Kunden: 5 Schritte

### Schritt 1: Google Sheet erstellen (3 Min)

1. Oeffne Google Sheets → Neues Sheet erstellen
2. Importiere die CSV-Dateien aus `google-sheets-template/`:
   - Tab "Schueler" ← `schueler.csv` (loesche die Test-Daten, behalte Header)
   - Tab "Termine" ← `termine.csv`
   - Tab "Zahlungen" ← `zahlungen.csv`
   - Tab "Buchungen" ← `buchungen.csv`
   - Tab "Warteliste" ← `warteliste.csv`
3. Erstelle leere Tabs fuer alle Log-Sheets (siehe `log-sheets.csv` fuer Header)
4. Kopiere die Sheet-ID aus der URL

### Schritt 2: Sheet-ID in alle Workflows eintragen (1 Min)

```bash
cd n8n-workflows/
./configure-all.sh DEINE_GOOGLE_SHEET_ID
```

Fertig! Alle 13 Workflow-Dateien sind konfiguriert.

### Schritt 3: Workflows in n8n importieren (3 Min)

1. n8n oeffnen → Menu → Import from File
2. Alle `*-twilio.json` Dateien importieren (11 Stueck)
3. In jedem Workflow: Credentials zuweisen (Twilio + Google Sheets + SMTP)

### Schritt 4: Environment Variables fuer den Kunden setzen (3 Min)

n8n → Settings → Environment Variables:

```
FAHRSCHUL_NAME=Fahrschule Kundenname
FAHRSCHULINHABER_TELEFON=+49XXXXXX
FAHRLEHRER_TELEFON=+49XXXXXX
FAHRSCHUL_ADRESSE=Strasse, PLZ Ort
FAHRSCHUL_TELEFON=+49XXXXXX
OEFFNUNGSZEITEN=Mo-Fr 9-18 Uhr, Sa 9-13 Uhr
KOSTEN_KLASSE_B=ca. 2.800-3.500 EUR
THEORIE_ZEITEN=Di + Do, 18:30-20:00 Uhr
WEBSITE_URL=https://kunden-website.de
GOOGLE_REVIEW_LINK=https://g.page/r/XXXX
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
N8N_WEBHOOK_BASE_URL=https://kunden-n8n.app.n8n.cloud
ANTHROPIC_API_KEY=sk-ant-XXXX
EMAIL_FROM=info@fahrschule-kunde.de
FAHRLEHRER_CONFIG={"default":"+49XXX","Schmidt":"+49XXX"}
```

### Schritt 5: Testen (5 Min)

```bash
export N8N_WEBHOOK_BASE_URL=https://kunden-n8n.app.n8n.cloud
export TEST_TELEFON=+49DEINENUMMER
export TEST_EMAIL=deine@email.de
./test-all-workflows.sh
```

Das Script testet alle 8 Webhook-Endpoints und zeigt dir:
- ✅ Gruener Haken = HTTP-Response OK
- ❌ Roter Haken = Etwas stimmt nicht
- 👉 Gelbe Hinweise = Was du manuell pruefen musst (WhatsApp + Sheet)

### Danach: Workflows aktivieren

In n8n jeden Workflow oeffnen → Toggle oben rechts auf **Active**.

Reihenfolge:
1. `inbound-faq-bot` (zuerst, weil andere darauf verweisen)
2. `termin-erinnerungen`
3. `onboarding-flow`
4. Alle anderen

---

## Pro Kunde: Checkliste

```
□ Google Sheet erstellt + Sheet-ID notiert
□ configure-all.sh ausgefuehrt
□ Workflows importiert (11 Stueck)
□ Credentials zugewiesen (Twilio + Google Sheets + SMTP)
□ Environment Variables gesetzt (14 Stueck)
□ test-all-workflows.sh ausgefuehrt — 8/8 bestanden
□ WhatsApp-Nachrichten kommen an
□ E-Mail kommt an
□ Google Sheet wird beschrieben
□ Alle Workflows aktiviert
□ Kunden-Telefonnummer in Twilio Sandbox registriert
□ Erste echte Anmeldung als Test durchgefuehrt
```

---

## Kosten pro Kunde

| Posten | Monatlich |
|--------|----------|
| Twilio WhatsApp (50 Schueler) | ~30-50 EUR |
| Claude Opus API (FAQ-Bot) | ~10-20 EUR |
| n8n Cloud (oder anteilig self-hosted) | ~15-20 EUR |
| Google Sheets | 0 EUR |
| SMTP (Gmail/Strato) | 0-5 EUR |
| **Gesamt Infrastruktur** | **~55-95 EUR** |

---

## Troubleshooting

| Problem | Loesung |
|---------|---------|
| WhatsApp kommt nicht an | Twilio Console → Logs pruefen. Sandbox aktiv? Nummer registriert? |
| Google Sheet "Permission denied" | Credential in n8n pruefen. Sheet fuer Service-Account freigeben. |
| FAQ-Bot antwortet nicht | ANTHROPIC_API_KEY pruefen. Claude API Guthaben checken. |
| E-Mail kommt nicht an | SMTP Credentials pruefen. Spam-Ordner checken. |
| Webhook gibt 404 | Workflow in n8n aktiviert? URL korrekt? N8N_WEBHOOK_BASE_URL richtig? |
| "Execution failed" in n8n | Workflow oeffnen → letzte Execution → Fehlerdetails lesen |
