# FAHRSCHULE AUTOPILOT — Master-Dokumentation
## Stand: 1. April 2026

---

# 1. UNTERNEHMEN

| Feld | Wert |
|------|------|
| **Firmenname** | Fahrschule Autopilot / Andrew Arbo |
| **Gruender** | Andrew Arbo |
| **Adresse** | Rosenstockweg 1, 90766 Fuerth |
| **E-Mail** | andrew@fahrschulautopilot.de |
| **Telefon** | +49 171 4774026 |
| **WhatsApp** | +49 171 4774026 |
| **Website** | https://fahrschulautopilot.de |
| **Rechtsform** | Einzelunternehmen (Kleinunternehmerregelung Paragraph 19 UStG) |
| **Branche** | SaaS / AI-Automation fuer Fahrschulen |
| **Markt** | Deutschland (DACH) |
| **Calendly** | https://calendly.com/andrewarbohq/30min |
| **GitHub** | https://github.com/asol1213/autopilot-fahrschule (private) |

---

# 2. PRODUKT & PRICING

## Pricing-Modell

| Plan | Preis/Monat | Zielgruppe |
|------|-------------|------------|
| **Starter** | 99 EUR | Fahrschulen die sofort Ergebnisse sehen wollen |
| **Pro** | 249 EUR | Das Komplettpaket — alles automatisiert |
| **Premium** | 349 EUR | Voller Vorsprung mit Website, SEO, 24/7 Support |
| **AI-Telefon Addon** | +149 EUR | KI-Telefon-Assistent (fonio.ai / Retell.ai) |

- Keine Einrichtungsgebuehr
- Keine Vertragsbindung, monatlich kuendbar
- 30-Tage-Geld-zurueck-Garantie

## Features pro Plan

### Starter (99 EUR)
- Automatische Termin-Erinnerungen
- Google-Bewertungen Automation
- Basis-Reporting (monatlich)
- E-Mail Support

### Pro (249 EUR)
- Alles aus Starter
- Zahlungserinnerungen
- AI-Chatbot fuer Website (5-sprachig: DE/TR/AR/RU/EN)
- Schueler-Onboarding Automation
- Empfehlungssystem
- Wartelisten-Management
- Woechentliches Reporting
- Priority Support

### Premium (349 EUR)
- Alles aus Pro
- Professionelle Website mit SEO
- Blog-Erstellung & Content
- Terminbuchung online
- CRM & Schueler-Datenbank
- Dedizierter Ansprechpartner
- 24/7 Support

## Feature-Matrix (Code-Referenz)

```
Starter:  erinnerungen, bewertungen, reporting
Pro:      + zahlungen, chatbot, onboarding, empfehlungen, anmeldung
Premium:  + telefon, website, theorie, crm, blog (alle Features)
```

---

# 3. TECHNOLOGIE-STACK

## Frontend

| Technologie | Version | Zweck |
|------------|---------|-------|
| Next.js | 16.2.1 | Framework (App Router) |
| React | 19.2.4 | UI Library |
| TypeScript | 5.x (strict: true) | Type Safety |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.38.0 | Animationen |
| Recharts | 3.8.1 | Charts/Diagramme |
| Lucide React | 1.7.0 | Icons |
| jsPDF | 4.2.1 | PDF-Generierung |
| Zod | 4.3.6 | Runtime-Validierung |
| React Hook Form | 7.72.0 | Formular-Handling |
| next-themes | 0.4.6 | Dark/Light Mode |
| canvas-confetti | 1.9.4 | Erfolgs-Animationen |

## Backend

| Technologie | Version | Zweck |
|------------|---------|-------|
| Vercel | — | Hosting & Serverless Functions |
| Supabase | 2.100.1 | Datenbank (PostgreSQL, Frankfurt/AWS) |
| @supabase/ssr | 0.9.0 | Server-Side Auth |
| Stripe | 21.0.1 | Online-Zahlungen |
| Resend | 6.9.4 | E-Mail-Versand |
| Anthropic Claude | Haiku 4.5 | AI-Chatbot & Theorie-Tutor |
| Retell.ai / fonio.ai | — | KI-Telefon-Assistent |
| n8n | latest | Workflow-Automation (Self-hosted auf Pi) |
| @sentry/nextjs | 10.46.0 | Error-Tracking & Performance |
| pg | 8.20.0 | PostgreSQL Driver |
| server-only | 0.0.1 | Server-only Guards |
| Vitest | 4.1.2 | Testing Framework |

## Dev Dependencies

| Technologie | Version | Zweck |
|------------|---------|-------|
| @tailwindcss/postcss | 4.x | CSS Framework |
| eslint | 9.x | Linting |
| eslint-config-next | 16.2.1 | Next.js ESLint Config |

## Infrastruktur

| System | Details |
|--------|---------|
| Domain | fahrschulautopilot.de (Cloudflare) |
| Website | Vercel (Production) |
| Datenbank | Supabase (eu-central-1, Frankfurt) |
| Automation | Raspberry Pi 5 (8GB, 512GB NVMe SSD) |
| Backup | Pi (03:00) + GitHub (03:30) taeglich |
| Monitoring | Sentry (Production) + Uptime Kuma auf Pi |
| CI/CD | GitHub Actions (lint + types + tests + build + deploy) |

---

# 4. FRONTEND (37 Seiten, 48 Komponenten)

## 4.1 Seiten-Uebersicht

### Oeffentliche Seiten (15)

| Seite | URL | Datei |
|-------|-----|-------|
| Homepage | / | src/app/page.tsx |
| Preise | /preise | src/app/preise/page.tsx |
| FAQ | /faq | src/app/faq/page.tsx |
| Blog | /blog | src/app/blog/page.tsx |
| Blog-Artikel | /blog/[slug] | src/app/blog/[slug]/page.tsx |
| Fallstudien | /fallstudien | src/app/fallstudien/page.tsx |
| Team | /team | src/app/team/page.tsx |
| Gruender | /gruender | src/app/gruender/page.tsx |
| Anmeldung | /anmeldung | src/app/anmeldung/page.tsx |
| Warteliste | /warteliste | src/app/warteliste/page.tsx |
| Login | /login | src/app/login/page.tsx |
| Theorie-Trainer | /theorie | src/app/theorie/page.tsx |
| Datenschutz | /datenschutz | src/app/datenschutz/page.tsx |
| Impressum | /impressum | src/app/impressum/page.tsx |
| Schueler-Login | /schueler/login | src/app/schueler/login/page.tsx |

### Dashboard-Seiten (14)

| Seite | URL | Datei |
|-------|-----|-------|
| Uebersicht | /dashboard | src/app/dashboard/page.tsx |
| Schueler | /dashboard/schueler | src/app/dashboard/schueler/page.tsx |
| Schueler-Detail | /dashboard/schueler/[id] | src/app/dashboard/schueler/[id]/page.tsx |
| Kalender | /dashboard/kalender | src/app/dashboard/kalender/page.tsx |
| Pruefungen | /dashboard/pruefungen | src/app/dashboard/pruefungen/page.tsx |
| Zahlungen | /dashboard/zahlungen | src/app/dashboard/zahlungen/page.tsx |
| Dokumente | /dashboard/dokumente | src/app/dashboard/dokumente/page.tsx |
| Fahrzeuge | /dashboard/fahrzeuge | src/app/dashboard/fahrzeuge/page.tsx |
| Vertraege | /dashboard/vertraege | src/app/dashboard/vertraege/page.tsx |
| Telefon | /dashboard/telefon | src/app/dashboard/telefon/page.tsx |
| Theorie | /dashboard/theorie | src/app/dashboard/theorie/page.tsx |
| Analytics | /dashboard/analytics | src/app/dashboard/analytics/page.tsx |
| Reporting | /dashboard/reporting | src/app/dashboard/reporting/page.tsx |
| ROI | /dashboard/roi | src/app/dashboard/roi/page.tsx |

### Schueler-Portal (2)

| Seite | URL | Datei |
|-------|-----|-------|
| Dashboard | /schueler/dashboard | src/app/schueler/dashboard/page.tsx |
| Vertrag | /schueler/vertrag | src/app/schueler/vertrag/page.tsx |

### Admin-Seiten (2)

| Seite | URL | Datei |
|-------|-----|-------|
| Admin Dashboard | /admin | src/app/admin/page.tsx |
| Admin Test | /admin/test | src/app/admin/test/page.tsx |

### SEO & Landing Pages (4 dynamisch)

| Seite | URL | Datei |
|-------|-----|-------|
| Stadt-Seiten | /stadt/[city] | src/app/stadt/[city]/page.tsx |
| Google LP | /lp/google | src/app/lp/google/page.tsx |
| Social LP | /lp/social | src/app/lp/social/page.tsx |
| Demo-Seiten | /demo/[plan] | src/app/demo/[plan]/page.tsx |

### Staedte: nuernberg, muenchen, stuttgart, berlin, hamburg, koeln, frankfurt, duesseldorf

## 4.2 Layouts (6)

| Layout | Datei |
|--------|-------|
| Root Layout | src/app/layout.tsx (211 Zeilen) |
| Login Layout | src/app/login/layout.tsx |
| Schueler Layout | src/app/schueler/layout.tsx |
| Schueler Login Layout | src/app/schueler/login/layout.tsx |
| Schueler Dashboard Layout | src/app/schueler/dashboard/layout.tsx |
| Dashboard Layout | src/app/dashboard/layout.tsx |

## 4.3 Root Layout (src/app/layout.tsx — 211 Zeilen)

- **Metadata**: Title, Description, Keywords, OpenGraph, Twitter Card
- **Fonts**: Geist Sans & Geist Mono (Google Fonts mit Subsets)
- **Structured Data (JSON-LD)**: Organization Schema, SoftwareApplication Schema, FAQ Schema
- **Sprache**: de (Deutsch)
- **Theme**: Dark Mode Default mit suppressHydrationWarning
- **Favicon**: /favicon.ico

## 4.4 Komponenten-Architektur (48 Komponenten)

### Root-Komponenten (23 Dateien, 3.623 Zeilen)

