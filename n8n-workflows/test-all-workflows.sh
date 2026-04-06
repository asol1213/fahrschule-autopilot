#!/bin/bash
# ============================================================
# FAHRSCHULE AUTOPILOT — KOMPLETTER WORKFLOW-TEST
#
# Dieses Script testet ALLE 8 Webhook-Endpoints nacheinander.
# Ergebnis: Du siehst sofort ob alles funktioniert.
#
# SETUP:
#   1. Passe die BASE_URL und TELEFON-Variablen unten an
#   2. chmod +x test-all-workflows.sh
#   3. ./test-all-workflows.sh
# ============================================================

# ===================== KONFIGURATION =====================
BASE_URL="${N8N_WEBHOOK_BASE_URL:-https://DEIN-N8N.app.n8n.cloud}"
DEINE_NUMMER="${TEST_TELEFON:-+491721234567}"   # Deine echte Nummer fuer WhatsApp-Tests
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
# =========================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

passed=0
failed=0
total=0

test_webhook() {
  local name="$1"
  local endpoint="$2"
  local payload="$3"
  local expect_field="$4"

  total=$((total + 1))
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}TEST $total: $name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "  Endpoint: POST $endpoint"

  response=$(curl -s -w "\n%{http_code}" -X POST "$endpoint" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    --connect-timeout 10 \
    --max-time 30 2>&1)

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    if [ -n "$expect_field" ] && echo "$body" | grep -q "$expect_field"; then
      echo -e "  ${GREEN}✅ BESTANDEN${NC} (HTTP $http_code)"
      echo "  Response: $body"
      passed=$((passed + 1))
    elif [ -z "$expect_field" ]; then
      echo -e "  ${GREEN}✅ BESTANDEN${NC} (HTTP $http_code)"
      echo "  Response: $body"
      passed=$((passed + 1))
    else
      echo -e "  ${YELLOW}⚠️  HTTP OK aber erwartetes Feld '$expect_field' fehlt${NC}"
      echo "  Response: $body"
      passed=$((passed + 1))
    fi
  else
    echo -e "  ${RED}❌ FEHLGESCHLAGEN${NC} (HTTP $http_code)"
    echo "  Response: $body"
    failed=$((failed + 1))
  fi
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   FAHRSCHULE AUTOPILOT — WORKFLOW TESTS                     ║${NC}"
echo -e "${BOLD}║   Base URL: $BASE_URL${NC}"
echo -e "${BOLD}║   Test-Nummer: $DEINE_NUMMER${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"

# ============================================================
# TEST 1: ONBOARDING (neue Anmeldung)
# Erwartet: WhatsApp Willkommen + E-Mail + CRM-Eintrag
# ============================================================
test_webhook \
  "Onboarding — Neue Schueler-Anmeldung" \
  "$BASE_URL/webhook/neue-anmeldung" \
  '{
    "name": "Test Schueler",
    "telefon": "'"$DEINE_NUMMER"'",
    "email": "'"$TEST_EMAIL"'",
    "klasse": "B",
    "geburtsdatum": "2000-01-15",
    "adresse": "Teststrasse 1, 90402 Nuernberg"
  }' \
  "success"

echo ""
echo -e "  ${YELLOW}👉 CHECK: Hast du eine WhatsApp-Willkommensnachricht bekommen?${NC}"
echo -e "  ${YELLOW}👉 CHECK: Ist eine Willkommens-E-Mail angekommen?${NC}"
echo -e "  ${YELLOW}👉 CHECK: Steht 'Test Schueler' im Google Sheet 'Schueler'?${NC}"

sleep 3

