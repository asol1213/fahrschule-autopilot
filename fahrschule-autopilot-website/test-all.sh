#!/bin/bash
# ============================================================
# Fahrschule Autopilot — Automatischer Test aller Seiten & APIs
# Usage: ./test-all.sh [base_url]
# Default: http://localhost:3000
# ============================================================

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
WARN=0
ERRORS=""

green() { echo -e "\033[32m✓\033[0m $1"; }
red() { echo -e "\033[31m✗\033[0m $1"; ERRORS="$ERRORS\n  ✗ $1"; }
yellow() { echo -e "\033[33m⚠\033[0m $1"; }

check_page() {
  local url="$1"
  local name="$2"
  local must_contain="$3"

  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$url" 2>/dev/null)

  if [ "$response" = "200" ]; then
    if [ -n "$must_contain" ]; then
      local body
      body=$(curl -s "$BASE$url" 2>/dev/null)
      if echo "$body" | grep -qi "$must_contain"; then
        green "$name ($url) — Status 200, enthält '$must_contain'"
        PASS=$((PASS+1))
      else
        red "$name ($url) — Status 200 aber '$must_contain' NICHT gefunden"
        FAIL=$((FAIL+1))
      fi
    else
      green "$name ($url) — Status 200"
      PASS=$((PASS+1))
    fi
  else
    red "$name ($url) — Status $response (erwartet: 200)"
    FAIL=$((FAIL+1))
  fi
}

