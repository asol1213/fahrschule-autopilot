#!/bin/bash
# DNS Fallback Script — schaltet auf Cloudflare wenn Pi-hole down ist
# Läuft alle 30 Sekunden, checkt ob Pi-hole erreichbar ist

PIHOLE_IP="YOUR_PI_IP"
FALLBACK_DNS1="1.1.1.1"
FALLBACK_DNS2="8.8.8.8"
NETWORK_SERVICE="Wi-Fi"  # oder "Ethernet" — wird automatisch erkannt
LOGFILE="/tmp/dns-fallback.log"

# Finde aktiven Netzwerk-Service
get_active_service() {
    local services=$(networksetup -listallnetworkservices | tail -n +2)
    while IFS= read -r service; do
        local status=$(networksetup -getinfo "$service" 2>/dev/null | grep "^IP address:" | head -1)
        if [[ -n "$status" && "$status" != *"none"* ]]; then
            echo "$service"
            return
        fi
    done <<< "$services"
    echo "Wi-Fi"
}

# Aktuellen DNS lesen
get_current_dns() {
    networksetup -getdnsservers "$1" 2>/dev/null | head -1
}

# Check ob Pi-hole antwortet (DNS-Query auf Port 53)
pihole_is_up() {
    dig @${PIHOLE_IP} google.com +short +time=2 +tries=1 &>/dev/null
    return $?
}

NETWORK_SERVICE=$(get_active_service)
CURRENT_DNS=$(get_current_dns "$NETWORK_SERVICE")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if pihole_is_up; then
    # Pi-hole ist da
    if [[ "$CURRENT_DNS" != "$PIHOLE_IP" ]]; then
        # Wir waren im Fallback — zurück zum Pi-hole
        networksetup -setdnsservers "$NETWORK_SERVICE" "$PIHOLE_IP"
        echo "[$TIMESTAMP] Pi-hole ist wieder da. DNS zurück auf $PIHOLE_IP ($NETWORK_SERVICE)" >> "$LOGFILE"
    fi
else
    # Pi-hole ist down
    if [[ "$CURRENT_DNS" == "$PIHOLE_IP" || "$CURRENT_DNS" == "There"* ]]; then
        # Umschalten auf Fallback
        networksetup -setdnsservers "$NETWORK_SERVICE" "$FALLBACK_DNS1" "$FALLBACK_DNS2"
        echo "[$TIMESTAMP] Pi-hole DOWN! DNS umgeschaltet auf $FALLBACK_DNS1 + $FALLBACK_DNS2 ($NETWORK_SERVICE)" >> "$LOGFILE"
    fi
fi
