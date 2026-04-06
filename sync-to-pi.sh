#!/bin/bash
# Täglicher Sync: Autopilot_F → Raspberry Pi
# Wird per launchd jeden Tag um 03:00 ausgeführt

LOG="/tmp/autopilot-sync.log"
SRC="$HOME/Desktop/Autopilot_F/"
DEST="andrew@YOUR_PI_IP:/home/andrew/autopilot-backup/"

echo "$(date '+%Y-%m-%d %H:%M:%S') — Sync gestartet" >> "$LOG"

# Prüfe ob Pi erreichbar ist
if ! ping -c 1 -W 3 YOUR_PI_IP > /dev/null 2>&1; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') — Pi nicht erreichbar, übersprungen" >> "$LOG"
  exit 0
fi

rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  "$SRC" "$DEST" >> "$LOG" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') — Sync abgeschlossen" >> "$LOG"
