# Architektur-Entscheidung: WhatsApp-Messaging

## Status: Entschieden (30. Maerz 2026)

## Kontext

Es gibt zwei Systeme zum Versenden von WhatsApp-Nachrichten:

| System | Technologie | Port | Zweck |
|--------|------------|------|-------|
| **Twilio** | Twilio WhatsApp Sandbox/API | extern | Alle n8n-Workflows |
| **whatsapp-web.js** | Lokaler Docker-Service | 3001 | Eingehende Nachrichten + QR-Linking |

## Entscheidung

**Alle ausgehenden Nachrichten laufen ueber Twilio-Nodes in n8n.**

Der lokale `whatsapp-service` (Port 3001) wird ausschliesslich fuer:
- Empfang eingehender Nachrichten (Weiterleitung an n8n-Webhooks)
- QR-Code-Linking fuer die WhatsApp-Session
- Health-Checks und Status-Monitoring

## Begruendung

| Kriterium | Twilio | whatsapp-web.js |
|-----------|--------|-----------------|
| **Zuverlaessigkeit** | 99.95% SLA | Inoffiziell, Session bricht ab |
| **Skalierbarkeit** | Unbegrenzt | 1 Session pro Container |
| **API-Stabilitaet** | Versioniert, dokumentiert | Reverse-engineered, kann brechen |
| **DSGVO** | AV-Vertrag moeglich | Keine offizielle Partnerschaft |
| **Kosten (Test)** | 0 EUR (Sandbox) | 0 EUR |
| **Kosten (Prod)** | ~0.05-0.10 EUR/Nachricht | 0 EUR aber Risiko |

## Migrationsplan fuer Production

```
Phase 1 (jetzt):   Twilio Sandbox (kostenlos, zum Testen)
Phase 2 (Launch):  Twilio WhatsApp Business API (~10-30 EUR/Monat)
Phase 3 (Scale):   Meta Cloud API direkt (guenstigere Nachrichtenpreise)
```

### Migration zu Meta Cloud API

Wenn bereit fuer Production:
1. Meta Business Account verifizieren
2. WhatsApp Business API beantragen
3. Twilio-Nodes in Workflows durch HTTP-Request-Nodes ersetzen
4. Meta Cloud API Endpoint: `https://graph.facebook.com/v18.0/{PHONE_ID}/messages`
5. `whatsapp-service` Docker-Container abschalten

## Betroffene Dateien

- `n8n-workflows/supabase/*.json` - Alle 10 Workflows nutzen Twilio-Nodes
- `n8n-workflows/production/*.json` - Production-Kopien
- `whatsapp-service/` - Nur fuer Empfang, nicht fuer Versand
- `docker-compose.yml` - Beide Services definiert
