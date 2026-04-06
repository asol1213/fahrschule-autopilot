# Agent 1 — Website & Platform Report

## Ueberblick

Agent 1 hat die komplette Fahrschule Autopilot SaaS-Platform gebaut:
eine Next.js 16 Webanwendung mit CRM-Dashboard, AI-Chatbot, Theorie-Trainer,
Landing Pages und Multi-Tenant-Architektur.

---

## Was wurde gebaut

### Oeffentliche Website (12 Seiten)
- `/` — Homepage mit Hero, Features, Preise, Testimonials, FAQ, Chatbot
- `/preise` — 3 Pakete (Starter 99, Pro 249, Premium 349 EUR/Monat)
- `/anmeldung` — Multi-Step Anmeldeformular mit Validierung
- `/theorie` — AI Theorie-Trainer mit Fragengenerator
- `/blog` — Blog mit AI-generierten Artikeln
- `/gruender` — Gruender-Seite
- `/team` — Team-Seite
- `/impressum` — Impressum
- `/datenschutz` — Datenschutzerklaerung
- `/demo/starter`, `/demo/pro`, `/demo/premium` — Demo-Seiten pro Plan
- `/stadt/[city]` — SEO Landing Pages (Stuttgart, Muenchen, Koeln, etc.)

### CRM Dashboard (auth-geschuetzt)
- `/dashboard` — Uebersicht: Aktive Schueler, Offene Zahlungen, Termine, Bestehensquote
- `/dashboard/schueler` — Schueler-Verwaltung mit Suche + Statusfilter
- `/dashboard/kalender` — Fahrstunden-Kalender
- `/dashboard/zahlungen` — Zahlungs-Uebersicht
- `/dashboard/dokumente` — Dokumenten-Verwaltung
- `/dashboard/pruefungen` — Pruefungs-Uebersicht
- `/dashboard/theorie` — Theorie-Trainer Verwaltung
- `/dashboard/telefon` — AI Telefon-Assistent (Retell.ai)
- `/dashboard/analytics` — Analytics-Dashboard
- `/dashboard/reports` — Monatsberichte

### API Routes (47 Endpoints)
- `/api/health` — Health Check
- `/api/chatbot` — AI Chatbot (Anthropic Claude)
- `/api/tutor` — AI Theorie-Tutor
- `/api/anmeldung` — Anmeldung-Webhook
- `/api/newsletter` — Newsletter-Signup
- `/api/blog` + `/api/blog/cron` — Blog CRUD + automatische Generierung
- `/api/testimonials` — Testimonials (Supabase-basiert)
- `/api/crm/schueler` — Schueler CRUD
- `/api/crm/fahrstunden` — Fahrstunden CRUD
- `/api/crm/zahlungen` — Zahlungen CRUD
- `/api/crm/fahrlehrer` — Fahrlehrer CRUD
- `/api/crm/pruefungen` — Pruefungen CRUD
- `/api/crm/kommunikation` — Kommunikations-Log
- `/api/crm/stats` — CRM Statistiken
- `/api/crm/rechnungen` — Rechnungen
- `/api/crm/dokumente/upload` — Dokument-Upload
- `/api/crm/lead-from-call` — Lead aus Telefonanruf
- `/api/export` — CSV Export
- `/api/export/pdf` — PDF Report (auth-geschuetzt)
- `/api/reporting` — Monatsreporting
- `/api/analytics` — Analytics-Daten
- `/api/retell` — Retell.ai Webhook (signatur-verifiziert)
- `/api/retell/agents` — Retell Agenten-Verwaltung
- `/api/sales/leads` — Sales Pipeline (auth-geschuetzt)
- `/api/admin/metrics` — Admin-Dashboard (API-Key, timing-safe)
- `/api/email/send` — E-Mail Versand (Resend)
- `/api/email/report` — E-Mail Reports
- `/api/cron/monthly-report` — Monatlicher Cron-Report
- `/api/dsgvo/anrufe-archivieren` — DSGVO Archivierung
- ... und weitere

### Datenbank (Supabase/Postgres)
4 Migration-Dateien:
- `001_initial_schema.sql` — 9 Tabellen: tenants, tenant_users, fahrlehrer, schueler, fahrstunden, zahlungen, dokumente, kommunikation, pruefungen
- `002_analytics_tables.sql` — anrufe, theorie_events, demo_besuche, sales_leads, follow_ups
- `003_retell_agents_and_archival.sql` — retell_agents, anrufe_archiv, DSGVO-Funktionen
- `004_testimonials.sql` — testimonials Tabelle

### Security & Production-Hardening
- Auth auf allen CRM/Export/Analytics APIs (Supabase Auth + Tenant-Isolation)
- Timing-safe API-Key Vergleich (Admin-Endpoints)
- Retell Webhook Signatur-Verifizierung (fail-closed)
- Security Headers via vercel.json (X-Frame-Options, CSP, XSS-Protection)
- Rate Limiting: Chatbot 20/min, Tutor 30/min, E-Mail 10/min
- DSGVO: Archivierung, Loeschfunktionen, Consent-Felder
- Custom Error Pages: 404, Error Boundary, Global Error, Loading State
- Sentry Error Monitoring (SDK + instrumentation.ts)

