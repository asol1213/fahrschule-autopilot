#!/bin/bash
# ==============================================================
# Smoke-Test: Fahrschule Autopilot
#
# Testet alle wichtigen Seiten und API-Endpoints.
# Usage: ./scripts/smoke-test.sh [BASE_URL]
# Default: http://localhost:3000
# ==============================================================

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
TOTAL=0

green() { echo -e "\033[32m✓ $1\033[0m"; }
red()   { echo -e "\033[31m✗ $1\033[0m"; }
bold()  { echo -e "\033[1m$1\033[0m"; }

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-200}"
  TOTAL=$((TOTAL + 1))

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$status" = "$expect" ]; then
    green "$name ($status)"
    PASS=$((PASS + 1))
  else
    red "$name — erwartet $expect, bekommen $status"
    FAIL=$((FAIL + 1))
  fi
}

check_contains() {
  local name="$1"
  local url="$2"
  local search="$3"
  TOTAL=$((TOTAL + 1))

  body=$(curl -s "$url" 2>/dev/null)
  if echo "$body" | grep -qi "$search"; then
    green "$name (enthält '$search')"
    PASS=$((PASS + 1))
  else
    red "$name — '$search' nicht gefunden"
    FAIL=$((FAIL + 1))
  fi
}

check_json() {
  local name="$1"
  local url="$2"
  local key="$3"
  TOTAL=$((TOTAL + 1))

  body=$(curl -s "$url" 2>/dev/null)
  if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$key' in d" 2>/dev/null; then
    green "$name (JSON key '$key' vorhanden)"
    PASS=$((PASS + 1))
  else
    red "$name — JSON key '$key' fehlt"
    FAIL=$((FAIL + 1))
  fi
}

check_auth() {
  local name="$1"
  local url="$2"
  TOTAL=$((TOTAL + 1))

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$status" = "401" ] || [ "$status" = "403" ]; then
    green "$name — korrekt geschützt ($status)"
    PASS=$((PASS + 1))
  else
    red "$name — NICHT geschützt! Status: $status (erwartet 401/403)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
bold "========================================="
bold " Fahrschule Autopilot — Smoke Test"
bold " Base URL: $BASE"
bold "========================================="
echo ""

# ---- ÖFFENTLICHE SEITEN ----
bold "--- Öffentliche Seiten ---"
check "Homepage"           "$BASE/"
check "Blog"               "$BASE/blog"
check "Theorie-Trainer"    "$BASE/theorie"
check "Anmeldung"          "$BASE/anmeldung"
check "Impressum"          "$BASE/impressum"
check "Datenschutz"        "$BASE/datenschutz"
check "Gründer"            "$BASE/gruender"
check "Preise"             "$BASE/preise"
check "Demo Starter"       "$BASE/demo/starter"
check "Demo Pro"           "$BASE/demo/pro"
check "Demo Premium"       "$BASE/demo/premium"
check "Stadt Stuttgart"    "$BASE/stadt/stuttgart"
echo ""

# ---- ÖFFENTLICHE APIs ----
bold "--- Öffentliche APIs ---"
check_json "Health Check"  "$BASE/api/health" "status"
check "Blog API"           "$BASE/api/blog"
check "Sitemap"            "$BASE/sitemap.xml"
check "Robots"             "$BASE/robots.txt"
echo ""

# ---- GESCHÜTZTE SEITEN (sollten redirect oder 200 mit Login) ----
bold "--- Dashboard (Auth-geschützt) ---"
check "Dashboard"          "$BASE/dashboard"   "200"
check "Login"              "$BASE/login"
echo ""

# ---- SECURITY: Auth-geschützte APIs ----
bold "--- Security: API Auth-Tests (sollten 401 sein) ---"
check_auth "CRM Schüler"        "$BASE/api/crm/schueler?tenantId=test"
check_auth "CRM Zahlungen"      "$BASE/api/crm/zahlungen?tenantId=test"
check_auth "CRM Fahrstunden"    "$BASE/api/crm/fahrstunden?tenantId=test"
check_auth "CRM Stats"          "$BASE/api/crm/stats?tenantId=test"
check_auth "Export CSV"         "$BASE/api/export?tenantId=test&format=csv&type=report"
check_auth "Reporting"          "$BASE/api/reporting?tenantId=test"
check_auth "Analytics"          "$BASE/api/analytics?tenantId=test"
check_auth "Admin Metrics"      "$BASE/api/admin/metrics"
check_auth "Sales Leads"       "$BASE/api/sales/leads"
check_auth "Export PDF"        "$BASE/api/export/pdf?tenantId=test"
echo ""

# ---- ERROR PAGES ----
bold "--- Error Pages ---"
check "404 Seite"          "$BASE/diese-seite-gibt-es-nicht-xyz" "404"
echo ""

# ---- CONTENT CHECKS ----
bold "--- Content-Checks ---"
check_contains "Homepage hat Chatbot"     "$BASE/"        "ChatWidget\|chatbot\|chat-widget"
check_contains "Blog hat Artikel"         "$BASE/blog"    "Lesezeit\|Blog"
check_contains "Theorie hat Fragen"       "$BASE/theorie" "Theorie\|Frage"
check_contains "Health OK"                "$BASE/api/health" "ok"
echo ""

# ---- ERGEBNIS ----
echo ""
bold "========================================="
if [ "$FAIL" -eq 0 ]; then
  bold " ERGEBNIS: $PASS/$TOTAL Tests bestanden ✓"
  bold " Alle Tests grün!"
else
  bold " ERGEBNIS: $PASS/$TOTAL bestanden, $FAIL fehlgeschlagen"
fi
bold "========================================="
echo ""

exit $FAIL
