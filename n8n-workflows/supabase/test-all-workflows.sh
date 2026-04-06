#!/bin/bash
# ============================================================
# FAHRSCHULE AUTOPILOT — SUPABASE WORKFLOW TESTS
#
# Testet ALLE Webhook-Endpoints + verifiziert Supabase-Eintraege.
#
# SETUP:
#   1. export N8N_WEBHOOK_BASE_URL=https://dein-n8n.app.n8n.cloud
#   2. export TEST_TELEFON=+49DEINENUMMER
#   3. export SUPABASE_URL=https://xxx.supabase.co
#   4. export SUPABASE_SERVICE_KEY=eyJ...
#   5. export TENANT_ID=11111111-1111-1111-1111-111111111111
#   6. chmod +x test-all-workflows.sh && ./test-all-workflows.sh
# ============================================================

BASE_URL="${N8N_WEBHOOK_BASE_URL:-https://DEIN-N8N.app.n8n.cloud}"
PHONE="${TEST_TELEFON:-+491721234567}"
EMAIL="${TEST_EMAIL:-test@example.com}"
SB_URL="${SUPABASE_URL:-}"
SB_KEY="${SUPABASE_SERVICE_KEY:-}"
TENANT="${TENANT_ID:-11111111-1111-1111-1111-111111111111}"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
passed=0; failed=0; total=0

test_webhook() {
  local name="$1" endpoint="$2" payload="$3" expect="$4"
  total=$((total + 1))
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}TEST $total: $name${NC}"
  echo "  POST $endpoint"

  response=$(curl -s -w "\n%{http_code}" -X POST "$endpoint" \
    -H "Content-Type: application/json" -d "$payload" \
    --connect-timeout 10 --max-time 30 2>&1)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "  ${GREEN}✅ HTTP $http_code${NC}"
    [ -n "$body" ] && echo "  Response: $(echo "$body" | head -c 200)"
    passed=$((passed + 1))
  else
    echo -e "  ${RED}❌ HTTP $http_code${NC}"
    echo "  $body"
    failed=$((failed + 1))
  fi
}

