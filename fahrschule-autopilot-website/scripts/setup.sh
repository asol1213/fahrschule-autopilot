#!/bin/bash
# =============================================================
# Fahrschule Autopilot — Setup Script
#
# Macht alles fertig für lokales Testing:
# 1. Prüft Node + Dependencies
# 2. Prüft .env.local
# 3. Zeigt nächste Schritte
# =============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  🚗 Fahrschule Autopilot — Setup${NC}"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo ""

# 1. Node.js
echo -e "${BOLD}1. Prüfe Node.js...${NC}"
if command -v node &> /dev/null; then
  NODE_V=$(node -v)
  echo -e "  ${GREEN}✓${NC} Node.js $NODE_V"
else
  echo -e "  ${RED}✗${NC} Node.js nicht gefunden. Bitte installieren: https://nodejs.org"
  exit 1
fi

# 2. Dependencies
echo -e "${BOLD}2. Prüfe Dependencies...${NC}"
if [ -d "node_modules" ]; then
  echo -e "  ${GREEN}✓${NC} node_modules vorhanden"
else
  echo -e "  ${YELLOW}→${NC} Installiere Dependencies..."
  npm install
  echo -e "  ${GREEN}✓${NC} Dependencies installiert"
fi

# 3. .env.local
echo -e "${BOLD}3. Prüfe .env.local...${NC}"
if [ -f ".env.local" ]; then
  echo -e "  ${GREEN}✓${NC} .env.local vorhanden"

  # Check Supabase vars
  if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local; then
    echo -e "  ${GREEN}✓${NC} SUPABASE_URL konfiguriert"
  else
    echo -e "  ${RED}✗${NC} SUPABASE_URL fehlt oder ist Platzhalter"
    echo -e "    ${YELLOW}→ Öffne .env.local und setze NEXT_PUBLIC_SUPABASE_URL${NC}"
  fi

  if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ" .env.local; then
    echo -e "  ${GREEN}✓${NC} SUPABASE_ANON_KEY konfiguriert"
  else
    echo -e "  ${RED}✗${NC} SUPABASE_ANON_KEY fehlt oder ist Platzhalter"
    echo -e "    ${YELLOW}→ Öffne .env.local und setze NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
  fi
else
  echo -e "  ${YELLOW}→${NC} Erstelle .env.local aus .env.example..."
  cp .env.example .env.local
  echo -e "  ${YELLOW}!${NC} Bitte .env.local mit Supabase-Daten ausfüllen"
fi

# 4. Build-Test
echo ""
echo -e "${BOLD}4. Prüfe Build...${NC}"
npx tsc --noEmit 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} TypeScript kompiliert fehlerfrei"
else
  echo -e "  ${RED}✗${NC} TypeScript-Fehler gefunden. Bitte 'npx tsc --noEmit' ausführen"
fi

# 5. Zusammenfassung
echo ""
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Nächste Schritte:${NC}"
echo -e "${BOLD}══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Supabase einrichten:${NC}"
echo -e "  1. https://supabase.com → New Project (Frankfurt)"
echo -e "  2. SQL Editor → supabase/migrations/001_initial_schema.sql ausführen"
echo -e "  3. SQL Editor → supabase/seed/002_storage_bucket.sql ausführen"
echo -e "  4. Authentication → Users → Add User"
echo -e "     E-Mail: test@fahrschule.de / Passwort: Autopilot2026!"
echo -e "  5. User-ID kopieren, in supabase/seed/demo-data.sql Zeile 12 einsetzen"
echo -e "  6. SQL Editor → supabase/seed/demo-data.sql ausführen"
echo ""
echo -e "  ${BLUE}Starten:${NC}"
echo -e "  npm run dev"
echo -e "  → http://localhost:3000/login"
echo ""
echo -e "  ${BLUE}Testen:${NC}"
echo -e "  ./scripts/test-crm.sh"
echo ""
