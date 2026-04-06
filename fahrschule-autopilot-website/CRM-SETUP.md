# CRM Setup Guide — Fahrschule Autopilot

## Schnell-Setup (10 Minuten)

### 1. Supabase Projekt erstellen
1. Geh auf https://supabase.com → "New Project"
2. Name: `fahrschule-autopilot`
3. Region: **Frankfurt (eu-central-1)**
4. Passwort notieren

### 2. Credentials eintragen
Supabase Dashboard → Settings → API → Kopiere:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Datenbank erstellen
Supabase Dashboard → **SQL Editor** → Neue Query:
1. Paste den Inhalt von `supabase/migrations/001_initial_schema.sql` → **Run**
2. Warte bis "Success" erscheint

### 4. Test-User erstellen
Supabase Dashboard → **Authentication** → **Users** → **Add User**:
- E-Mail: `test@fahrschule.de`
- Passwort: `Autopilot2026!`
- "Auto Confirm User" ✓

**User-ID kopieren** (die UUID in der Users-Tabelle)

### 5. Demo-Daten laden
Supabase → SQL Editor → Neue Query:
1. Paste den Inhalt von `supabase/seed/demo-data.sql`
2. **WICHTIG**: Zeile 12 anpassen — die kopierte User-ID einsetzen:
```sql
INSERT INTO tenant_users (tenant_id, user_id, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DEINE-USER-ID-HIER', 'inhaber');
```
3. **Run**

### 6. Starten
```bash
cd fahrschule-autopilot-website
npm run dev
```

Browser: http://localhost:3000/login
- E-Mail: `test@fahrschule.de`
- Passwort: `Autopilot2026!`

---

## Was du sehen solltest

### Dashboard (`/dashboard`)
- 10 Schüler in verschiedenen Status
- KPI Cards: Aktive Schüler, Offene Zahlungen (€500+), Termine heute, Bestehensquote
- Schüler-Pipeline: Angemeldet → Dokumente → Theorie → Praxis → Prüfung → Bestanden
- Letzte Anmeldungen + Überfällige Zahlungen

### Schüler (`/dashboard/schueler`)
- 10 Schüler mit Status-Badges
- Filter nach Status (Dropdown)
- Suche nach Name
- Klick auf Name → Detail-Seite

### Schüler-Detail (`/dashboard/schueler/[id]`)
- **Leon Müller** (Praxis): Status-Pipeline klickbar, Prüfungsreife-Badge, DSGVO-Einwilligungen
- Tabs: 14 Fahrstunden, Zahlungen (3 bezahlt, 2 offen), 5 Dokumente, 1 Theorie-Prüfung bestanden, 3 Nachrichten

### Kalender (`/dashboard/kalender`)
- Wochenansicht mit farbcodierten Fahrstunden
- Fahrlehrer-Auslastung Widget (Thomas, Sandra, Michael)
- "Neue Fahrstunde" Button mit Modal

### Zahlungen (`/dashboard/zahlungen`)
- Summen-Cards: Offen / Bezahlt / Gesamt
- Filter: Alle, Offen, Überfällig, Bezahlt
- "Bezahlt" Button bei offenen Zahlungen
- Maximilian hat 2 überfällige Zahlungen (Mahnstufe 1+2)

### Dokumente (`/dashboard/dokumente`)
- Mia Hoffmann: 2/5 Dokumente (rot markiert)
- Leon Müller: 5/5 Dokumente (grün, vollständig)
- Checkliste-Toggle zum Markieren

### Prüfungen (`/dashboard/pruefungen`)
- 6 Prüfungen, Bestehensquote ~67%
- Theorie-Quote und Praxis-Quote getrennt
- Buttons: "Bestanden" / "Nicht bestanden" für ausstehende Prüfungen

---

## Test-Szenarien

### Test 1: Neuer Schüler anlegen
1. `/dashboard/schueler` → "Neuer Schüler"
2. Daten ausfüllen → "Anlegen"
3. Schüler erscheint in der Liste ✓

### Test 2: Auto-Rechnung
1. `/dashboard/kalender` → Fahrstunde von Leon klicken
2. Status auf "Abgeschlossen" ändern
3. → `/dashboard/zahlungen` → Neue Rechnung automatisch erstellt ✓

### Test 3: Auto-Status bei Dokumenten
1. `/dashboard/dokumente` → Bei Mia alle fehlenden Dokumente als "vorhanden" markieren
2. → Mias Status springt automatisch von "Dokumente ausstehend" auf "Theorie" ✓

### Test 4: Prüfung bestanden → Status
1. `/dashboard/pruefungen` → Bei Maximilians Praxis-Prüfung "Bestanden" klicken
2. → Maximilians Schüler-Status springt auf "Bestanden" ✓

### Test 5: DSGVO-Löschung
1. `/dashboard/schueler/[hannah-id]` → DSGVO verwalten → "DSGVO-konform löschen"
2. Bestätigen → Hannah und alle Daten gelöscht ✓

### Test 6: Prüfungsreife-Check
1. `/dashboard/schueler/[leon-id]` → Prüfungsreife-Badge
2. Score ~80-90%: Theorie bestanden, Pflichtfahrstunden erfüllt, Dokumente vollständig ✓

---

## API-Endpoints testen (curl)

```bash
# Stats
curl http://localhost:3000/api/crm/stats?tenantId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

# Prüfungsreife
curl http://localhost:3000/api/crm/pruefungsreife?schuelerId=s1000001-0000-0000-0000-000000000001

# DSGVO Export
curl http://localhost:3000/api/crm/dsgvo?schuelerId=s1000001-0000-0000-0000-000000000001

# Umsatz-Report
curl http://localhost:3000/api/crm/rechnungen?tenantId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&zeitraum=monat

# iCal Export (für Google Calendar)
curl http://localhost:3000/api/crm/calendar-sync?tenantId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&format=ical

# Mahnwesen ausführen
curl -X POST http://localhost:3000/api/crm/mahnwesen \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'
```

---

## Vercel Deployment

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployen
vercel

# Environment Variables setzen (Vercel Dashboard → Settings → Environment Variables)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```