check_api() {
  local url="$1"
  local name="$2"
  local method="${3:-GET}"
  local data="$4"

  local response
  if [ "$method" = "POST" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE$url" 2>/dev/null)
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$url" 2>/dev/null)
  fi

  if [ "$response" = "200" ] || [ "$response" = "201" ]; then
    green "API: $name ($method $url) — Status $response"
    PASS=$((PASS+1))
  elif [ "$response" = "401" ]; then
    yellow "API: $name ($method $url) — Status 401 (Auth required, das ist OK)"
    WARN=$((WARN+1))
  else
    red "API: $name ($method $url) — Status $response"
    FAIL=$((FAIL+1))
  fi
}

check_content() {
  local url="$1"
  local name="$2"
  local search="$3"

  local body
  body=$(curl -s "$BASE$url" 2>/dev/null)
  if echo "$body" | grep -qi "$search"; then
    green "$name — '$search' gefunden"
    PASS=$((PASS+1))
  else
    red "$name — '$search' NICHT gefunden"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "=========================================="
echo " FAHRSCHULE AUTOPILOT — VOLLSTÄNDIGER TEST"
echo " Base URL: $BASE"
echo "=========================================="
echo ""

# ---- SEITEN ----
echo "📄 SEITEN"
echo "---"
check_page "/" "Hauptseite" "Fahrschule Autopilot"
check_page "/blog" "Blog-Übersicht" "Blog"
check_page "/blog/theoretische-pruefung-bestehen-tipps" "Blog: Theorieprüfung" "10 Tipps"
check_page "/blog/fuehrerschein-kosten-2026-deutschland" "Blog: Kosten 2026" "Führerschein Kosten"
check_page "/blog/erste-fahrstunde-was-erwartet-mich" "Blog: Erste Fahrstunde" "Erste Fahrstunde"
check_page "/blog/no-shows-fahrschule-vermeiden" "Blog: No-Shows" "No-Show"
check_page "/blog/google-bewertungen-fahrschule-tipps" "Blog: Bewertungen" "Google-Bewertungen"
check_page "/preise" "Preisseite" "Starter"
check_page "/team" "Team-Seite" "Team"
check_page "/anmeldung" "Online-Anmeldung" "Anmeldung"
check_page "/theorie" "Theorie-Trainer" "Theorie"
check_page "/gruender" "Gründer-Seite" "Andrew"
check_page "/impressum" "Impressum" "Impressum"
check_page "/datenschutz" "Datenschutz" "Datenschutz"
check_page "/demo/starter" "Demo Starter" "Starter"
check_page "/demo/pro" "Demo Pro" "Pro"
check_page "/demo/premium" "Demo Premium" "Premium"
check_page "/lp/google" "Landingpage Google Ads" "Demo buchen"
check_page "/lp/social" "Landingpage Social Ads" "Ausfall"
check_page "/stadt/nuernberg" "Stadt: Nürnberg" "Nürnberg"
check_page "/stadt/muenchen" "Stadt: München" "München"
check_page "/stadt/stuttgart" "Stadt: Stuttgart" "Stuttgart"
check_page "/stadt/berlin" "Stadt: Berlin" "Berlin"
check_page "/stadt/hamburg" "Stadt: Hamburg" "Hamburg"
check_page "/stadt/koeln" "Stadt: Köln" "Köln"
check_page "/stadt/frankfurt" "Stadt: Frankfurt" "Frankfurt"
check_page "/stadt/duesseldorf" "Stadt: Düsseldorf" "Düsseldorf"
check_page "/fallstudien" "Fallstudien-Seite" "Fallstudien"
check_page "/faq" "FAQ-Seite" "FAQ"
echo ""

# ---- SEO ----
echo "🔍 SEO"
echo "---"
check_page "/sitemap.xml" "Sitemap" "fahrschulautopilot.de"
check_page "/robots.txt" "Robots.txt" "Sitemap"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Schema: Article" "application/ld+json"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Schema: BreadcrumbList" "BreadcrumbList"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "OG Tags" "og:title"
check_content "/stadt/nuernberg" "Stadt: Schema LocalBusiness" "LocalBusiness"
check_content "/" "Homepage: Organization Schema" "Organization"
check_content "/faq" "FAQ: FAQPage Schema" "FAQPage"
check_content "/faq" "FAQ: BreadcrumbList Schema" "BreadcrumbList"
check_content "/fallstudien" "Fallstudien: BreadcrumbList Schema" "BreadcrumbList"
echo ""

# ---- BLOG FEATURES ----
echo "📝 BLOG FEATURES"
echo "---"
check_content "/blog" "Kategorie-Filter" "Alle ("
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Cover-Bild" "unsplash"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Interne Links" 'href="/theorie"'
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Sharing: LinkedIn" "linkedin.com/sharing"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Sharing: Facebook" "facebook.com/sharer"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Sharing: WhatsApp" "wa.me"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Newsletter-Formular" "Abonnieren"
check_content "/blog/theoretische-pruefung-bestehen-tipps" "Verwandte Artikel" "Alle Artikel"
echo ""

# ---- FOOTER ----
echo "🦶 FOOTER & NAVIGATION"
echo "---"
check_content "/" "Navbar: Blog Link" 'href="/blog"'
check_content "/" "Navbar: Preise Link" 'href="/preise"'
check_content "/" "Footer: Social LinkedIn" "linkedin.com"
check_content "/" "Footer: Social Instagram" "instagram.com"
check_content "/" "Footer: Social Facebook" "facebook.com"
check_content "/" "Footer: Team Link" 'href="/team"'
check_content "/" "Footer: Blog Link" 'href="/blog"'
echo ""

# ---- APIs ----
echo "🔌 APIs"
echo "---"
check_api "/api/testimonials" "Testimonials GET"
check_api "/api/testimonials" "Testimonials POST" "POST" '{"name":"Testuser","text":"Toller Service!","sterne":5,"stadt":"Test"}'
check_api "/api/blog" "Blog GET"
check_api "/api/newsletter" "Newsletter POST" "POST" '{"email":"test@example.com"}'
check_api "/api/health" "Health Check"
check_api "/api/social" "Social POST" "POST" '{"title":"Test Artikel","excerpt":"Test excerpt fuer Social","slug":"test"}'
check_api "/api/gmb" "GMB POST" "POST" '{"type":"review_link","placeId":"ChIJtest123"}'
check_api "/api/newsletter/generate" "Newsletter Generate POST" "POST" '{}'
check_api "/api/blog/update" "Blog Update Check POST" "POST" '{"mode":"check"}'
echo ""

# ---- PREISSEITE ----
echo "💰 PREISSEITE"
echo "---"
check_content "/preise" "Plan Starter" "€99"
check_content "/preise" "Plan Pro" "€249"
check_content "/preise" "Plan Premium" "€349"
check_content "/preise" "Feature-Vergleich" "Feature"
check_content "/preise" "Geld-zurück-Garantie" "Geld-zurück"
check_content "/preise" "Breadcrumb Schema" "BreadcrumbList"
echo ""

# ---- ERGEBNIS ----
echo "=========================================="
echo " ERGEBNIS"
echo "=========================================="
echo ""
echo -e " \033[32m✓ Bestanden: $PASS\033[0m"
echo -e " \033[31m✗ Fehlgeschlagen: $FAIL\033[0m"
echo -e " \033[33m⚠ Warnungen: $WARN\033[0m"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e " \033[32m🎉 ALLE TESTS BESTANDEN!\033[0m"
  echo ""
  echo " Die Website ist bereit für Production."
else
  echo -e " \033[31m⚠ FEHLER GEFUNDEN:\033[0m"
  echo -e "$ERRORS"
  echo ""
  echo " Bitte die Fehler beheben bevor du live gehst."
fi
echo ""
