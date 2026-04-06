#!/bin/bash
# Täglicher Sync: Autopilot_F → GitHub
# Wird per launchd jeden Tag um 03:30 ausgeführt (nach Pi-Sync)

LOG="/tmp/autopilot-github-sync.log"
REPO="$HOME/Desktop/Autopilot_F"

echo "$(date '+%Y-%m-%d %H:%M:%S') — GitHub Sync gestartet" >> "$LOG"

cd "$REPO" || exit 1

# Prüfe ob es Änderungen gibt
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') — Keine Änderungen, übersprungen" >> "$LOG"
  exit 0
fi

# Alle Änderungen committen und pushen
git add -A >> "$LOG" 2>&1
git commit -m "Auto-Sync $(date '+%Y-%m-%d %H:%M')" >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') — GitHub Sync abgeschlossen" >> "$LOG"
