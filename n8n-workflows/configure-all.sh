#!/bin/bash
# ============================================================
# FAHRSCHULE AUTOPILOT — ALLE WORKFLOWS KONFIGURIEREN
#
# Ersetzt SPREADSHEET_ID_HIER in ALLEN Workflow-JSONs auf einmal.
#
# USAGE:
#   ./configure-all.sh DEINE_GOOGLE_SHEET_ID
#
# Die Sheet-ID findest du in der Google Sheets URL:
#   https://docs.google.com/spreadsheets/d/DIESE_ID_HIER/edit
# ============================================================

if [ -z "$1" ]; then
  echo "❌ Fehler: Bitte Google Sheet ID angeben!"
  echo ""
  echo "Usage: ./configure-all.sh DEINE_GOOGLE_SHEET_ID"
  echo ""
  echo "Die Sheet-ID findest du in der Google Sheets URL:"
  echo "  https://docs.google.com/spreadsheets/d/DIESE_ID_HIER/edit"
  exit 1
fi

SHEET_ID="$1"
DIR="$(cd "$(dirname "$0")" && pwd)"
COUNT=0

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Konfiguriere alle Workflows mit Sheet-ID:              ║"
echo "║  $SHEET_ID"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

for file in "$DIR"/*.json; do
  filename=$(basename "$file")
  if grep -q "SPREADSHEET_ID_HIER" "$file" 2>/dev/null; then
    # Backup erstellen
    cp "$file" "$file.backup"
    # Ersetzen
    sed -i '' "s/SPREADSHEET_ID_HIER/$SHEET_ID/g" "$file"
    matches=$(grep -c "$SHEET_ID" "$file")
    echo "✅ $filename — $matches Stelle(n) ersetzt"
    COUNT=$((COUNT + 1))
  else
    echo "⏭  $filename — keine Platzhalter gefunden (bereits konfiguriert)"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ $COUNT Workflow-Dateien konfiguriert."
echo "📁 Backups: *.json.backup"
echo ""
echo "Naechster Schritt: Workflows in n8n importieren!"
echo "  n8n → Menu → Import from File → alle *.json Dateien"