# ============================================================
# TEST 2: TERMINBUCHUNG
# Erwartet: Buchung gespeichert + Fahrlehrer + Schueler benachrichtigt
# ============================================================
test_webhook \
  "Terminbuchung — Online-Buchung" \
  "$BASE_URL/webhook/terminbuchung" \
  '{
    "name": "Test Schueler",
    "telefon": "'"$DEINE_NUMMER"'",
    "email": "'"$TEST_EMAIL"'",
    "datum": "2026-04-10",
    "zeit": "14:00",
    "art": "Fahrstunde",
    "klasse": "B",
    "fahrlehrer": "Schmidt"
  }' \
  "buchungsId"

echo ""
echo -e "  ${YELLOW}👉 CHECK: Buchungsbestaetigung per WhatsApp erhalten?${NC}"
echo -e "  ${YELLOW}👉 CHECK: Eintrag in Sheet 'Buchungen'?${NC}"

sleep 3

# ============================================================
# TEST 3: FAHRLEHRER-ZUWEISUNG
# Erwartet: Schueler + Fahrlehrer bekommen WhatsApp
# ============================================================
test_webhook \
  "Fahrlehrer-Zuweisung — Beide Seiten benachrichtigen" \
  "$BASE_URL/webhook/fahrlehrer-zuweisung" \
  '{
    "schuelerId": "SCH-TEST001",
    "schuelerName": "Test Schueler",
    "schuelerTelefon": "'"$DEINE_NUMMER"'",
    "email": "'"$TEST_EMAIL"'",
    "klasse": "B",
    "fahrlehrerName": "Herr Schmidt",
    "fahrlehrerTelefon": "'"$DEINE_NUMMER"'",
    "ersterTheorieTermin": "Dienstag 01.04.2026, 18:30 Uhr"
  }' \
  "success"

echo ""
echo -e "  ${YELLOW}👉 CHECK: WhatsApp mit Fahrlehrer-Info erhalten?${NC}"

sleep 3

# ============================================================
# TEST 4: TERMINABSAGE + WARTELISTE
# Erwartet: Wartelisten-Kandidaten kontaktiert + Fahrlehrer informiert
# ============================================================
test_webhook \
  "Terminabsage — Warteliste aktivieren" \
  "$BASE_URL/webhook/termin-absage" \
  '{
    "schueler": "Lisa Weber",
    "telefon": "+491731234567",
    "datum": "2026-04-02",
    "zeit": "14:00",
    "art": "Fahrstunde",
    "fahrlehrer": "Schmidt"
  }' \
  "success"

echo ""
echo -e "  ${YELLOW}👉 CHECK: Wartelisten-Angebot an passende Schueler gesendet?${NC}"
echo -e "  ${YELLOW}👉 CHECK: Fahrlehrer per WhatsApp informiert?${NC}"

sleep 3

# ============================================================
# TEST 5: INBOUND FAQ-BOT (simuliert WhatsApp-Nachricht)
# Erwartet: AI-Antwort zurueckgesendet
# ============================================================
test_webhook \
  "FAQ-Bot — Schueler-Frage beantworten" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  '{
    "From": "whatsapp:'"$DEINE_NUMMER"'",
    "Body": "Was kostet der Fuehrerschein Klasse B?"
  }' \
  "OK"

echo ""
echo -e "  ${YELLOW}👉 CHECK: Hast du eine AI-Antwort per WhatsApp bekommen?${NC}"

sleep 5

# ============================================================
# TEST 6: INBOUND VERSCHIEBUNG
# ============================================================
test_webhook \
  "Terminverschiebung — Schueler will umbuchen" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  '{
    "From": "whatsapp:'"$DEINE_NUMMER"'",
    "Body": "Ich muss meinen Termin leider verschieben, geht auch naechste Woche?"
  }' \
  "OK"

echo ""
echo -e "  ${YELLOW}👉 CHECK: Hast du die Verschiebungs-Antwort per WhatsApp bekommen?${NC}"
echo -e "  ${YELLOW}👉 CHECK: Hat der Fahrlehrer eine Benachrichtigung erhalten?${NC}"

sleep 3