| Komponente | Zeilen | Zweck |
|-----------|--------|-------|
| AnmeldungForm.tsx | 440 | Multi-Step Anmeldeformular (4 Schritte) |
| ChatWidget.tsx | 363 | AI-Chatbot (Mobile-responsive, aria-live, ESC-key, role="dialog") |
| ROICalculator.tsx | 321 | Interaktiver ROI-Rechner |
| Testimonials.tsx | 316 | Kundenstimmen mit Sterne-Bewertung |
| PricingSection.tsx | 241 | 3-Tier Pricing mit Popular-Badge |
| PhoneAssistantSection.tsx | 240 | Telefon-Assistent Info |
| FeaturesSection.tsx | 189 | Feature-Grid mit InView-Animationen |
| Footer.tsx | 171 | 4-Spalten Footer mit Social-Links |
| DemoPreview.tsx | 163 | Demo-Vorschau |
| Hero.tsx | 152 | Hero-Section mit animierten Countern |
| Navbar.tsx | 144 | Navigation mit Hamburger-Menu, Theme-Toggle |
| ProblemSection.tsx | 137 | Problem-Statement |
| CaseStudies.tsx | 99 | Fallstudien |
| AboutSection.tsx | 99 | Ueber-uns Section |
| HowItWorks.tsx | 91 | So funktioniert's |
| FAQPageContent.tsx | 91 | FAQ Seiten-Inhalt |
| FAQ.tsx | 83 | Accordion FAQ |
| SocialProof.tsx | 67 | Social Proof Badges |
| CTASection.tsx | 64 | Call-to-Action |
| StickyCTA.tsx | 58 | Sticky CTA Button |
| AnimatedCounter.tsx | 47 | Animierte Zahlen |
| ThemeToggle.tsx | 35 | Dark/Light Switch (Hydration-Safety) |
| ThemeProvider.tsx | 12 | next-themes Integration |

### Anmeldung Sub-Komponenten (5 Dateien, 729 Zeilen)

| Komponente | Zeilen | Zweck |
|-----------|--------|-------|
| StepLicense.tsx | 206 | Schritt 2: Fuehrerschein |
| StepSubmit.tsx | 159 | Schritt 4: Zusammenfassung + Absenden |
| StepPreferences.tsx | 128 | Schritt 3: Terminwuensche |
| StepPersonalData.tsx | 125 | Schritt 1: Persoenliche Daten |
| shared.tsx | 111 | Wiederverwendbare UI (SectionHeading, Label, Field, RadioPill) |

Zusaetzliche Dateien: anmeldung/types.ts (FormData Interface), anmeldung/constants.ts (KLASSEN, TAGE, UHRZEITEN, SPRACHEN)

### Dashboard-Komponenten (7 Dateien, 1.924 Zeilen)

| Komponente | Zeilen | Zweck |
|-----------|--------|-------|
| AnalyticsDashboard.tsx | 837 | Charts mit Recharts |
| DashboardApp.tsx | 324 | KPI-Dashboard |
| ReportingDashboard.tsx | 313 | Report-Generierung |
| Sidebar.tsx | 180 | Navigation mit Tenant-Switcher |
| ROIReport.tsx | 163 | ROI-Bericht |
| Toast.tsx | 88 | Toast-Benachrichtigungen |
| TenantContext.tsx | 29 | Tenant Context Provider |

### Theorie-Komponenten (3 Dateien, 2.661 Zeilen)

| Komponente | Zeilen | Zweck |
|-----------|--------|-------|
| TheorieApp.tsx | 1.844 | Gamifiziertes Lernsystem (Level, XP, Spaced Repetition) |
| AITutor.tsx | 502 | AI-Theorie-Tutor (Claude SSE-Streaming) |
| QuestionCard.tsx | 315 | Frage-Anzeige mit next/image |

### Demo-Komponenten (8 Dateien, 2.735 Zeilen)

| Komponente | Zeilen | Zweck |
|-----------|--------|-------|
| DemoPage.tsx | 1.927 | Haupt-Demo-Anwendung |
| DemoPricing.tsx | 196 | Demo Pricing |
| DemoHero.tsx | 162 | Demo Hero |
| DemoFeatures.tsx | 157 | Demo Features |
| DemoFooter.tsx | 115 | Demo Footer |
| DemoTracker.tsx | 70 | Demo Tracking |
| DemoBanner.tsx | 65 | Demo Banner |
| LockedFeature.tsx | 43 | Gesperrte Feature Anzeige |

### Weitere Komponenten

- blog/BlogList.tsx
- admin/BusinessDashboard.tsx

## 4.5 Spezial-Seiten

| Datei | Zeilen | Zweck |
|-------|--------|-------|
| error.tsx | 48 | Seiten-Level Error Boundary (Sentry captureException) |
| global-error.tsx | 80 | App-Level Error Boundary (Inline-Styles, Sentry) |
| not-found.tsx | 35 | 404-Seite (Links zu Home + Preise) |
| loading.tsx | 10 | Loading Spinner ("Wird geladen...") |
| dashboard/error.tsx | — | Dashboard Error Boundary |

## 4.6 SEO

| Datei | Zeilen | Zweck |
|-------|--------|-------|
| sitemap.ts | 41 | Dynamische Sitemap (Seiten + Blog + Staedte) |
| robots.ts | 15 | robots.txt (Disallow: /api/, /dashboard/, /login/) |

## 4.7 Theme-System & CSS (src/app/globals.css — 227 Zeilen)

### CSS-Variablen

**Dark Mode (Default):**
```
--c-background: #0a0a0f       --c-foreground: #f0f0f5
--c-primary: #3b82f6           --c-primary-light: #60a5fa
--c-primary-dark: #2563eb      --c-accent: #10b981
--c-accent-light: #34d399      --c-surface: #111118
--c-surface-light: #1a1a24     --c-surface-lighter: #23232f
--c-border: #2a2a3a            --c-muted: #8888a0
```

**Light Mode:**
```
--c-background: #f8f9fc       --c-foreground: #111118
--c-primary: #2563eb           --c-primary-light: #3b82f6
--c-primary-dark: #1d4ed8      --c-accent: #059669
--c-accent-light: #10b981      --c-surface: #ffffff
--c-surface-light: #f1f3f8     --c-surface-lighter: #e5e8ef
--c-border: #d1d5e0            --c-muted: #6b7280
```

### Accessibility Features

| Feature | Implementierung |
|---------|----------------|
| prefers-reduced-motion | Alle Animationen deaktiviert (animation-duration: 0.01ms) |
| :focus-visible | 2px solid primary Ring mit 2px Offset |
| aria-live="polite" | ChatWidget Nachrichten |
| aria-hidden="true" | Dekorative Hero-Orbs |
| aria-invalid + aria-describedby | Login + Anmeldung Formulare |
| role="dialog" | ChatWidget Fenster |
| role="log" | Chat-Nachrichten |
| @supports Fallback | Glass-Effekt fuer aeltere Browser |
| Suspense-Skeletons | /anmeldung, /warteliste |
| Error-Boundaries | error.tsx, global-error.tsx, dashboard/error.tsx |

### Effekte & Animationen
- Smooth Scroll, Custom Scrollbar
- Glow-Effekte (glow-blue, glow-green)
- Glass Morphism mit Backdrop Blur
- Gradient Text (Blue to Green)
- Animated Gradient Border
- Hero Gradient Background
- Grid Pattern Overlay

## 4.8 Statische Daten (src/data/)

| Datei | Zeilen | Inhalt |
|-------|--------|--------|
| cities.ts | 170 | 8 Staedte fuer lokales SEO (CityData Interface) |
| case-studies.ts | 160 | 3 Fallstudien |
| faqs.ts | 167 | FAQ-Daten (5 Kategorien: allgemein, preise, technik, datenschutz, theorie) |
| demos.ts | 125 | Demo-Plan-Daten |
| blog-posts.json | 98 | 5 Blog-Artikel |
| testimonials.json | 32 | Kundenstimmen |
| questions/ | ~2MB | 2.309 Theorie-Fragen (8 JSON-Dateien) |
| stvo/ | — | StVO-Paragraphen fuer AI-Tutor |

### Theorie-Fragen Aufschluesselung

| Kategorie | Datei | Fragen |
|-----------|-------|--------|
| Gefahrenlehre | gefahrenlehre.json (480KB) | 518 |
| Verhalten | verhalten.json (644KB) | 736 |
| Technik | technik.json (385KB) | 478 |
| Verkehrszeichen | verkehrszeichen.json (207KB) | 228 |
| Zusatzstoff B | zusatzstoff_b.json (142KB) | 179 |
| Umwelt | umwelt.json (87KB) | 99 |
| Vorfahrt | vorfahrt.json (45KB) | 54 |
| Persoenlich | persoenlich.json (14KB) | 17 |
| **Gesamt** | | **2.309** |

## 4.9 next.config.ts

### Security Headers
- X-DNS-Prefetch-Control: on
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

### Optimierungen
- Image Formats: avif, webp
- Package Import Optimization: lucide-react, recharts, framer-motion
- Sentry Source Maps (wenn SENTRY_AUTH_TOKEN gesetzt)

### API Headers
- Cache-Control: no-store, max-age=0

## 4.10 TypeScript-Konfiguration (tsconfig.json)