check_supabase() {
  local name="$1" table="$2" filter="$3"
  if [ -z "$SB_URL" ] || [ -z "$SB_KEY" ]; then return; fi

  count=$(curl -s -H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY" \
    -H "Prefer: count=exact" -I \
    "$SB_URL/rest/v1/$table?tenant_id=eq.$TENANT&$filter" 2>/dev/null \
    | grep -i "content-range" | grep -oP '\d+$' || echo "?")

  if [ "$count" != "0" ] && [ "$count" != "?" ]; then
    echo -e "  ${GREEN}✅ DB: $count Eintraege in '$table'${NC}"
  else
    echo -e "  ${YELLOW}⚠️  DB: $table ($filter) — $count Eintraege${NC}"
  fi
}

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  FAHRSCHULE AUTOPILOT — SUPABASE WORKFLOW TESTS       ║${NC}"
echo -e "${BOLD}║  n8n: $BASE_URL${NC}"
echo -e "${BOLD}║  Tel:  $PHONE${NC}"
echo -e "${BOLD}║  DB:   ${SB_URL:-NICHT KONFIGURIERT}${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════╝${NC}"

# --- TEST 1: ONBOARDING ---
test_webhook "Onboarding — Neue Anmeldung" \
  "$BASE_URL/webhook/neue-anmeldung" \
  "{\"name\":\"Test Schueler\",\"telefon\":\"$PHONE\",\"email\":\"$EMAIL\",\"klasse\":\"B\",\"geburtsdatum\":\"2000-01-15\"}" \
  "success"
echo -e "  ${YELLOW}👉 WhatsApp Willkommen erhalten? E-Mail? Sheet-Eintrag?${NC}"
check_supabase "Schueler" "schueler" "telefon=eq.$PHONE"
sleep 3

# --- TEST 2: TERMINBUCHUNG ---
test_webhook "Terminbuchung — Online-Buchung" \
  "$BASE_URL/webhook/terminbuchung" \
  "{\"name\":\"Test Schueler\",\"telefon\":\"$PHONE\",\"email\":\"$EMAIL\",\"datum\":\"2026-04-10\",\"zeit\":\"14:00\",\"art\":\"Fahrstunde\",\"klasse\":\"B\"}" \
  "buchungsId"
check_supabase "Buchung" "buchungsanfragen" "status=eq.neu"
sleep 3

# --- TEST 3: FAHRLEHRER-ZUWEISUNG ---
test_webhook "Fahrlehrer-Zuweisung" \
  "$BASE_URL/webhook/fahrlehrer-zuweisung" \
  "{\"schuelerId\":\"SCH-TEST\",\"schuelerName\":\"Test Schueler\",\"schuelerTelefon\":\"$PHONE\",\"email\":\"$EMAIL\",\"klasse\":\"B\",\"fahrlehrerName\":\"Schmidt\",\"fahrlehrerTelefon\":\"$PHONE\"}" \
  "success"
sleep 3

# --- TEST 4: TERMINABSAGE + WARTELISTE ---
test_webhook "Terminabsage — Warteliste aktivieren" \
  "$BASE_URL/webhook/termin-absage" \
  "{\"schueler\":\"Abgesagter Schueler\",\"telefon\":\"$PHONE\",\"datum\":\"2026-04-02\",\"zeit\":\"14:00\",\"fahrlehrer\":\"Schmidt\"}" \
  "success"
check_supabase "Wartelisten-Log" "automation_log" "typ=eq.warteliste_angebot"
sleep 3

# --- TEST 5: FAQ-BOT ---
test_webhook "FAQ-Bot — Frage stellen" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  "{\"From\":\"whatsapp:$PHONE\",\"Body\":\"Was kostet der Fuehrerschein?\"}" \
  "OK"
echo -e "  ${YELLOW}👉 AI-Antwort per WhatsApp erhalten?${NC}"
check_supabase "Kommunikation" "kommunikation" "kanal=eq.whatsapp&richtung=eq.eingehend"
sleep 5

# --- TEST 6: VERSCHIEBUNG ---
test_webhook "Terminverschiebung" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  "{\"From\":\"whatsapp:$PHONE\",\"Body\":\"Kann ich meinen Termin bitte verschieben?\"}" \
  "OK"
check_supabase "Verschiebung" "verschiebungen" "status=eq.offen"
sleep 3

# --- TEST 7: BESCHWERDE ---
test_webhook "Beschwerde — Eskalation" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  "{\"From\":\"whatsapp:$PHONE\",\"Body\":\"Ich bin total unzufrieden, das ist eine Katastrophe!\"}" \
  "OK"
check_supabase "Beschwerde" "beschwerden" "status=eq.offen"
sleep 3

# --- TEST 8: DSGVO OPT-OUT ---
test_webhook "DSGVO Opt-Out (STOP)" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  "{\"From\":\"whatsapp:$PHONE\",\"Body\":\"STOP\"}" \
  "OK"
echo -e "  ${YELLOW}👉 Opt-Out Bestaetigung erhalten?${NC}"
check_supabase "DSGVO-Log" "automation_log" "typ=eq.opt_out"
sleep 2

# --- TEST 9: OPT-IN (wieder anmelden) ---
test_webhook "DSGVO Opt-In (START)" \
  "$BASE_URL/webhook/whatsapp-inbound" \
  "{\"From\":\"whatsapp:$PHONE\",\"Body\":\"START\"}" \
  "OK"
sleep 2

# --- TEST 10: TEST MINIMAL (Smoke Test) ---
test_webhook "Test Minimal — End-to-End Smoke Test" \
  "$BASE_URL/webhook/test-minimal" \
  "{\"telefon\":\"$PHONE\",\"nachricht\":\"Automatischer Systemtest\"}" \
  "testId"
echo -e "  ${YELLOW}👉 Test-Nachricht per WhatsApp erhalten?${NC}"
check_supabase "Test-Log" "automation_log" "typ=eq.test"

# ============================================================
# ERGEBNIS
# ============================================================
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                  TEST-ERGEBNIS                         ║${NC}"
echo -e "${BOLD}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║  Gesamt: $total | ${GREEN}Bestanden: $passed${NC}${BOLD} | ${RED}Fehlgeschlagen: $failed${NC}${BOLD}   ║${NC}"
echo -e "${BOLD}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║                                                        ║${NC}"
echo -e "${BOLD}║  TIMER-WORKFLOWS (in n8n manuell testen):              ║${NC}"
echo -e "${BOLD}║  □ Termin-Erinnerungen (24h + 2h)                      ║${NC}"
echo -e "${BOLD}║  □ Zahlungserinnerungen (3-stufig)                     ║${NC}"
echo -e "${BOLD}║  □ Feedback/Bewertungen                                ║${NC}"
echo -e "${BOLD}║  □ Empfehlung + Glueckwuensche                         ║${NC}"
echo -e "${BOLD}║  □ Theorie + Dokumente Reminder                        ║${NC}"
echo -e "${BOLD}║  □ Onboarding Follow-Up (Tag 3/7/14)                   ║${NC}"
echo -e "${BOLD}║  □ Wartelisten-Timeout (4h Ablauf)                     ║${NC}"
echo -e "${BOLD}║  □ Test-Minimal (Smoke Test)                           ║${NC}"
echo -e "${BOLD}║                                                        ║${NC}"
echo -e "${BOLD}║  SUPABASE DASHBOARD pruefen:                           ║${NC}"
echo -e "${BOLD}║  □ automation_log — alle Nachrichten geloggt?           ║${NC}"
echo -e "${BOLD}║  □ kommunikation — eingehende Nachrichten?              ║${NC}"
echo -e "${BOLD}║  □ beschwerden — Beschwerde angelegt?                   ║${NC}"
echo -e "${BOLD}║  □ verschiebungen — Anfrage angelegt?                   ║${NC}"
echo -e "${BOLD}║  □ schueler — wa_opt_out Feld gesetzt?                  ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════╝${NC}"