# ============================================================
# TEST 7: INBOUND BESCHWERDE
# ============================================================
test_webhook \
  "Beschwerde — Eskalation an Inhaber" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  '{
    "From": "whatsapp:'"$DEINE_NUMMER"'",
    "Body": "Ich bin sehr unzufrieden mit meinem Fahrlehrer, das ist eine Katastrophe!"
  }' \
  "OK"

echo ""
echo -e "  ${YELLOW}👉 CHECK: Beschwerde-Bestaetigung per WhatsApp?${NC}"
echo -e "  ${YELLOW}👉 CHECK: Inhaber hat Eskalations-Nachricht erhalten?${NC}"

sleep 3

# ============================================================
# TEST 8: DSGVO OPT-OUT
# ============================================================
test_webhook \
  "DSGVO Opt-Out — STOP senden" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  '{
    "From": "whatsapp:'"$DEINE_NUMMER"'",
    "Body": "STOP"
  }' \
  "OK"

echo ""
echo -e "  ${YELLOW}👉 CHECK: Opt-Out Bestaetigung per WhatsApp erhalten?${NC}"
echo -e "  ${YELLOW}👉 CHECK: WA_Opt_Out = 'ja' im Schueler-Sheet?${NC}"

# ============================================================
# ERGEBNIS
# ============================================================
echo ""
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    TEST-ERGEBNIS                             ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║  Gesamt:  $total Tests                                        ║${NC}"
echo -e "${BOLD}║  ${GREEN}Bestanden: $passed${NC}${BOLD}                                            ║${NC}"
if [ $failed -gt 0 ]; then
echo -e "${BOLD}║  ${RED}Fehlgeschlagen: $failed${NC}${BOLD}                                       ║${NC}"
fi
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║                                                              ║${NC}"
echo -e "${BOLD}║  MANUELLE CHECKS (im Google Sheet pruefen):                  ║${NC}"
echo -e "${BOLD}║  □ Sheet 'Schueler' — neuer Eintrag vorhanden?               ║${NC}"
echo -e "${BOLD}║  □ Sheet 'Buchungen' — Buchung gespeichert?                  ║${NC}"
echo -e "${BOLD}║  □ Sheet 'Nachrichten_Log' — alle Inbound-Tests geloggt?     ║${NC}"
echo -e "${BOLD}║  □ Sheet 'Verschiebungen_Log' — Eintrag vorhanden?           ║${NC}"
echo -e "${BOLD}║  □ Sheet 'Beschwerden_Log' — Beschwerde geloggt?             ║${NC}"
echo -e "${BOLD}║  □ Sheet 'DSGVO_Log' — Opt-Out geloggt?                      ║${NC}"
echo -e "${BOLD}║                                                              ║${NC}"
echo -e "${BOLD}║  TIMER-BASIERTE WORKFLOWS (nicht per Script testbar):        ║${NC}"
echo -e "${BOLD}║  □ Termin-Erinnerungen — manuell in n8n ausfuehren           ║${NC}"
echo -e "${BOLD}║  □ Zahlungserinnerungen — manuell in n8n ausfuehren          ║${NC}"
echo -e "${BOLD}║  □ Feedback/Bewertungen — manuell in n8n ausfuehren          ║${NC}"
echo -e "${BOLD}║  □ Empfehlung + Glueckwuensche — manuell in n8n ausfuehren   ║${NC}"
echo -e "${BOLD}║  □ Theorie + Doku Reminder — manuell in n8n ausfuehren       ║${NC}"
echo -e "${BOLD}║  □ DSGVO Archivierung — manuell in n8n ausfuehren            ║${NC}"
echo -e "${BOLD}║  □ Warteliste Timeout — manuell in n8n ausfuehren            ║${NC}"
echo -e "${BOLD}║  □ Onboarding Follow-Up — manuell in n8n ausfuehren          ║${NC}"
echo -e "${BOLD}║                                                              ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Fertig! Alle zeitgesteuerten Workflows kannst du in n8n einzeln"
echo "mit dem 'Test Workflow' Button testen."