### SEO & Performance
- Sitemap.xml (statisch + dynamisch)
- robots.txt (blockiert /api, /dashboard, /login)
- Open Graph Images (dynamisch generiert)
- Schema.org JSON-LD (Organization, Software, FAQ, Breadcrumbs)
- Bundle-Optimierung: optimizePackageImports (lucide, recharts, framer-motion)
- Image-Formate: AVIF + WebP
- Dynamic Import fuer ChatWidget (kein SSR)

### Testing & Deployment
- `scripts/smoke-test.sh` — Automatisierter Test (26 Checks)
- `scripts/setup.sh` — Setup-Script
- `PRODUCTION.md` — Schritt-fuer-Schritt Deployment Guide
- `vercel.json` — Cron Jobs + Security Headers
- `.env.example` — Template fuer alle Env-Variablen

---

## Zugangsdaten & Keys

### Supabase (Datenbank)
| Key | Wert |
|-----|------|
| Project ID | YOUR-PROJECT-REF |
| Project URL | https://YOUR-PROJECT-REF.supabase.co |
| Region | Central EU (Frankfurt) |
| Anon Key | (siehe .env.local) |
| Service Role Key | Im Supabase Dashboard: Settings > API Keys > Secret Key |

### Test-User (Login)
| Key | Wert |
|-----|------|
| E-Mail | (siehe .env.local) |
| Passwort | (siehe .env.local) |
| User-ID | 783df1ac-9c49-410b-9188-10fdc2fc2626 |
| Rolle | inhaber |

### Test-Tenant
| Key | Wert |
|-----|------|
| Tenant-ID | 11111111-1111-1111-1111-111111111111 |
| Name | Fahrschule Testmeister |
| Plan | premium |

### Aktuelle .env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Noch fehlende Keys (muessen ergaenzt werden)
| Key | Wozu | Wo bekommt man ihn |
|-----|------|---------------------|
| SUPABASE_SERVICE_ROLE_KEY | Server-seitige DB-Operationen | Supabase Dashboard > Settings > API Keys |
| ANTHROPIC_API_KEY | AI Chatbot + Theorie-Tutor | console.anthropic.com |
| ADMIN_API_KEY | Admin-Dashboard Zugang | Selbst generieren (z.B. `openssl rand -hex 32`) |
| ONBOARDING_API_KEY | Onboarding API Zugang | Selbst generieren |
| CRON_SECRET | Vercel Cron Jobs Authentifizierung | Selbst generieren |
| RESEND_API_KEY | E-Mail Versand | resend.com |
| RETELL_API_KEY | AI Telefon-Assistent | app.retell.ai > Settings > API Keys |
| SENTRY_DSN | Error Monitoring | sentry.io > Projekt erstellen |
| NEWSLETTER_WEBHOOK_URL | Newsletter-Events an n8n | n8n Webhook URL |
| WEBHOOK_ANMELDUNG_URL | Anmeldungen an n8n | n8n Webhook URL |
| N8N_EVENTS_WEBHOOK_URL | CRM Events an n8n | n8n Webhook URL |

---

## Tech-Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Frontend | React | 19.2.4 |
| Sprache | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Datenbank | Supabase (Postgres) | - |
| AI Chatbot | Anthropic Claude (Haiku) | - |
| Telefon-AI | Retell.ai | - |
| E-Mail | Resend | - |
| Monitoring | Sentry | 10.46.0 |
| Animationen | Framer Motion | 12.x |
| Charts | Recharts | 3.x |
| Icons | Lucide React | 1.7.x |
| Deployment | Vercel | - |

---

## Dateien die Agent 1 erstellt/bearbeitet hat

### Erstellt
- Gesamte `src/` Struktur (28 Seiten, 47 API Routes, Components, Libs)
- `supabase/migrations/001-004` (Datenbank-Schema)
- `supabase/seed.sql` (Testdaten)
- `scripts/smoke-test.sh` (Automatisierte Tests)
- `PRODUCTION.md` (Deployment Guide)
- `.env.example` (Env-Template)
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- `src/instrumentation.ts` (Sentry Runtime-Integration)
- `src/app/not-found.tsx` (404 Seite)
- `src/app/error.tsx` (Error Boundary)
- `src/app/global-error.tsx` (Root Error Boundary)
- `src/app/loading.tsx` (Loading State)

### Optimiert
- `next.config.ts` — Sentry + Bundle-Optimierung + Image-Formate
- `vercel.json` — Security Headers + Cache-Control
- `src/app/api/sales/leads/route.ts` — Auth hinzugefuegt
- `src/app/api/export/pdf/route.ts` — Auth + Tenant-Isolation
- `src/app/api/retell/route.ts` — Webhook fail-closed
- `src/app/api/admin/metrics/route.ts` — Timing-safe Key-Vergleich
- `src/app/api/testimonials/route.ts` — Von Filesystem auf Supabase migriert
- `src/lib/events/emit.ts` — Console.log nur in Development

---

## Schnellstart

```bash
cd fahrschule-autopilot-website
npm run dev
# Browser: http://localhost:3000
# Login: (siehe .env.local)
# Smoke-Test: ./scripts/smoke-test.sh
```

## Build-Status
- Letzter Build: Erfolgreich
- Seiten: 91/91 statisch generiert
- TypeScript: Keine Fehler
- Kompilierung: 4.1s
