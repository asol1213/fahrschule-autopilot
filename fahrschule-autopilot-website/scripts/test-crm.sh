#!/bin/bash
# =============================================================
# Fahrschule Autopilot — CRM Test-Script
#
# Testet ALLE CRM-Features automatisch gegen die laufende App.
#
# Nutzung:
#   1. npm run dev  (in einem anderen Terminal)
#   2. ./scripts/test-crm.sh
#
# Optional: URL als Argument für Production-Tests:
#   ./scripts/test-crm.sh https://fahrschule-autopilot.vercel.app
# =============================================================

BASE_URL="${1:-http://localhost:3000}"
TENANT_ID="11111111-1111-1111-1111-111111111111"
# Schüler IDs from live DB
SCHUELER_MAX="bbbb0001-0000-0000-0000-000000000001"    # Max Mueller (praxis)
SCHUELER_FELIX="bbbb0007-0000-0000-0000-000000000007"  # Felix Wolf (dokumente_ausstehend)
SCHUELER_TIM="bbbb0003-0000-0000-0000-000000000003"    # Tim Weber (pruefung)

PASS=0
FAIL=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

check() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local method="${4:-GET}"
  local body="$5"
  TOTAL=$((TOTAL + 1))

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$body" "$url" 2>/dev/null)
  fi

  http_code=$(echo "$response" | tail -1)
  body_response=$(echo "$response" | sed '$d')

  if echo "$body_response" | grep -q "$expected"; then
    echo -e "  ${GREEN}✓${NC} $name ${BLUE}($http_code)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name ${RED}($http_code)${NC}"
    echo -e "    ${YELLOW}Erwartet: \"$expected\"${NC}"
    echo -e "    ${YELLOW}Erhalten: $(echo "$body_response" | head -c 200)${NC}"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  🚗 Fahrschule Autopilot — CRM Test Suite${NC}"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "  Target: ${BLUE}$BASE_URL${NC}"
echo ""

# ─── 1. HEALTH CHECK ──────────────────────────
echo -e "${BOLD}1. Health Check${NC}"
check "API Health" \
  "$BASE_URL/api/health" \
  '"status"'

# ─── 2. SCHÜLER ───────────────────────────────
echo ""
echo -e "${BOLD}2. Schülerverwaltung${NC}"
check "Alle Schüler laden" \
  "$BASE_URL/api/crm/schueler?tenantId=$TENANT_ID" \
  '"data"'

check "Schüler nach Status filtern" \
  "$BASE_URL/api/crm/schueler?tenantId=$TENANT_ID&status=praxis" \
  '"data"'

check "Schüler suchen (Max)" \
  "$BASE_URL/api/crm/schueler?tenantId=$TENANT_ID&search=Max" \
  'Max'

check "Neuen Schüler anlegen" \
  "$BASE_URL/api/crm/schueler" \
  '"data"' \
  "POST" \
  "{\"tenantId\":\"$TENANT_ID\",\"vorname\":\"Test\",\"nachname\":\"User\",\"email\":\"test@example.com\",\"telefon\":\"+49 176 00000000\",\"geburtsdatum\":\"2000-01-01\",\"fuehrerscheinklasse\":\"B\",\"status\":\"angemeldet\",\"anmeldungsDatum\":\"$(date +%Y-%m-%d)\"}"

# ─── 3. FAHRSTUNDEN ───────────────────────────
echo ""
echo -e "${BOLD}3. Fahrstunden & Kalender${NC}"
check "Fahrstunden pro Schüler (Max)" \
  "$BASE_URL/api/crm/fahrstunden?schuelerId=$SCHUELER_MAX" \
  '"data"'

TODAY=$(date +%Y-%m-%d)
NEXTWEEK=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d "+7 days" +%Y-%m-%d 2>/dev/null)
check "Fahrstunden Wochenansicht" \
  "$BASE_URL/api/crm/fahrstunden?tenantId=$TENANT_ID&von=$TODAY&bis=$NEXTWEEK" \
  '"data"'

# ─── 4. ZAHLUNGEN ─────────────────────────────
echo ""
echo -e "${BOLD}4. Zahlungen & Finanzen${NC}"
check "Alle Zahlungen" \
  "$BASE_URL/api/crm/zahlungen?tenantId=$TENANT_ID" \
  '"data"'

check "Offene Zahlungen" \
  "$BASE_URL/api/crm/zahlungen?tenantId=$TENANT_ID&status=offen" \
  '"data"'

check "Umsatz-Report Monat" \
  "$BASE_URL/api/crm/rechnungen?tenantId=$TENANT_ID&zeitraum=monat" \
  '"data"'

check "Umsatz-Report Quartal" \
  "$BASE_URL/api/crm/rechnungen?tenantId=$TENANT_ID&zeitraum=quartal" \
  '"data"'

# ─── 5. DOKUMENTE ─────────────────────────────
echo ""
echo -e "${BOLD}5. Dokumente${NC}"
check "Dokumente pro Schüler (Max)" \
  "$BASE_URL/api/crm/dokumente?schuelerId=$SCHUELER_MAX" \
  '"data"'

check "Fehlende Dokumente" \
  "$BASE_URL/api/crm/dokumente?tenantId=$TENANT_ID&fehlend=true" \
  '"data"'

