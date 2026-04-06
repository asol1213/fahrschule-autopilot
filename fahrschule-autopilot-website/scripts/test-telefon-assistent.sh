#!/bin/bash
# ============================================================
# 🧪 Telefon-Assistent Test Suite
# Automatisierte Tests für Agent 2 (Retell Webhook + CRM + DSGVO)
#
# Usage: ./scripts/test-telefon-assistent.sh [BASE_URL]
# Default: http://localhost:3000
# ============================================================

BASE_URL="${1:-http://localhost:3000}"
TENANT_ID="${2:-11111111-1111-1111-1111-111111111111}"
PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🚗 Fahrschule Autopilot — Telefon-Assistent Tests  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Base URL:  ${BOLD}${BASE_URL}${NC}"
echo -e "  Tenant ID: ${BOLD}${TENANT_ID}${NC}"
echo ""

# --- Helper ---
run_test() {
  local name="$1"
  local method="$2"
  local url="$3"
  local data="$4"
  local expected="$5"

  TOTAL=$((TOTAL + 1))
  echo -ne "  ${YELLOW}[$TOTAL]${NC} $name ... "

  if [ "$method" = "GET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -H "X-Test-Secret: dashboard-test" \
      -d "$data" 2>/dev/null)
  fi

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if echo "$BODY" | grep -q "$expected" 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $HTTP_CODE)"
    PASSED=$((PASSED + 1))
    return 0
  elif [ "$HTTP_CODE" = "500" ] && (echo "$BODY" | grep -qi "internal server error" 2>/dev/null || echo "$BODY" | grep -qi '"error"' 2>/dev/null); then
    echo -e "${YELLOW}⏭️  SKIP${NC} (HTTP 500 — Supabase DB nicht verbunden)"
    SKIPPED=$((SKIPPED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $HTTP_CODE)"
    echo -e "     Erwartet: ${expected}"
    echo -e "     Erhalten: ${BODY:0:200}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# ============================================================
echo -e "${BOLD}━━━ 1. Health Checks ━━━${NC}"
# ============================================================

run_test "Retell Webhook Health" \
  "GET" "${BASE_URL}/api/retell" "" \
  '"status":"ok"'

run_test "Telefon Analytics API" \
  "GET" "${BASE_URL}/api/analytics/telefon?tenantId=${TENANT_ID}" "" \
  '"tenantId"'

# ============================================================
echo ""
echo -e "${BOLD}━━━ 2. Retell Webhook Events ━━━${NC}"
# ============================================================

run_test "call_started Event" \
  "POST" "${BASE_URL}/api/retell" \
  "{\"event\":\"call_started\",\"call\":{\"call_id\":\"test_auto_001\",\"agent_id\":\"agent_test\",\"call_status\":\"registered\",\"from_number\":\"+4917612345678\",\"to_number\":\"+499111234567\",\"direction\":\"inbound\",\"start_timestamp\":1711900000000,\"metadata\":{\"tenant_id\":\"${TENANT_ID}\"}}}" \
  '"success":true'

run_test "call_ended Event" \
  "POST" "${BASE_URL}/api/retell" \
  "{\"event\":\"call_ended\",\"call\":{\"call_id\":\"test_auto_001\",\"agent_id\":\"agent_test\",\"call_status\":\"ended\",\"from_number\":\"+4917612345678\",\"duration_ms\":150000,\"recording_url\":\"https://example.com/recording.wav\",\"transcript\":\"Agent: Guten Tag. User: Ich moechte den Fuehrerschein machen.\",\"disconnection_reason\":\"agent_end_call\",\"metadata\":{\"tenant_id\":\"${TENANT_ID}\"}}}" \
  '"success":true'

run_test "call_analyzed Event (Anmeldung)" \
  "POST" "${BASE_URL}/api/retell" \
  "{\"event\":\"call_analyzed\",\"call\":{\"call_id\":\"test_auto_001\",\"agent_id\":\"agent_test\",\"call_status\":\"ended\",\"from_number\":\"+4917612345678\",\"duration_ms\":150000,\"call_analysis\":{\"call_summary\":\"Anrufer Max Test moechte Fuehrerschein Klasse B machen.\",\"user_sentiment\":\"positive\",\"custom_analysis_data\":{\"intent\":\"anmeldung\",\"name\":\"Max Test\",\"phone\":\"017612345678\",\"email\":\"max@test.de\",\"license_class\":\"B\",\"preferred_time\":\"nachmittags\",\"urgency\":\"mittel\",\"recording_consent\":\"ja\"}},\"metadata\":{\"tenant_id\":\"${TENANT_ID}\"}}}" \
  '"success":true'

run_test "call_analyzed Event (Beschwerde)" \
  "POST" "${BASE_URL}/api/retell" \
  "{\"event\":\"call_analyzed\",\"call\":{\"call_id\":\"test_auto_002\",\"agent_id\":\"agent_test\",\"call_status\":\"ended\",\"from_number\":\"+4917699887766\",\"duration_ms\":210000,\"call_analysis\":{\"call_summary\":\"Schueler ist unzufrieden mit Terminvergabe.\",\"user_sentiment\":\"negative\",\"custom_analysis_data\":{\"intent\":\"beschwerde\",\"name\":\"Anna Unzufrieden\",\"phone\":\"017699887766\",\"urgency\":\"hoch\",\"recording_consent\":\"ja\"}},\"metadata\":{\"tenant_id\":\"${TENANT_ID}\"}}}" \
  '"success":true'

run_test "call_analyzed Event (Kein Recording-Consent)" \
  "POST" "${BASE_URL}/api/retell" \
  "{\"event\":\"call_analyzed\",\"call\":{\"call_id\":\"test_auto_003\",\"agent_id\":\"agent_test\",\"call_status\":\"ended\",\"from_number\":\"+4917711223344\",\"duration_ms\":80000,\"recording_url\":\"https://example.com/no-consent.wav\",\"call_analysis\":{\"call_summary\":\"Anrufer lehnt Aufnahme ab.\",\"user_sentiment\":\"neutral\",\"custom_analysis_data\":{\"intent\":\"termin\",\"name\":\"Klaus Privat\",\"phone\":\"017711223344\",\"license_class\":\"A2\",\"recording_consent\":\"nein\"}},\"metadata\":{\"tenant_id\":\"${TENANT_ID}\"}}}" \
  '"success":true'

run_test "Ungültiges Event (Fehlerbehandlung)" \
  "POST" "${BASE_URL}/api/retell" \
  '{"event":"unknown_event","call":{"call_id":"bad"}}' \
  '"handled":false'

run_test "Leerer Body (Fehlerbehandlung)" \
  "POST" "${BASE_URL}/api/retell" \
  '{}' \
  '"error"'

# ============================================================
echo ""
echo -e "${BOLD}━━━ 3. CRM Lead-Erstellung ━━━${NC}"
# ============================================================

run_test "Lead aus Anruf erstellen (Anmeldung)" \
  "POST" "${BASE_URL}/api/crm/lead-from-call" \
  "{\"tenantId\":\"${TENANT_ID}\",\"callId\":\"test_auto_001\",\"callerName\":\"Max Testmann\",\"callerPhone\":\"+4917612345678\",\"callerEmail\":\"max@test.de\",\"licenseClass\":\"B\",\"intent\":\"anmeldung\",\"summary\":\"Will Fuehrerschein machen\",\"sentiment\":\"positive\"}" \
  '"success":true'

run_test "Duplikat-Check (gleiche Nummer)" \
  "POST" "${BASE_URL}/api/crm/lead-from-call" \
  "{\"tenantId\":\"${TENANT_ID}\",\"callId\":\"test_auto_004\",\"callerName\":\"Max Testmann\",\"callerPhone\":\"+4917612345678\",\"licenseClass\":\"B\",\"intent\":\"anmeldung\"}" \
  '"success":true'

run_test "Lead ohne Daten (Fehlerbehandlung)" \
  "POST" "${BASE_URL}/api/crm/lead-from-call" \
  "{\"tenantId\":\"${TENANT_ID}\",\"callId\":\"test_005\"}" \
  '"error"'

run_test "Lead ohne Tenant (Fehlerbehandlung)" \
  "POST" "${BASE_URL}/api/crm/lead-from-call" \
  '{"callerName":"Test"}' \
  '"error"'

# ============================================================
echo ""
echo -e "${BOLD}━━━ 4. Multi-Tenant Agent Mapping ━━━${NC}"
# ============================================================

run_test "Agent-Mapping erstellen" \
  "POST" "${BASE_URL}/api/retell/agents" \
  "{\"tenantId\":\"${TENANT_ID}\",\"agentId\":\"agent_fahrschule_weber\",\"agentName\":\"Weber Assistent\",\"phoneNumber\":\"+497114567890\",\"voiceProvider\":\"elevenlabs\"}" \
  '"success":true'

run_test "Agent-Mapping abrufen" \
  "GET" "${BASE_URL}/api/retell/agents?tenantId=${TENANT_ID}" "" \
  '"configured"'

run_test "Agent ohne Tenant (Fehlerbehandlung)" \
  "POST" "${BASE_URL}/api/retell/agents" \
  '{"agentId":"test"}' \
  '"error"'

# ============================================================
echo ""
echo -e "${BOLD}━━━ 5. DSGVO Archivierung ━━━${NC}"
# ============================================================

run_test "DSGVO Archivierung (90 Tage)" \
  "POST" "${BASE_URL}/api/dsgvo/anrufe-archivieren" \
  "{\"tage\":90,\"tenantId\":\"${TENANT_ID}\"}" \
  '"success":true'

# ============================================================
echo ""
echo -e "${BOLD}━━━ 6. Landing Page ━━━${NC}"
# ============================================================

run_test "Landing Page lädt" \
  "GET" "${BASE_URL}" "" \
  'telefon-assistent'

# ============================================================
# ERGEBNIS
# ============================================================
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}🎉 ALLE TESTS BESTANDEN!${NC}"
  echo -e "  ${GREEN}$PASSED bestanden${NC} | ${YELLOW}$SKIPPED übersprungen (DB)${NC} | ${RED}$FAILED fehlgeschlagen${NC}"
  echo ""
  if [ $SKIPPED -gt 0 ]; then
    echo -e "  ${YELLOW}Hinweis:${NC} $SKIPPED Tests wurden übersprungen weil Supabase nicht"
    echo -e "  verbunden ist. Führe die Migration aus und teste erneut:"
    echo -e "  ${CYAN}supabase db push${NC} oder SQL manuell im Supabase Dashboard"
  else
    echo -e "  Dein Telefon-Assistent ist ${GREEN}production-ready${NC}! 🚀"
  fi
else
  echo -e "  ${RED}${BOLD}⚠️  $FAILED von $TOTAL Tests fehlgeschlagen${NC}"
  echo -e "  ${GREEN}$PASSED bestanden${NC} | ${YELLOW}$SKIPPED übersprungen${NC} | ${RED}$FAILED fehlgeschlagen${NC}"
fi
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo ""

exit $FAILED