- Target: ES2017
- Module: esnext
- strict: true
- Path Alias: @/* => ./src/*
- JSX: react-jsx
- incremental: true

---

# 5. BACKEND — API-ENDPUNKTE (72 Routes)

## 5.1 Sicherheitsarchitektur (src/lib/api-auth.ts — 219 Zeilen)

| Funktion | Signatur | Zweck |
|----------|----------|-------|
| requireAuth(tenantId?) | async => AuthResult oder NextResponse | Session + Tenant-Pruefung via tenant_users |
| isAuthed(result) | Type Guard | Prueft ob AuthResult (nicht Error) |
| safeCompare(a, b) | => boolean | crypto.timingSafeEqual (Timing-Attack-sicher) |
| requireServiceKey(req, envVar) | async => true oder NextResponse | API-Key aus x-admin-key, x-api-key, Bearer |
| isServiceKeyError(result) | Type Guard | Prueft ob Error |
| requireWebhookSignature(req, secretEnvVar) | async => {body, tenantId} oder NextResponse | HMAC-SHA256 Signatur-Verifikation |
| isWebhookError(result) | Type Guard | Prueft ob Error |
| rateLimit(namespace, max, window) | => (ip) => boolean | In-Memory Rate-Limiter pro IP |
| getClientIp(req) | => string | IP aus x-real-ip oder x-forwarded-for |

### AuthResult Interface
```typescript
{ userId: string, tenantId: string, role: string }
```

## 5.2 Error-Handling (src/lib/api-errors.ts — 42 Zeilen)

| Funktion | Zweck |
|----------|-------|
| apiError(code, message, details?) | Standardisierte JSON Error Response |
| serverError(error, context) | Sentry captureError + generische 500-Antwort |

### Error-Codes => HTTP-Status

| Code | Status |
|------|--------|
| VALIDATION_ERROR | 400 |
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| RATE_LIMITED | 429 |
| CONFLICT | 409 |
| SERVER_ERROR | 500 |

## 5.3 Validierung (src/lib/validation.ts — 184 Zeilen)

### Zod-Schemas

| Schema | Felder | Besonderheiten |
|--------|--------|----------------|
| AnmeldungSchema | vorname, nachname, geburtsdatum, email, telefon, plz, ort, fuehrerscheinklasse, dsgvo, kontaktEinwilligung | dsgvo + kontaktEinwilligung = literal(true), PLZ = 5-stellig Regex |
| LeadFromCallSchema | tenantId, callId, callerName, callerPhone, sentiment | sentiment: positive/neutral/negative |
| WebhookEventSchema | type, tenantId, data | type: 4 Event-Typen |
| ChatbotMessageSchema | message (1-1000 Zeichen), history (max 20, je max 2000) | role: user/assistant |
| NewsletterSchema | email | Zod email() Validierung |
| StornierungSchema | fahrstundeId | UUID |
| MahnwesenSchema | tenantId | Required |
| CalendarSyncSchema | tenantId, calendarId, accessToken, refreshToken | Meiste optional |
| SocialPostSchema | title, excerpt, slug | slug optional |
| GmbPostSchema | type, placeId, fahrschulName, stadt, topic | type: post/review_link/update |
| OutreachSchema | fahrschulName, stadt, inhaber, schuelerZahl, typ | schuelerZahl optional |

### Validierungs-Helper
- validateBody(schema, data) => {data: T} oder {error: NextResponse}
- isValidationError(result) => Type Guard

## 5.4 Rate-Limiting Uebersicht

| Kategorie | Limit | Routes |
|-----------|-------|--------|
| CRM CRUD | 60/min | schueler, fahrstunden, pruefungen, fahrlehrer, dokumente, zahlungen, vertrag, kommunikation, rechnungen, stats, mahnwesen, fahrzeuge, stornierung |
| CRM Read-Heavy | 30/min | calendar-sync, pruefungsreife, ausbildungsnachweis |
| Exports | 10/min | datev, lexoffice, export, export/pdf |
| Analytics | 30-60/min | analytics, kpis, marketing, roi, sales-funnel, telefon, theorie, reporting |
| Sales | 10-60/min | leads (60), churn (30), follow-up (10), outreach (10) |
| AI | 20-100/min | chatbot (50), tutor (100 + 20/Tag) |
| Public | 3-5/min | anmeldung (5), warteliste (5), newsletter (30) |
| Auth | 10/min | auth/student |
| DSGVO | 10/min | crm/dsgvo, dsgvo/anrufe-archivieren |
| Payments | 10-20/min | checkout (20), portal (20) |
| Webhooks | Signatur | payments/webhook, retell, webhooks/events |
| Crons | Service-Key | mahnwesen, dsgvo-cleanup, anomaly-check, blog/cron, monthly-report |

## 5.5 Alle API-Routes (72)

### CRM (22 Routes)

| Endpunkt | Methoden | Auth | Beschreibung |
|----------|----------|------|-------------|
| /api/crm/schueler | GET, POST, PATCH | requireAuth(tenantId) | Schueler CRUD + Status-Pipeline |
| /api/crm/fahrlehrer | GET, POST, PATCH | requireAuth(tenantId) | Fahrlehrer CRUD |
| /api/crm/fahrstunden | GET, POST, PATCH | requireAuth(tenantId) | Fahrstunden CRUD + Auto-Rechnung bei "abgeschlossen" |
| /api/crm/fahrzeuge | GET, POST, PATCH | requireAuth(tenantId) | Fahrzeugverwaltung |
| /api/crm/pruefungen | GET, POST, PATCH | requireAuth(tenantId) | Pruefungen CRUD + bestanden/nicht_bestanden Events |
| /api/crm/dokumente | GET, POST, PATCH | requireAuth(tenantId) | Dokumente-Checkliste |
| /api/crm/dokumente/upload | POST | requireAuth | Dokument-Upload (MIME-Check) |
| /api/crm/dokumente/download | GET | requireAuth | Dokument-Download |
| /api/crm/zahlungen | GET, POST, PATCH | requireAuth(tenantId) | Zahlungen CRUD + Summen-Aggregation |
| /api/crm/vertrag | GET, POST, PATCH | requireAuth(tenantId) | Vertraege CRUD + E-Signatur |
| /api/crm/vertrag/pdf | GET | requireAuth | Vertrag als PDF generieren |
| /api/crm/kommunikation | GET, POST | requireAuth | Nachrichtenlog (WhatsApp, E-Mail, Telefon) |
| /api/crm/rechnungen | GET, POST | requireAuth | Revenue Reports |
| /api/crm/stats | GET | requireAuth | Dashboard KPIs |
| /api/crm/pruefungsreife | GET, POST | requireAuth | Pruefungsreife-Score |
| /api/crm/pruefungserinnerungen | POST | requireAuth | Pruefungserinnerungen senden |
| /api/crm/mahnwesen | GET, POST | requireAuth/CRON_SECRET | 3-Stufen-Mahnwesen |
| /api/crm/stornierung | POST | requireAuth | Stornierung mit 24h-Regel |
| /api/crm/calendar-sync | POST | requireAuth | Kalender-Sync |
| /api/crm/dsgvo | GET, DELETE, POST | requireAuth | DSGVO Datenexport & Loeschung |
| /api/crm/ausbildungsnachweis | GET, POST | requireAuth | Ausbildungsnachweis PDF |
| /api/crm/lead-from-call | POST | Webhook-Signatur | Lead aus Telefonanruf erstellen |
| /api/crm/export/datev | GET | requireAuth | DATEV CSV Export |
| /api/crm/export/lexoffice | GET | requireAuth | lexoffice CSV Export |

### Payments (3 Routes)

| Endpunkt | Methoden | Auth | Beschreibung |
|----------|----------|------|-------------|
| /api/payments/checkout | POST | requireAuth | Stripe Checkout Session erstellen |
| /api/payments/webhook | POST | Stripe-Signatur | Stripe Webhook (idempotent, Betrags-Verifikation) |
| /api/payments/portal | POST | requireAuth | Stripe Kundenportal |

### Analytics (9 Routes)

| Endpunkt | Methoden | Auth | Beschreibung |
|----------|----------|------|-------------|
| /api/analytics | GET | requireAuth | Haupt-KPIs + Anomalien |
| /api/analytics/telefon | GET, POST | requireAuth | AI-Telefon Metriken |
| /api/analytics/theorie | GET, POST | requireAuth | Theorie-Trainer Stats |
| /api/analytics/conversion | GET | requireAuth | Demo-Conversion |
| /api/analytics/marketing | GET | ADMIN_API_KEY | Marketing-Metriken |
| /api/analytics/sales-funnel | GET, POST | ADMIN_API_KEY | 7-Stufen Sales Pipeline |
| /api/analytics/nps | GET, POST | requireAuth | NPS-Score Tracking |
| /api/analytics/roi | GET | requireAuth | ROI-Berechnung |
| /api/analytics/kpis | GET | requireAuth | Aggregierte KPIs |

### AI & Kommunikation (6 Routes)

| Endpunkt | Methoden | Auth | Beschreibung |
|----------|----------|------|-------------|
| /api/chatbot | POST | Public (Rate-Limited) | AI-FAQ-Bot (Claude Haiku, 5-sprachig) |
| /api/tutor | POST | Public (Rate-Limited) | AI-Theorie-Tutor (SSE-Streaming) |
| /api/retell | GET, POST | Webhook-Signatur | Retell.ai Webhook Handler |
| /api/retell/agents | GET, POST | requireAuth | Agent-Mappings pro Tenant |
| /api/email/send | POST | requireAuth | E-Mail-Versand (Resend) |
| /api/email/report | POST | ADMIN_API_KEY | E-Mail-Report an Tenant |

### Admin & Sales (5 Routes)

| Endpunkt | Methoden | Auth | Beschreibung |
|----------|----------|------|-------------|
| /api/admin/metrics | GET | ADMIN_API_KEY | MRR, ARR, LTV, CAC |
| /api/sales/leads | GET, POST, PUT | requireAuth | Sales-Leads CRUD |
| /api/sales/churn | GET | ADMIN_API_KEY | Churn-Risiko Analyse |
| /api/sales/follow-up | GET, POST, PUT | ADMIN_API_KEY | Follow-Up Queue |
| /api/sales/outreach | POST | ADMIN_API_KEY | Outreach-Generierung (Claude) |

### Cron Jobs (5 Routes)

| Endpunkt | Auth | Schedule | Beschreibung |
|----------|------|----------|-------------|
| /api/cron/monthly-report | CRON_SECRET | 1. des Monats, 08:00 UTC | Monatlicher KPI-Report per E-Mail |
| /api/cron/mahnwesen | CRON_SECRET | Taeglich, 09:00 UTC | Taeglicher Mahnlauf |
| /api/cron/dsgvo-cleanup | CRON_SECRET | Sonntag, 03:00 UTC | DSGVO-Bereinigung |
| /api/cron/anomaly-check | CRON_SECRET | Mo-Fr, 07:00 UTC | Anomalie-Erkennung + Alert |
| /api/blog/cron | CRON_SECRET | Montag, 09:00 UTC | Blog-Generierung (Claude) |

### Weitere Endpunkte (22 Routes)

| Endpunkt | Methoden | Auth | Beschreibung |
|----------|----------|------|-------------|
| /api/anmeldung | POST | Public (5/min) | Schueler-Online-Anmeldung |
| /api/warteliste | GET, POST | Public (5/min) | Oeffentliche Warteliste |
| /api/newsletter | POST | Public (30/min) | Newsletter-Abo |
| /api/newsletter/generate | GET | ADMIN_API_KEY | Newsletter via Claude generieren |
| /api/health | GET | Public | System Health Check |
| /api/auth/student | POST | Public (10/min) | Schueler-Registrierung mit Invite-Code |
| /api/schueler/meine-daten | GET, PATCH | Student Auth | Schueler-Portal Daten |
| /api/onboarding | POST | ADMIN_API_KEY | Onboarding-Checkliste |
| /api/switch-tenant | POST | requireAuth | Tenant wechseln |
| /api/testimonials | GET, POST | Public GET, Auth POST | Testimonials CRUD |
| /api/social | POST | requireAuth | Social Media Posts generieren |
| /api/gmb | POST | requireAuth | Google My Business Posts |
| /api/blog | GET, POST | Public GET, Auth POST | Blog-Posts CRUD |
| /api/blog/update | PATCH | requireAuth | Blog-Post Update |
| /api/export | GET | requireAuth | CSV-Export (schueler/zahlungen/fahrstunden) |
| /api/export/pdf | POST | requireAuth | PDF-Export |
| /api/progress/theorie | GET, POST | requireAuth | Theorie-Fortschritt Sync |
| /api/dsgvo/anrufe-archivieren | GET, POST, DELETE | requireAuth/CRON_SECRET | Anrufe archivieren (DSGVO) |
| /api/webhooks/events | POST | Webhook-Signatur (HMAC) | Inter-Agent Event-Webhook |
| /api/reporting | GET | requireAuth | Report-Generierung |

---

# 6. DATENBANK / DATA LAYER

## 6.1 Uebersicht

| Metrik | Wert |
|--------|------|
| Tabellen | 32 |
| RLS Policies | 47 |
| Indexes | 62 |
| Functions | 8 |
| Triggers | 5 |
| Migrations | 13 |
| Provider | Supabase (PostgreSQL, eu-central-1 Frankfurt) |

## 6.2 Alle 32 Tabellen

### Core (2)
| Tabelle | Zweck |
|---------|-------|
| tenants | Fahrschulen (Multi-Tenant) |
| tenant_users | User-Tenant-Zuordnung (Rollen: inhaber, fahrlehrer) |

### CRM (7)
| Tabelle | Zweck |
|---------|-------|
| schueler | Fahrschueler (Status-Pipeline, DSGVO, Stripe) — 23+ Felder |
| fahrlehrer | Fahrlehrer pro Tenant |
| fahrstunden | Fahrstunden (typ: normal, sonderfahrt_*, pruefungsvorbereitung) |
| pruefungen | Theorie/Praxis-Pruefungen mit Ergebnis |
| dokumente | Sehtest, Erste-Hilfe, Passfoto, Ausweis, Fuehrerschein-Antrag |
| zahlungen | Rechnungen mit Status, Mahnungsstufe, Stripe-Session |
| kommunikation | Nachrichtenlog (WhatsApp, E-Mail, Telefon, Website, SMS) |

### Vertraege & Fahrzeuge (2)
| Tabelle | Zweck |
|---------|-------|
| vertraege | Digitale Vertraege (Ausbildungsvertrag, DSGVO-Einwilligung, E-Signatur) |
| fahrzeuge | Fahrzeugverwaltung (Kennzeichen, TUeV, KM, Status) |

### Automation & Warteliste (5)
| Tabelle | Zweck |
|---------|-------|
| automation_log | Log aller automatisierten Aktionen |
| warteliste | Interne Warteliste (wartend, angeboten, gebucht) |
| warteliste_public | Oeffentliche Warteliste (Lead-Capture, keine RLS) |
| buchungsanfragen | Online-Terminbuchungen |
| beschwerden | Beschwerde-Tracking |
| verschiebungen | Termin-Verschiebungen |

### Telefon & AI (3)
| Tabelle | Zweck |
|---------|-------|
| anrufe | AI-Telefon Anrufprotokoll (Intent, Sentiment, Recording) |
| anrufe_archiv | Archivierte Anrufe (DSGVO-anonymisiert) |
| retell_agents | Retell.ai Agent-Mappings pro Tenant |

### Sales & Analytics (5)
| Tabelle | Zweck |
|---------|-------|
| sales_leads | B2B Sales-Pipeline (neu -> demo_gebucht -> gewonnen/verloren) |
| sales_activities | Sales-Aktivitaeten (outreach, antwort, discovery_call, demo, angebot) |
| follow_ups | Follow-Up Queue |
| demo_besuche | Demo-Tracking (anonymisiert, UTM) |
| nps_responses | NPS-Score Tracking (0-10) |

### Theorie & Schueler-Auth (3)
| Tabelle | Zweck |
|---------|-------|
| theorie_events | Theorie-Trainer Events (question_answered, quiz_completed) |
| theorie_progress | Theorie-Lernfortschritt (user-scoped, XP, Streaks) |
| student_invites | Einladungscodes (max_uses, expires_at) |
| students | Schueler-Auth Accounts (user_id, tenant_id) |

### Audit & DSGVO (3)
| Tabelle | Zweck |
|---------|-------|
| audit_log | Soft-Delete Audit-Protokoll (INSERT/UPDATE/DELETE/SOFT_DELETE/RESTORE) |
| dsgvo_audit_log | DSGVO-Loeschungs-Protokollierung |
| testimonials | Kundenstimmen (approved boolean) |

## 6.3 TypeScript-Interfaces (src/lib/db/schema.ts)

### 8 Interfaces

| Interface | Felder | Besonderheiten |
|-----------|--------|----------------|
| Schueler | 23+ | DSGVO-Consent (whatsapp/email/dsgvo-Einwilligung), Stripe, Soft-Delete |
| Fahrstunde | 11 | typ: 5 Enum-Werte, bewertung: 1-5, status: 4 Werte |
| Zahlung | 10 | betrag, mahnungsStufe (0-3), stripeSessionId |
| Dokument | 8 | typ: 6 Enum-Werte, vorhanden: boolean, ablaufDatum |
| Kommunikation | 8 | kanal: 5 Kanäle, richtung: eingehend/ausgehend |
| Pruefung | 8 | typ: theorie/praxis, ergebnis: bestanden/nicht_bestanden |
| Fahrlehrer | 8 | fuehrerscheinklassen: string[], aktiv: boolean |
| Fahrzeug | 11 | kennzeichen, tuevBis, status: aktiv/werkstatt/ausgemustert |

### 6 Enums

| Enum | Werte |
|------|-------|
| SchuelerStatus | angemeldet, dokumente_ausstehend, theorie, praxis, pruefung, bestanden, abgebrochen |
| ZahlungsStatus | offen, teilbezahlt, bezahlt, ueberfaellig, storniert |
| DokumentTyp | sehtest, erste_hilfe, passfoto, ausweis, fuehrerschein_antrag, sonstiges |
| KommunikationsKanal | whatsapp, email, telefon, website, sms |
| PruefungsTyp | theorie, praxis |
| PruefungsErgebnis | bestanden, nicht_bestanden |

## 6.4 Store-Layer (src/lib/db/store.ts — 650+ Zeilen)

### 8 Store-Namespaces

| Namespace | Methoden |
|-----------|----------|
| schuelerDb | create, getById, getByTenant(pagination), update, delete, hardDelete, search, getByStatus, count |
| fahrstundenDb | create, getBySchueler, getByTenant(pagination), getByDate, getByDateRange, update, delete |
| zahlungenDb | create, getBySchueler, getByTenant(pagination), getOffene, update, delete, summe |
| dokumenteDb | create, getBySchueler, update, delete |
| kommunikationDb | create, getBySchueler |
| pruefungenDb | create, getBySchueler, getByTenant(pagination), update |
| fahrlehrerDb | create, getByTenant, update, delete |
| fahrzeugeDb | create, getByTenant, update, delete |

### Store-Features
- Snake_case <=> camelCase Konversion (rowToSchueler, rowToFahrstunde, etc.)
- Pagination: limit + offset (Default: 50)
- Soft-Delete: deleted_at + .is("deleted_at", null) Filter
- Tenant-Isolation: .eq("tenant_id", tenantId) auf ALLEN Queries

## 6.5 Migrations (13)

| # | Datei | Inhalt |
|---|-------|--------|
| 1 | 001_initial_schema.sql | Core-Tabellen (tenants, schueler, fahrstunden, etc.), RLS, Indexes, get_user_tenant_ids() |
| 2 | 002_analytics_tables.sql | anrufe, theorie_events, demo_besuche, sales_leads, follow_ups |
| 3 | 003_retell_agents_and_archival.sql | retell_agents, anrufe_archiv, DSGVO-Archivierungsfunktionen |
| 4 | 004_testimonials.sql | testimonials Tabelle |
| 5 | 005_agent4_automation_tables.sql | automation_log, warteliste, beschwerden, verschiebungen, buchungsanfragen |
| 6 | 006_sales_activities.sql | sales_activities, nps_responses |
| 7 | 007_agent2_telefon_fixes.sql | call_id Index, Intent-Enum Erweiterung, dsgvo_audit_log |
| 8 | 008_theorie_progress.sql | theorie_progress (user-scoped) |
| 9 | 009_student_auth.sql | student_invites, students Tabellen |
| 10 | 010_softdelete_audit_log.sql | deleted_at Spalten, audit_log, Partial-Indexes |
| 11 | 011_fahrzeuge.sql | fahrzeuge Tabelle |
| 12 | 012_warteliste_public.sql | warteliste_public (oeffentlich, keine RLS) |
| 13 | 013_vertraege.sql | vertraege Tabelle |

## 6.6 Datenbank-Funktionen (8)

| Funktion | Zweck |
|----------|-------|
| get_user_tenant_ids() | Core RLS Helper — gibt alle tenant_ids des aktuellen Users zurueck |
| update_updated_at() | Trigger — setzt updated_at bei UPDATE |
| archiviere_alte_anrufe(tage=90) | DSGVO — anonymisiert & loescht alte Anrufe |
| loesche_anruf_dsgvo(anruf_id, tenant_id) | DSGVO Art. 17 — Einzelloeschung |
| loesche_recordings_ohne_consent() | DSGVO — nullifiziert recording_url ohne Consent |
| soft_delete(tabelle, id, tenant_id, user_id) | Soft-Delete mit Audit-Log |
| restore_deleted(tabelle, id, tenant_id, user_id) | Wiederherstellung geloeschter Datensaetze |
| set_theorie_progress_updated_at() | Trigger fuer theorie_progress |

## 6.7 Demo-Tenants

| Tenant | ID | Plan | Schueler |
|--------|-----|------|---------|
| Fahrschule Mueller | 29decffc-25a6-4bcb-bb36-aac5b83d1887 | Starter | 6 |
| Fahrschule Schmidt | 5b177a69-21d5-410e-b2b0-2b7d92bd2d42 | Pro | 8 |
| Fahrschule Weber | f748a840-5d56-4dfa-b269-6144d595d5cd | Premium | 11 |
| Fahrschule Testmeister | 11111111-1111-1111-1111-111111111111 | Premium | — |

---

# 7. MIDDLEWARE / INTEGRATION

## 7.1 Middleware (src/middleware.ts)

### CORS Handling
- Origins: https://fahrschulautopilot.de, https://www.fahrschulautopilot.de
- Dev: alle Origins erlaubt
- Methoden: GET, POST, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization, x-admin-key, x-api-key, x-webhook-signature
- Preflight Cache: 86.400s (24h)

### Session Refresh
- updateSession() fuer authentifizierte Routes via Supabase Middleware

### Route Matcher
- /dashboard/:path* (alle Dashboard-Routes)
- /login
- /schueler/login
- /api/:path* (alle API-Routes)

## 7.2 Event-System (src/lib/events/emit.ts)

### 18 Event-Typen mit HMAC-SHA256 Signierung

```
fahrstunde.{abgeschlossen, geplant, abgesagt, no_show}
pruefung.{bestanden, nicht_bestanden, geplant}
zahlung.{erstellt, ueberfaellig, bezahlt, fehlgeschlagen, mahnung}
schueler.{angemeldet, status_geaendert, bestanden, dsgvo_loeschung}
dokument.{fehlend, ablauf_bald}
```

### emitEvent(type, tenantId, data)
- Fire-and-forget (async, non-blocking)
- POST an N8N_EVENTS_WEBHOOK_URL
- HMAC-SHA256 Signatur im X-Webhook-Signature Header
- Logging in Dev-Modus

### Preis-Konstanten
```
normal: 55 EUR, sonderfahrt_ueberlandfahrt: 65 EUR,
sonderfahrt_autobahnfahrt: 65 EUR, sonderfahrt_nachtfahrt: 65 EUR,
pruefungsvorbereitung: 70 EUR
```

## 7.3 Supabase Clients

| Client | Datei | Zweck |
|--------|-------|-------|
| Server | src/lib/supabase/server.ts | Cookie-basierte Sessions (next/headers) |
| Browser | src/lib/supabase/client.ts | Client-Side mit Placeholder-Fallback |
| Middleware | src/lib/supabase/middleware.ts | Session-Refresh, Dashboard-Schutz |

---

# 8. INFRASTRUKTUR / DEVOPS

## 8.1 Vercel Deployment

| Eigenschaft | Wert |
|-------------|------|
| Auto-Deploy | Push auf main => Vercel Production |
| Project ID | prj_eyPXgEJGvJ1ddWGmFz9kRQqIcGXd |
| Domain | fahrschulautopilot.de |
| Deploy-Befehl | npx vercel deploy --prod --yes |
| 5 Cron-Jobs | monthly-report, mahnwesen, dsgvo-cleanup, blog/cron, anomaly-check |

## 8.2 CI/CD Pipeline (.github/workflows/ci.yml)

### Trigger: Push auf main, Pull Requests

### Jobs

| Job | Trigger | Schritte |
|-----|---------|----------|
| lint-and-build | Immer | npm run lint, npx tsc --noEmit, npx vitest run, npm audit, npm run build |
| lighthouse | Nur PRs | Lighthouse auf /, /theorie, /anmeldung, /blog |
| deploy-preview | Nur PRs | Vercel Preview Deployment |
| deploy-production | Nur main Push | Vercel Production Deployment (--prod) |

## 8.3 Raspberry Pi 5

### Hardware
- Raspberry Pi 5, 8GB RAM, 512GB NVMe SSD
- IP: YOUR_PI_IP

### Docker-Services (docker-compose.yml)

| Container | Image | Port | Zweck |
|-----------|-------|------|-------|
| n8n | n8nio/n8n:latest | 5678 | Workflow-Automation |
| whatsapp | whatsapp-service (custom) | 3001 | WhatsApp Bridge |
| npm | nginx-proxy-manager | 80/81/443 | Reverse Proxy |
| uptime-kuma | uptime-kuma:1 | 3001 | Uptime Monitoring |
| portainer | portainer-ce:lts | 9443 | Container Management |
| homepage | gethomepage | 3000 | Dashboard |
| watchtower | watchtower | — | Auto-Updates |

### System-Services
- Pi-hole v6.4 (DNS-Adblocker)
- Unbound (Rekursiver DNS, DNSSEC)
- WireGuard VPN (Port 51820)

## 8.4 WhatsApp-Service (whatsapp-service/)

### Architektur
- Framework: Express.js
- WhatsApp: whatsapp-web.js v1.26.1-alpha.3
- Auth: LocalAuth (Session in /data/session)
- Puppeteer: Headless Chromium (Node 20-slim)

### Endpunkte

| Endpunkt | Methode | Zweck |
|----------|---------|-------|
| /send | POST | WhatsApp-Nachricht senden ({number, message}) |
| /qr | GET | QR-Code fuer Geraeteverknuepfung (HTML) |
| /health | GET | Verbindungsstatus ({connected: bool}) |
| /status | GET | Detaillierter Status mit Client-Info |

### Webhook
- Eingehende Nachrichten werden an http://n8n:5678/webhook/whatsapp-incoming weitergeleitet
- Payload: {from, body, timestamp, fromMe}

## 8.5 Backups

| Zeit | Ziel | Methode | Skript |
|------|------|---------|--------|
| 03:00 | Raspberry Pi | rsync (LaunchAgent) | sync-to-pi.sh |
| 03:30 | GitHub | git auto-commit + push (LaunchAgent) | sync-to-github.sh |
| Kontinuierlich | Supabase | Automatische Backups (managed) | — |

### sync-to-pi.sh
- Excludes: node_modules, .next, .vercel, .git, .DS_Store
- Pre-Check: Ping Pi vor Sync
- Log: /tmp/autopilot-sync.log

### sync-to-github.sh
- Auto-Commit mit Timestamp ("Auto-Sync YYYY-MM-DD HH:MM")
- Push auf main Branch
- Skip wenn keine Aenderungen
- Log: /tmp/autopilot-github-sync.log

---

# 9. N8N WORKFLOWS (38 Workflow-Dateien)

## 9.1 Production Workflows (13)

| # | Workflow | Trigger | Beschreibung |
|---|---------|---------|-------------|
| 1 | termin-erinnerungen | Alle 15 Min | 24h + 2h WhatsApp-Reminder |
| 2 | feedback-bewertungen | Stuendlich | Google-Reviews nach Pruefung |
| 3 | zahlungserinnerungen | Alle 6h | 3-Stufen-Mahnwesen via WhatsApp |
| 4 | wartelisten-management | Webhook | Absage -> naechster Schueler |
| 5 | onboarding-flow | Webhook | Willkommen + Dokumente + Theorie |
| 6 | empfehlung-und-glueckwuensche | Alle 2h | Nach bestandener Pruefung |
| 7 | theorie-und-dokumente-reminder | Taeglich 18h | Lern-Erinnerung |
| 8 | inbound-faq-bot | Webhook | Claude AI WhatsApp-Bot |
| 9 | terminbuchung | Webhook | Online-Buchung + Lehrer-Notify |
| 10 | fahrlehrer-zuweisung | Webhook | Automatische Zuordnung |
| 11 | dsgvo-archivierung | Monatlich | Auto-Anonymisierung nach 6 Monaten |
| 12 | pruefungserinnerungen | Alle 15 Min | 24h + 2h vor Pruefung |
| 13 | zahlungserinnerungen | Alle 6h | 3-Stufen-Mahnwesen via WhatsApp |

## 9.2 Supabase-Varianten (12)
- Gleiche Workflows mit Supabase-Datenbank statt Google Sheets

## 9.3 Dokumentation

| Datei | Inhalt |
|-------|--------|
| ARCHITEKTUR-ENTSCHEIDUNG.md | WhatsApp: Twilio (ausgehend) vs. whatsapp-web.js (eingehend) |
| SETUP-RETELL.md | Telefon-Assistent Setup (Retell.ai + ElevenLabs + n8n) |
| SETUP-ANLEITUNG.md | N8N Workflow-Setup |
| KUNDEN-DEPLOYMENT.md | Deployment fuer neue Kunden |

## 9.4 WhatsApp-Architektur-Entscheidung

| System | Technologie | Verwendung |
|--------|-----------|-----------|
| Twilio | Offizielle API | Alle n8n ausgehenden Workflows |
| whatsapp-web.js | Lokaler Docker | Eingehende Nachrichten, QR-Setup, Health |

**Migration geplant:**
- Phase 1: Twilio Sandbox (kostenlos)
- Phase 2: Twilio WhatsApp Business API (~10-30 EUR/Monat)
- Phase 3: Meta Cloud API (guenstiger pro Nachricht)

---

# 10. SICHERHEIT / SECURITY

## 10.1 Architektur

| Schicht | Implementierung |
|---------|----------------|
| Auth | Supabase Auth (Session-Cookies) + requireAuth(tenantId) |
| Tenant-Isolation | RLS (47 Policies) + tenant_id auf allen Queries inkl. PATCH |
| API-Keys | timingSafeEqual via safeCompare() — 100% aller Routes |
| Webhook-Signatur | HMAC-SHA256 mit requireWebhookSignature() |
| Rate-Limiting | In-Memory per IP, 57/72 Routes (79%) |
| CORS | Origin-Whitelist (fahrschulautopilot.de) + Preflight |
| CSP | Content-Security-Policy in vercel.json |
| Headers | HSTS, X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| File-Upload | MIME-Whitelist + 10MB Limit + Tenant-Isolation |
| Error-Handling | serverError() -> Sentry + generische Client-Antwort |
| Pagination | .limit(500) auf allen List-Queries |
| Soft-Delete | deleted_at + .is("deleted_at", null) Filter |
| Stripe | Signatur-Verifikation + Idempotenz + Betrags-Check |

## 10.2 Security Headers (vercel.json + next.config.ts)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co
    wss://*.supabase.co https://retellai.com https://api.anthropic.com;
    frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Cache-Control: no-store, no-cache, must-revalidate (API)
```

## 10.3 DSGVO-Compliance

| Feature | Implementierung |
|---------|----------------|
| Einwilligungs-Tracking | dsgvo_einwilligung, whatsapp_einwilligung, email_einwilligung |
| Datenexport (Art. 15) | GET /api/crm/dsgvo |
| Datenloeschung (Art. 17) | DELETE /api/crm/dsgvo (mit Bestätigung) |
| Geplante Loeschung | POST /api/crm/dsgvo (3-Jahres-Retention) |
| Archivierung | archiviere_alte_anrufe() — 90 Tage Default |
| Einzelloeschung | loesche_anruf_dsgvo(anruf_id, tenant_id) |
| Recording-Consent | loesche_recordings_ohne_consent() |
| DSGVO-Cleanup Cron | Woechentlich, Sonntag 03:00 UTC |
| Audit-Log | audit_log + dsgvo_audit_log Tabellen |
| Soft-Delete | soft_delete() + restore_deleted() Funktionen |
| AV-Vertrag | AV_VERTRAG_TEMPLATE.docx (vorbereitet) |
| Datenschutzerklaerung | /datenschutz (Supabase, Claude, fonio deklariert) |
| Impressum | /impressum mit Kleinunternehmerregelung |

## 10.4 RLS-Uebersicht

| Kategorie | Tabellen | Policy-Typ |
|-----------|----------|------------|
| Multi-Tenant (get_user_tenant_ids) | tenants, tenant_users, schueler, fahrlehrer, fahrstunden, zahlungen, dokumente, kommunikation, pruefungen, fahrzeuge, vertraege, anrufe, theorie_events, retell_agents, anrufe_archiv, dsgvo_audit_log, nps_responses | SELECT/INSERT/UPDATE/DELETE via Tenant-Zugehoerigkeit |
| Service-Role Bypass | automation_log, warteliste, beschwerden, verschiebungen, buchungsanfragen | FOR ALL USING (true) fuer n8n |
| Admin-Only | demo_besuche, sales_leads, follow_ups, sales_activities | FOR ALL USING (true) fuer Service-Role |
| User-Scoped | theorie_progress, students | auth.uid() = user_id |
| Invite-basiert | student_invites | Tenant-Owners verwalten, jeder kann validieren |
| Public Read | testimonials | SELECT WHERE approved = true |
| Keine RLS | warteliste_public | Anonymer Zugriff (Lead-Capture) |

---

# 11. TESTING / QA

## 11.1 Uebersicht

| Metrik | Wert |
|--------|------|
| Framework | Vitest 4.1.2 |
| Environment | Node |
| Tests gesamt | **932** |
| Test-Dateien | **52** |
| Alle bestanden | Ja |
| CI/CD | GitHub Actions (lint + types + tests + build) |
| TypeScript-Fehler | 0 |
| ESLint-Fehler | 0 |

## 11.2 Test-Dateien nach Kategorie

### API-Route Tests (29 Dateien, ~630 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| crm-schueler.test.ts | 16 | Schueler CRUD + Status-Events |
| crm-fahrlehrer.test.ts | 13 | Fahrlehrer CRUD |
| crm-fahrstunden.test.ts | 14 | Fahrstunden CRUD + Auto-Rechnung |
| crm-fahrzeuge.test.ts | 13 | Fahrzeuge CRUD + Kennzeichen-Validierung |
| crm-zahlungen.test.ts | 12 | Zahlungen CRUD + Summen |
| crm-pruefungen.test.ts | 11 | Pruefungen CRUD + Events |
| crm-dokumente.test.ts | 12 | Dokumente CRUD |
| crm-vertrag.test.ts | 12 | Vertraege CRUD + Signatur |
| crm-kommunikation.test.ts | 9 | Kommunikation GET/POST |
| crm-stats.test.ts | 4 | Dashboard KPIs |
| crm-mahnwesen.test.ts | 12 | 3-Stufen-Mahnwesen + CRON_SECRET |
| crm-dsgvo.test.ts | 12 | DSGVO Export + Loeschung |
| crm-exports.test.ts | 10 | DATEV + lexoffice CSV |
| crm-misc.test.ts | 32 | Pruefungsreife, Calendar-Sync, Ausbildungsnachweis, Pruefungserinnerungen, Rechnungen |
| analytics.test.ts | 44 | Alle 9 Analytics-Routes |
| sales.test.ts | 29 | Leads, Churn, Follow-Up, Outreach |
| admin-metrics.test.ts | 7 | MRR/ARR/LTV Berechnungen |
| cron-jobs.test.ts | 25 | Alle 4 Cron-Jobs |
| reporting.test.ts | 7 | Report-Generierung |
| public-routes.test.ts | 19 | Anmeldung, Warteliste, Newsletter, Health |
| auth-student.test.ts | 10 | Schueler-Registrierung + Invite-Codes |
| blog-routes.test.ts | 14 | Blog CRUD + Cron |
| ai-routes.test.ts | 11 | Chatbot + Tutor (Anthropic Mock) |
| email-routes.test.ts | 9 | E-Mail Send + Report |
| export-routes.test.ts | 10 | CSV + PDF Export |
| payments-checkout-portal.test.ts | 11 | Stripe Checkout + Portal |
| payments-webhook.test.ts | 6 | Stripe Webhook (Signatur, Idempotenz) |
| misc-routes.test.ts | 34 | switch-tenant, testimonials, social, gmb, onboarding, retell, progress |
| webhook-events.test.ts | 21 | Webhook-Events + DSGVO-Archivierung |
| stornierung.test.ts | 17 | 24h-Regel, Gebuehr, Zeitberechnung |
| anmeldung-validation.test.ts | 29 | Pflichtfelder, E-Mail, PLZ, DSGVO |

### Security Tests (2 Dateien, 36 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| tenant-isolation.test.ts | 20 | requireAuth, safeCompare, getClientIp, Cross-Tenant |
| webhook-verification.test.ts | 16 | HMAC-SHA256, Tampered Payload, Missing Secret |

### CRM Tests (5 Dateien, 44 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| api-auth.test.ts | 11 | Rate-Limiter (Isolation, Window, Expiry) |
| lead-from-call.test.ts | 13 | splitName, normalizeLicenseClass |
| schema.test.ts | 13 | TypeScript-Interface-Validierung |
| webhook-signature.test.ts | 8 | HMAC-SHA256 Verifikation |
| events.test.ts | 5 | Event-Konstanten, Pricing |

### DB & Schema Tests (2 Dateien, 91 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| store.test.ts | 59 | Alle 8 Store-Namespaces (CRUD, Pagination, Tenant-Isolation) |
| schema-enums.test.ts | 32 | Alle 6 Enums + 8 Interface Required Fields |

### Validierung Tests (3 Dateien, 100 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| validation-complete.test.ts | 71 | Alle 10 Zod-Schemas (Valid/Invalid/Edge-Cases) |
| validation.test.ts | 28 | AnmeldungSchema, ChatbotMessageSchema |
| env.test.ts | 1 | Environment-Validierung |

### Lib/Utility Tests (4 Dateien, 122 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| utilities.test.ts | 68 | phone-utils, telefon/templates, tenant, lead-from-call, onboarding, theorie-progress-sync |
| email-templates.test.ts | 24 | outreachEmail, followUpEmail, monthlyReportEmail, anomalyAlertEmail, roiSummaryEmail |
| monitoring.test.ts | 16 | captureError, trackMetric, trackEvent, getHealthStatus |
| api-errors.test.ts | 15 | apiError (alle 7 Codes), serverError |

### Events Tests (1 Datei, 12 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| emit.test.ts | 12 | Event-Typen, HMAC-Signierung, Fire-and-Forget, Missing URL/Secret |

### Analytics Tests (3 Dateien, 35 Tests)

| Datei | Tests | Bereich |
|-------|-------|---------|
| anomalies.test.ts | 14 | Anomalie-Erkennung, getISOWeek |
| churn-scoring.test.ts | 8 | Churn-Score, Aktions-Empfehlung |
| export-helpers.test.ts | 13 | Status-Labels, Datum-Formatierung |

## 11.3 Vitest-Konfiguration (vitest.config.ts)

```typescript
globals: true
environment: "node"
alias: "@" => "./src"
```

---

# 12. AI / ML

## 12.1 AI-Chatbot (/api/chatbot)

| Eigenschaft | Wert |
|-------------|------|
| Modell | Claude Haiku 4.5 (claude-haiku-4-5-20251001) |
| Max Tokens | 400 |
| Sprachen | Deutsch, Tuerkisch, Arabisch, Russisch, Englisch |
| Rate-Limit | 50 Anfragen/Minute pro IP |
| Input-Limit | 1.000 Zeichen |
| Chat-History | Max 20 Nachrichten (je max 2.000 Zeichen) |
| Fallback | Smart Regex-Matching (7 Kategorien) |
| Monitoring | captureError -> Sentry |

## 12.2 AI-Theorie-Tutor (/api/tutor)

| Eigenschaft | Wert |
|-------------|------|
| Modell | Claude Haiku 4.5 |
| Max Tokens | 300 |
| Streaming | SSE (Server-Sent Events) |
| Rate-Limit | 100/min + 20/Tag pro IP |
| Body-Limit | 10 KB |
| StVO-Injection | Automatische Paragraph-Suche + Formatierung |
| Token-Tracking | Input/Output Kosten pro Anfrage geloggt |
| Timeout | 15 Sekunden auf Anthropic-API |

## 12.3 Theorie-Trainer (TheorieApp — 1.844 Zeilen)

| Eigenschaft | Wert |
|-------------|------|
| Fragen | 2.309 (8 Kategorien) |
| Level-System | 10 Stufen (Anfaenger -> Pruefungsreif) |
| XP-Berechnung | Easy +5, Medium +10, Hard +15, Streak-Bonus bis +20 |
| Spaced Repetition | Smart-Modus: 50% falsche, 30% unbeantwortete, 20% alte richtige |
| Pruefungsmodus | 30 Fragen, 30 Min Timer, max 10 Fehlerpunkte |
| Badges | Gold (>=95%), Silber (>=85%), Bronze (>=70%) pro Kategorie |
| Offline | LocalStorage + Server-Sync (3s debounced, sendBeacon) |
| Gamification | Streaks, Daily Goals, Level-Up Toast |
| Progress-Sync | mergeProgress() — additives Mergen (nie Datenverlust) |

## 12.4 Social Media Generierung (/api/social, src/lib/social.ts)

| Plattform | Max Zeichen | Besonderheiten |
|-----------|-------------|----------------|
| Instagram | 2.200 | Emojis, 5-10 Hashtags |
| Facebook | 500 | URL, 2-3 Hashtags |
| LinkedIn | 300-600 | Professioneller Ton, 3-5 Hashtags |
| Google My Business | 300 | CTA |

- Modell: Claude Haiku 4.5
- Fallback: Statische Templates ohne API-Key

## 12.5 Blog-Auto-Generierung (/api/blog/cron)

- Schedule: Montag 09:00 UTC
- Modell: Claude Haiku 4.5
- Topic-Pool: 13 fahrschulrelevante Themen
- Dedup: Verhindert Regenerierung existierender Artikel
- Auto-Social: Generiert Social-Media-Posts pro Artikel

## 12.6 Outreach-Generierung (/api/sales/outreach)

- Personalisierte Kalt-Akquise E-Mails via Claude
- Input: Fahrschulname, Stadt, Inhaber, Schueleranzahl
- Output: Anrede, Nachricht, Betreff

## 12.7 Anomalie-Erkennung (src/lib/analytics/anomalies.ts)

| Signal | Typ |
|--------|-----|
| No-Show-Rate Spike (>20% ueber 5-Wochen-Durchschnitt) | danger |
| Ueberfaellige Zahlungen (>500 EUR bei >1 Rechnung) | warning |
| Pruefungsbereite Schueler | info |
| Inaktive Schueler | warning |

## 12.8 Churn-Scoring (0-100)

| Signal | Punkte |
|--------|--------|
| Keine aktiven Schueler | +40 |
| 1-2 aktive Schueler | +20 |
| Keine Neuanmeldungen (30 Tage) | +25 |
| Keine Fahrstunden (14 Tage) | +25 |
| Keine Schueler angelegt | +10 |

| Score | Aktion |
|-------|--------|
| >= 60 | "Sofort anrufen" |
| 30-59 | "E-Mail senden" |
| < 30 | "Beobachten" |

Upselling: Starter mit 20+ Schuelern -> Pro, Pro mit 30+ -> Premium

## 12.9 Retell.ai / Telefon-Assistent

### Agent-Konfiguration (retell-config/)

| Datei | Inhalt |
|-------|--------|
| agent-prompt.md | 335 Zeilen System-Prompt (Persoenlichkeit, FAQ, DSGVO, Transfer) |
| agent-config.json | Importierbare Konfiguration (de-DE, ElevenLabs, 5 Min Max, 15s Timeout) |
| webhook-test-payloads.json | Test-Payloads (call_started, call_ended, call_analyzed) |

### Call Analysis Custom Fields
- intent: anmeldung, termin, preisanfrage, information, beschwerde, umschreibung, auffrischung, sonstiges
- name, phone, email, license_class, preferred_time, urgency
- has_sehtest, has_erste_hilfe, recording_consent

### Kosten pro Kunde
- Retell.ai: ~0,30-0,65 EUR/Anruf (LLM + Voice)
- Telefonnummer: 2 EUR/Monat
- n8n: 0 EUR (self-hosted)
- WhatsApp Follow-Up: ~0,05 EUR/Nachricht
- **Gesamt bei 10 Anrufen/Tag: ~100-200 EUR/Monat**

---

# 13. MONITORING / OBSERVABILITY

## 13.1 Sentry

| Konfiguration | Datei | Details |
|--------------|-------|---------|
| Client | sentry.client.config.ts | DSN: NEXT_PUBLIC_SENTRY_DSN, Traces: 10%, Error-Replays: 100% |
| Server | sentry.server.config.ts | DSN: SENTRY_DSN, Traces: 10% |
| Edge | sentry.edge.config.ts | DSN: SENTRY_DSN, Traces: 10% |

Nur in Production aktiviert (NODE_ENV === "production")

## 13.2 Monitoring-Funktionen (src/lib/monitoring.ts — 102 Zeilen)

| Funktion | Zweck |
|----------|-------|
| captureError(error, context) | Sentry captureException + console.error mit Timestamp |
| trackMetric(name, value, tags) | Sentry Metrics Distribution |
| trackEvent(name, data) | Sentry captureMessage (level: info) |
| getHealthStatus() | Health-Check Aggregation |

### Health-Endpoint (/api/health)

| Check | Was wird geprueft |
|-------|-----------------|
| api | Immer true (Endpoint erreichbar) |
| env_supabase | SUPABASE_URL + ANON_KEY gesetzt |
| anthropic | ANTHROPIC_API_KEY gesetzt |
| database | SELECT auf tenants Tabelle (Supabase-Ping) |

Status-Codes: 200 (ok), 503 (degraded), 500 (down)

## 13.3 Error-Boundaries

| Datei | Scope | Monitoring |
|-------|-------|-----------|
| src/app/error.tsx | Seiten-Level | Sentry captureException |
| src/app/global-error.tsx | App-Level | Sentry captureException |
| src/app/dashboard/error.tsx | Dashboard | Console-only |

## 13.4 API-Route Monitoring (captureError)

Alle serverError()-Routes automatisch via api-errors.ts + explizit auf:
- /api/chatbot, /api/tutor
- /api/cron/mahnwesen (per-Tenant + outer)
- /api/cron/anomaly-check (per-Tenant)
- /api/cron/dsgvo-cleanup
- /api/payments/webhook

## 13.5 Uptime Kuma (Raspberry Pi)
- URL: http://YOUR_PI_IP:3001
- Monitoring: Website, n8n, WhatsApp-Service, API-Health

---

# 14. E-MAIL SYSTEM

## 14.1 Resend-Integration (src/lib/email/resend.ts)

| Eigenschaft | Wert |
|-------------|------|
| Provider | Resend (resend.com) |
| FROM_EMAIL | noreply@fahrschulautopilot.de (konfigurierbar via RESEND_FROM_EMAIL) |
| Funktion | sendEmail(to, subject, html, replyTo?) |
| Return | {success, id?, error?} |

## 14.2 E-Mail Templates (src/lib/email/templates.ts)

| Template | Zweck | Variablen |
|----------|-------|-----------|
| outreachEmail | Kalt-Akquise | anrede, nachricht |
| followUpEmail | Follow-Up Sequenzen | anrede, nachricht, stufe (1-3, CTA ab Stufe 3 entfernt) |
| monthlyReportEmail | Monatlicher KPI-Bericht | fahrschulName, monat, aktiveSchueler, umsatz, noShowRate, bestehensquote |
| anomalyAlertEmail | Anomalie-Warnung | fahrschulName, anomalies[], dashboardUrl |
| roiSummaryEmail | ROI-Zusammenfassung | fahrschulName, gesamtErsparnis, roi%, Kategorien |
| kpiBox | Helper | label, value, color |

---

# 15. TELEFON-UTILITIES

## 15.1 Phone-Utils (src/lib/telefon/phone-utils.ts)

| Funktion | Zweck |
|----------|-------|
| normalizeGermanPhone(raw) | +49/0049/0xxx -> nationale Form (0xxx) |
| phonesMatch(a, b) | Fuzzy-Vergleich (letzte 9+ Ziffern) |
| phoneSearchSuffix(raw) | Letzte 9 Ziffern fuer ILIKE-Queries |

## 15.2 Templates (src/lib/telefon/templates.ts)

- FOLLOW_UP_TEMPLATES Array mit WhatsApp/E-Mail/SMS Templates
- Pro Template: id, name, intent, kanal, betreff, nachricht, tags
- getTemplate(id), renderTemplate(template, vars), getOwnerNotificationTemplate()

---

# 16. MULTI-TENANT SYSTEM (src/lib/tenant.ts — 328 Zeilen)

## 16.1 TenantConfig Interface

| Feld-Gruppe | Felder |
|-------------|--------|
| Identifikation | id, slug, customDomain |
| Firma | fahrschulName, inhaber, stadt, adresse, telefon, email, website |
| Oeffnungszeiten | oeffnungszeiten (Wochentag -> String) |
| Klassen | fuehrerscheinklassen (string[]) |
| Preise | grundgebuehr, fahrstunde, sonderfahrt, pruefungTh, pruefungPr |
| Branding | primaryColor, primaryColorLight, primaryColorDark, accentColor, logoUrl, faviconUrl |
| Features | Record<string, boolean> (Plan-basiert) |
| Integrationen | webhookAnmeldungUrl, webhookRetellUrl, retellAgentId, googleAnalyticsId, whatsappNumber, calendlyUrl |
| SEO | title, description, keywords |
| Status | isActive, isDemo, createdAt |

## 16.2 Funktionen

| Funktion | Zweck |
|----------|-------|
| createTenantConfig(partial) | TenantConfig mit Defaults erstellen |
| getTenantBySlug(slug) | Lookup nach URL-Slug |
| getTenantByDomain(domain) | Lookup nach Custom Domain |
| getAllTenants() | Alle aktiven Tenants |
| registerTenant(config) | Im lokalen Cache registrieren |
| getTenantCssVars(tenant) | CSS Custom Properties Dictionary |
| getDemoTenantForPlan(plan) | Demo-Tenant fuer Starter/Pro/Premium |

---

# 17. ONBOARDING (src/lib/onboarding.ts — 216 Zeilen)

## 7-Schritte Onboarding-Prozess

| Schritt | Beschreibung | Plan |
|---------|-------------|------|
| 1 | Tenant-Config erstellen | Alle |
| 2 | Features konfigurieren (Plan-basiert) | Alle |
| 3 | Webhooks einrichten | Alle |
| 4 | WhatsApp-Integration | Pro+ |
| 5 | Retell.ai Agent | Premium |
| 6 | Custom Domain | Wenn vorhanden |
| 7 | Google Analytics | Premium |

## Helper-Funktionen
- generateQAChecklist(tenant) — Plan-basierte QA-Testliste
- generateSlug(name) — URL-sicherer Slug
- generateId() — Eindeutige Tenant-ID
- adjustColor(hex, amount) — Farbe heller/dunkler

---

# 18. THEORIE-PROGRESS-SYNC (src/lib/theorie-progress-sync.ts — 157 Zeilen)

## FullProgress Interface

```typescript
{
  questions: Record<string, {
    correct: number, wrong: number, lastAnswered: number,
    lastCorrect: boolean, bookmarked: boolean
  }>
  xp: number, bestStreak: number, totalCorrect: number, totalWrong: number,
  dailyGoal: number, dailyDone: number, dailyDate: string,
  examsPassed: number, examsFailed: number
}
```

## Sync-Funktionen

| Funktion | Zweck |
|----------|-------|
| mergeProgress(local, remote) | Additives Mergen (max-Werte, OR-Bookmarks, nie Datenverlust) |
| loadAndMergeProgress(default) | Server + localStorage mergen |
| scheduleSyncToServer(progress) | Debounced POST (3s Delay) |
| flushSyncToServer(progress) | Sofort-Sync bei Page Unload (sendBeacon) |

LocalStorage Key: "theorie-progress-v2"

---

# 19. ENVIRONMENT VARIABLES

## Erforderlich

| Variable | Zweck |
|----------|-------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Projekt-URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon Key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Service-Role Key |
| ANTHROPIC_API_KEY | Claude API Key |
| RESEND_API_KEY | E-Mail-Versand |
| ADMIN_API_KEY | Admin-Endpunkte |
| CRON_SECRET | Cron-Job-Schutz |
| ONBOARDING_API_KEY | Onboarding-Endpunkt |

## Webhooks

| Variable | Ziel |
|----------|------|
| WEBHOOK_ANMELDUNG_URL | n8n: /webhook/neue-anmeldung |
| WEBHOOK_RETELL_URL | n8n: /webhook/telefon-anruf |
| N8N_EVENTS_WEBHOOK_URL | n8n: /webhook/crm-events |
| WEBHOOK_SECRET | HMAC-Signierung fuer ausgehende Events |

## Payments (Stripe)

| Variable | Zweck |
|----------|-------|
| STRIPE_SECRET_KEY | Server-seitig |
| STRIPE_WEBHOOK_SECRET | Webhook-Signatur |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Client-seitig |

## Monitoring (Sentry)

| Variable | Zweck |
|----------|-------|
| NEXT_PUBLIC_SENTRY_DSN | Client-DSN |
| SENTRY_DSN | Server-DSN |
| SENTRY_AUTH_TOKEN | Source Maps Upload |
| SENTRY_ORG | Organisation |
| SENTRY_PROJECT | Projekt |

## Optional

| Variable | Zweck |
|----------|-------|
| RETELL_API_KEY | Telefon-Assistent |
| RETELL_WEBHOOK_SECRET | Retell Webhook-Verifikation |
| GOOGLE_ANALYTICS_ID | Google Analytics |
| RESEND_FROM_EMAIL | Custom Absender-Adresse |
| NEXT_PUBLIC_APP_URL | App-URL fuer E-Mail-Links |

---

# 20. DATEISYSTEM

```
~/Desktop/Autopilot_F/
├── fahrschule-autopilot-website/           # Next.js SaaS-Plattform
│   ├── src/
│   │   ├── app/                            # 37 Seiten + 72 API Routes
│   │   │   ├── api/                        # Alle API-Endpunkte
│   │   │   │   ├── admin/metrics/
│   │   │   │   ├── analytics/{,conversion,kpis,marketing,nps,roi,sales-funnel,telefon,theorie}/
│   │   │   │   ├── anmeldung/
│   │   │   │   ├── auth/student/
│   │   │   │   ├── blog/{,cron,update}/
│   │   │   │   ├── chatbot/
│   │   │   │   ├── crm/{schueler,fahrlehrer,fahrstunden,fahrzeuge,pruefungen,dokumente,
│   │   │   │   │       zahlungen,vertrag,kommunikation,stats,rechnungen,mahnwesen,
│   │   │   │   │       stornierung,dsgvo,pruefungsreife,pruefungserinnerungen,
│   │   │   │   │       calendar-sync,ausbildungsnachweis,lead-from-call,
│   │   │   │   │       export/datev,export/lexoffice,dokumente/upload,dokumente/download}/
│   │   │   │   ├── cron/{monthly-report,mahnwesen,dsgvo-cleanup,anomaly-check}/
│   │   │   │   ├── dsgvo/anrufe-archivieren/
│   │   │   │   ├── email/{send,report}/
│   │   │   │   ├── export/{,pdf}/
│   │   │   │   ├── gmb/
│   │   │   │   ├── health/
│   │   │   │   ├── newsletter/{,generate}/
│   │   │   │   ├── onboarding/
│   │   │   │   ├── payments/{checkout,webhook,portal}/
│   │   │   │   ├── progress/theorie/
│   │   │   │   ├── reporting/
│   │   │   │   ├── retell/{,agents}/
│   │   │   │   ├── sales/{leads,churn,follow-up,outreach}/
│   │   │   │   ├── schueler/meine-daten/
│   │   │   │   ├── social/
│   │   │   │   ├── switch-tenant/
│   │   │   │   ├── testimonials/
│   │   │   │   ├── tutor/
│   │   │   │   ├── warteliste/
│   │   │   │   └── webhooks/events/
│   │   │   ├── dashboard/{,schueler,schueler/[id],kalender,pruefungen,
│   │   │   │              zahlungen,dokumente,fahrzeuge,vertraege,telefon,
│   │   │   │              theorie,analytics,reporting,roi}/
│   │   │   ├── schueler/{login,dashboard,vertrag}/
│   │   │   ├── admin/{,test}/
│   │   │   ├── stadt/[city]/
│   │   │   ├── demo/[plan]/
│   │   │   ├── lp/{google,social}/
│   │   │   ├── blog/{,[slug]}/
│   │   │   ├── layout.tsx, globals.css, error.tsx, global-error.tsx,
│   │   │   │   loading.tsx, not-found.tsx, sitemap.ts, robots.ts
│   │   │   └── (weitere Seiten: preise, faq, fallstudien, team, gruender,
│   │   │        anmeldung, warteliste, login, theorie, datenschutz, impressum)
│   │   ├── components/                     # 48 React-Komponenten
│   │   │   ├── anmeldung/ (5 Dateien)
│   │   │   ├── dashboard/ (7 Dateien)
│   │   │   ├── theorie/ (3 Dateien)
│   │   │   ├── demo/ (8 Dateien)
│   │   │   ├── blog/ (1 Datei)
│   │   │   ├── admin/ (1 Datei)
│   │   │   └── (23 Root-Komponenten)
│   │   ├── lib/                            # Business Logic (30 Dateien)
│   │   │   ├── api-auth.ts (219Z)
│   │   │   ├── api-errors.ts (42Z)
│   │   │   ├── validation.ts (184Z)
│   │   │   ├── monitoring.ts (102Z)
│   │   │   ├── tenant.ts (328Z)
│   │   │   ├── onboarding.ts (216Z)
│   │   │   ├── theorie-progress-sync.ts (157Z)
│   │   │   ├── blog.ts (102Z)
│   │   │   ├── social.ts (82Z)
│   │   │   ├── env.ts (68Z)
│   │   │   ├── logger.ts (64Z)
│   │   │   ├── blog-types.ts (45Z)
│   │   │   ├── get-active-tenant.ts (36Z)
│   │   │   ├── db/schema.ts, store.ts
│   │   │   ├── supabase/server.ts, client.ts, middleware.ts, auth-helpers.ts, realtime.ts
│   │   │   ├── events/emit.ts
│   │   │   ├── email/resend.ts, templates.ts
│   │   │   ├── telefon/phone-utils.ts, templates.ts
│   │   │   ├── crm/lead-from-call.ts
│   │   │   └── analytics/anomalies.ts, export-helpers.ts, pdf-generator.ts, theorie-tracker.ts
│   │   ├── data/                           # Statische Daten
│   │   │   ├── questions/ (2.309 Fragen, 8 JSON, ~2MB)
│   │   │   ├── stvo/ (StVO-Paragraphen)
│   │   │   ├── cities.ts, faqs.ts, case-studies.ts, demos.ts
│   │   │   ├── blog-posts.json, testimonials.json
│   │   │   └── questions/index.ts
│   │   └── __tests__/                      # 52 Test-Dateien, 932 Tests
│   │       ├── api/ (29 Dateien)
│   │       ├── crm/ (5 Dateien)
│   │       ├── analytics/ (3 Dateien)
│   │       ├── security/ (2 Dateien)
│   │       ├── db/ (2 Dateien)
│   │       ├── lib/ (4 Dateien)
│   │       ├── events/ (1 Datei)
│   │       └── (3 Root-Dateien)
│   ├── supabase/migrations/               # 13 DB-Migrations
│   ├── retell-config/                      # Telefon-Agent Konfiguration
│   ├── .github/workflows/ci.yml           # CI/CD Pipeline
│   ├── sentry.{client,server,edge}.config.ts
│   ├── next.config.ts, vercel.json, vitest.config.ts
│   ├── middleware.ts
│   └── package.json
├── n8n-workflows/                          # 38 Workflow JSONs
│   ├── production/ (12 Dateien)
│   ├── supabase/ (12 Dateien)
│   └── (Docs + Scripts)
├── whatsapp-service/                       # Docker WhatsApp Bridge
│   ├── Dockerfile (Node 20-slim + Chromium)
│   ├── index.js (Express + whatsapp-web.js)
│   └── package.json
├── docker-compose.yml                      # Pi Docker-Stack
├── sync-to-pi.sh                          # Taeglicher Pi-Backup (03:00)
├── sync-to-github.sh                      # Taeglicher GitHub-Backup (03:30)
├── AV_VERTRAG_TEMPLATE.docx               # DSGVO AV-Vertrag
└── FAHRSCHULE_AUTOPILOT_MASTER_DOKUMENTATION.md  # Dieses Dokument
```

---

# 21. CODEBASE-STATISTIKEN

| Metrik | Wert |
|--------|------|
| TypeScript/TSX Zeilen | ~40.000+ |
| Seiten (page.tsx) | 37 |
| Layouts (layout.tsx) | 6 |
| API-Routes (route.ts) | 72 |
| React-Komponenten | 48 |
| Lib-Dateien | 30 |
| Unit-Tests | 932 (alle bestanden, 52 Dateien) |
| n8n Workflows | 38 (13 Production, 12 Supabase, 13 Misc) |
| Supabase Tabellen | 32 |
| RLS Policies | 47 |
| DB Indexes | 62 |
| DB Functions | 8 |
| DB Triggers | 5 |
| Supabase Migrations | 13 |
| Zod-Schemas | 11 |
| E-Mail Templates | 5 |
| Theorie-Fragen | 2.309 |
| CSS-Variablen | 24 (12 Dark + 12 Light) |
| Security Headers | 7 |
| Cron-Jobs | 5 |
| CI/CD Jobs | 4 |

---

# 22. QUALITAETSBEWERTUNG

## Stand: 1. April 2026

| Check | Ergebnis |
|-------|----------|
| TypeScript | 0 Fehler |
| ESLint | 0 Fehler |
| Tests | 932/932 bestanden |
| Build | Erfolgreich |

| # | Bereich | Note |
|---|---------|------|
| 1 | Frontend | **7.5** |
| 2 | Backend / API Layer | **8.5** |
| 3 | UI/UX | **7.5** |
| 4 | Datenbank / Data Layer | **8.0** |
| 5 | Middleware / Integration | **8.0** |
| 6 | API Layer (Konsistenz) | **8.5** |
| 7 | Infrastruktur / DevOps | **5.5** |
| 8 | Sicherheit / Security | **7.5** |
| 9 | Testing / QA | **8.5** |
| 10 | AI / ML | **8.0** |
| 11 | Monitoring / Observability | **6.5** |
| | **GESAMT** | **7.8 / 10.0** |

---

*Erstellt am 01.04.2026 — Fahrschule Autopilot / Andrew Arbo*
*932 Tests, 52 Test-Dateien, 72 API-Routes, 32 DB-Tabellen, 48 Komponenten*