# ─── 6. PRÜFUNGEN ─────────────────────────────
echo ""
echo -e "${BOLD}6. Prüfungen${NC}"
check "Alle Prüfungen + Bestehensquote" \
  "$BASE_URL/api/crm/pruefungen?tenantId=$TENANT_ID" \
  '"bestehensquote"'

check "Prüfungen pro Schüler (Max)" \
  "$BASE_URL/api/crm/pruefungen?schuelerId=$SCHUELER_MAX" \
  '"data"'

# ─── 7. PRÜFUNGSREIFE ─────────────────────────
echo ""
echo -e "${BOLD}7. Prüfungsreife-Check${NC}"
check "Prüfungsreife Max (praxis Phase)" \
  "$BASE_URL/api/crm/pruefungsreife?schuelerId=$SCHUELER_MAX" \
  '"score"'

# ─── 8. KOMMUNIKATION ─────────────────────────
echo ""
echo -e "${BOLD}8. Kommunikation${NC}"
check "Kommunikation Max" \
  "$BASE_URL/api/crm/kommunikation?schuelerId=$SCHUELER_MAX" \
  '"data"'

# ─── 9. FAHRLEHRER ─────────────────────────────
echo ""
echo -e "${BOLD}9. Fahrlehrer${NC}"
check "Alle Fahrlehrer (2 Stück)" \
  "$BASE_URL/api/crm/fahrlehrer?tenantId=$TENANT_ID" \
  '"data"'

# ─── 10. STATS / KPIs ─────────────────────────
echo ""
echo -e "${BOLD}10. Dashboard KPIs${NC}"
check "Stats (Schüler, Zahlungen, Termine, Quote)" \
  "$BASE_URL/api/crm/stats?tenantId=$TENANT_ID" \
  '"totalSchueler"'

# ─── 11. MAHNWESEN ─────────────────────────────
echo ""
echo -e "${BOLD}11. Mahnwesen${NC}"
check "Mahnlauf ausführen" \
  "$BASE_URL/api/crm/mahnwesen" \
  '"verarbeitet"' \
  "POST" \
  "{\"tenantId\":\"$TENANT_ID\"}"

# ─── 12. DSGVO ─────────────────────────────────
echo ""
echo -e "${BOLD}12. DSGVO Compliance${NC}"
check "DSGVO Daten-Export (Art. 15)" \
  "$BASE_URL/api/crm/dsgvo?schuelerId=$SCHUELER_MAX" \
  '"exportDatum"'

# ─── 13. CALENDAR SYNC ────────────────────────
echo ""
echo -e "${BOLD}13. Kalender-Sync${NC}"
check "iCal Export" \
  "$BASE_URL/api/crm/calendar-sync?tenantId=$TENANT_ID&format=ical" \
  'VCALENDAR'

# ─── 14. WEBHOOK RECEIVER ─────────────────────
echo ""
echo -e "${BOLD}14. Webhook / Event-System${NC}"
check "Webhook: Neue Anmeldung" \
  "$BASE_URL/api/webhooks/events" \
  '"success"' \
  "POST" \
  "{\"type\":\"anmeldung.neu\",\"tenantId\":\"$TENANT_ID\",\"data\":{\"vorname\":\"Webhook\",\"nachname\":\"Test\",\"email\":\"webhook@test.de\",\"telefon\":\"+49 176 12345678\",\"geburtsdatum\":\"2005-06-15\",\"fuehrerscheinklasse\":\"B\"}}"

check "Webhook: Anruf beendet" \
  "$BASE_URL/api/webhooks/events" \
  '"success"' \
  "POST" \
  "{\"type\":\"anruf.beendet\",\"tenantId\":\"$TENANT_ID\",\"data\":{\"schuelerId\":\"$SCHUELER_MAX\",\"dauer\":120,\"zusammenfassung\":\"Test-Anruf\"}}"

check "Webhook: WhatsApp empfangen" \
  "$BASE_URL/api/webhooks/events" \
  '"success"' \
  "POST" \
  "{\"type\":\"whatsapp.empfangen\",\"tenantId\":\"$TENANT_ID\",\"data\":{\"schuelerId\":\"$SCHUELER_MAX\",\"nachricht\":\"Hallo, Test-Nachricht\"}}"

# ─── 15. UI PAGES ─────────────────────────────
echo ""
echo -e "${BOLD}15. Dashboard-Seiten (HTTP 200)${NC}"

for page in "" "/schueler" "/kalender" "/zahlungen" "/dokumente" "/pruefungen"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard$page" 2>/dev/null)
  TOTAL=$((TOTAL + 1))
  if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "302" ]; then
    echo -e "  ${GREEN}✓${NC} /dashboard$page ${BLUE}($code)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} /dashboard$page ${RED}($code)${NC}"
    FAIL=$((FAIL + 1))
  fi
done

# ─── ZUSAMMENFASSUNG ──────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}ALLE $TOTAL TESTS BESTANDEN${NC} ${GREEN}✓${NC}"
else
  echo -e "  ${GREEN}$PASS bestanden${NC} / ${RED}$FAIL fehlgeschlagen${NC} / $TOTAL total"
fi
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo ""

exit $FAIL
