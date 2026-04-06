# Production Deployment Guide

## Schnellstart (5 Minuten lokal testen)

```bash
# 1. Env-Datei kopieren und anpassen
cp .env.example .env.local

# 2. Minimum in .env.local eintragen:
#    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#    SUPABASE_SERVICE_ROLE_KEY=eyJ...
#    ANTHROPIC_API_KEY=sk-ant-api03-...  (optional, Chatbot nutzt Fallback ohne)

# 3. Starten
npm run dev

# 4. Testen
open http://localhost:3000          # Homepage
open http://localhost:3000/preise   # Preise
open http://localhost:3000/theorie  # Theorie-Trainer
open http://localhost:3000/login    # Login
```

## 1. Supabase einrichten (10 min)

1. Geh zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Kopiere URL + Anon Key + Service Role Key
3. Im Supabase **SQL Editor** die Migrations ausfuehren (in dieser Reihenfolge):
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_analytics_tables.sql
   supabase/migrations/003_retell_agents_and_archival.sql
   supabase/migrations/004_testimonials.sql
   ```
4. Test-User erstellen: **Authentication > Users > Add user**
   - Email: `test@fahrschule-autopilot.de`
   - Password: `Test1234!`
5. User-UUID kopieren und in `supabase/seed.sql` einsetzen (Zeile 15)
6. Seed-Daten im SQL Editor ausfuehren: `supabase/seed.sql`

## 2. Environment Variables (.env.local)

```bash
cp .env.example .env.local
# Dann die Werte eintragen
```

**Pflicht:**
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (Chatbot + Theorie-Tutor)

**Empfohlen:**
- `ADMIN_API_KEY` + `ONBOARDING_API_KEY` + `CRON_SECRET` (Sicherheit)
- `RESEND_API_KEY` (E-Mails)

**Optional:**
- `RETELL_API_KEY` (Telefon-Assistent)
- `WEBHOOK_*` URLs (n8n Integration)
- `SENTRY_*` (Error Monitoring)

## 3. Automatisierter Smoke-Test

```bash
# Lokaler Test (Server muss laufen)
chmod +x scripts/smoke-test.sh
./scripts/smoke-test.sh

# Auf Production testen
./scripts/smoke-test.sh https://deine-domain.vercel.app
```

Der Test prueft automatisch:
- 12 oeffentliche Seiten (Homepage, Blog, Theorie, Preise, Demo-Seiten, ...)
- 4 oeffentliche APIs (Health, Blog, Sitemap, Robots)
- 10 Auth-geschuetzte APIs (muessen 401 zurueckgeben ohne Login)
- 404-Fehlerseite
- Content-Checks (Chatbot auf Homepage, Artikel im Blog, ...)

**Alle Tests gruen = bereit fuer Kunden.**

## 4. Manueller Kunden-Test (Checkliste)

Oeffne die App und pruefe manuell:

- [ ] Homepage laed schnell, Chatbot unten rechts sichtbar
- [ ] Chatbot antwortet auf "Was kostet das?"
- [ ] /preise zeigt 3 Pakete (Starter 99, Pro 249, Premium 349)
- [ ] /anmeldung Formular laesst sich ausfuellen und absenden
- [ ] /theorie Trainer startet mit Fragen
- [ ] /login zeigt Login-Formular
- [ ] Login mit test@fahrschule-autopilot.de / Test1234! funktioniert
- [ ] Dashboard zeigt Schueler, Fahrstunden, Zahlungen
- [ ] /blog zeigt Artikel
- [ ] /impressum und /datenschutz sind erreichbar
- [ ] Handy-Ansicht sieht gut aus (Chrome DevTools > Toggle Device)

## 5. Vercel deployen

```bash
# Vercel CLI installieren (falls noch nicht)
npm i -g vercel

# Projekt verlinken
vercel link

# Environment Variables in Vercel setzen
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add ONBOARDING_API_KEY
vercel env add ADMIN_API_KEY
vercel env add CRON_SECRET
# ... alle weiteren aus .env.example

# Deployen
vercel --prod

# Smoke-Test auf Production
./scripts/smoke-test.sh https://deine-domain.vercel.app
```

## 6. Custom Domain (optional)

1. Vercel Dashboard > Settings > Domains > Add
2. DNS: CNAME `www` -> `cname.vercel-dns.com`
3. DNS: A record `@` -> Vercel IP

## Sicherheits-Features

- Alle CRM/Export/Analytics APIs sind Auth-geschuetzt (Supabase Auth + Tenant-Isolation)
- Admin-API nutzt timing-safe Key-Vergleich
- Retell Webhooks sind signatur-verifiziert (fail-closed)
- Security Headers (X-Frame-Options, CSP, etc.) via vercel.json
- API-Responses haben Cache-Control: no-store
- Rate Limiting auf Chatbot (20/min), Tutor (30/min), E-Mails (10/min)
- DSGVO: Archivierung + Loeschfunktionen + Consent-Felder
