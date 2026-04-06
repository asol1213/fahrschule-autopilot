/**
 * Setup 2 additional demo tenants: Starter + Pro
 * Run: node scripts/setup-demo-tenants.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://YOUR-PROJECT.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "your_supabase_service_role_key";

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function createOrGetUser(email, password, name) {
  // Try to create
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    }),
  });
  const data = await res.json();

  if (data.id) {
    console.log(`  Created user: ${email} -> ${data.id}`);
    return data.id;
  }

  // User exists, find them
  console.log(`  User ${email} exists, fetching...`);
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=100`, {
    headers,
  });
  const listData = await listRes.json();
  const user = listData.users?.find((u) => u.email === email);
  if (user) {
    console.log(`  Found user: ${email} -> ${user.id}`);
    return user.id;
  }
  throw new Error(`Could not create or find user: ${email}`);
}

async function supabasePost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (res.status >= 400) {
    // Check for conflict (already exists)
    if (res.status === 409 || result?.code === "23505") {
      return null; // duplicate, skip
    }
    console.error(`  Error inserting into ${table}:`, result);
    return null;
  }
  return Array.isArray(result) ? result[0] : result;
}

async function supabaseSelect(table, filters) {
  const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join("&");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  const data = await res.json();
  return data?.[0] || null;
}

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

async function setupTenant(slug, name, plan, userId, schülerData, fahrstundenData, zahlungenData, prüfungenData) {
  console.log(`\n=== ${name} (${plan}) ===`);

  // Check if tenant exists
  let tenant = await supabaseSelect("tenants", { slug });
  if (!tenant) {
    tenant = await supabasePost("tenants", { slug, name, plan, owner_user_id: userId });
    console.log(`  Tenant created: ${tenant?.id}`);
  } else {
    console.log(`  Tenant exists: ${tenant.id}`);
  }
  const tenantId = tenant.id;

  // Tenant user
  await supabasePost("tenant_users", { tenant_id: tenantId, user_id: userId, role: "inhaber" });
  console.log("  Tenant user linked");

  // Fahrlehrer
  const fahrlehrer = [];
  for (const fl of schülerData.fahrlehrer) {
    const result = await supabasePost("fahrlehrer", { tenant_id: tenantId, ...fl });
    if (result) fahrlehrer.push(result);
  }
  console.log(`  ${fahrlehrer.length} Fahrlehrer erstellt`);

  // Schüler
  const schueler = [];
  for (const s of schülerData.schueler) {
    const flIdx = s.fahrlehrerId;
    const data = { ...s, tenant_id: tenantId };
    delete data.fahrlehrerId;
    if (flIdx !== undefined && fahrlehrer[flIdx]) {
      data.fahrlehrer_id = fahrlehrer[flIdx].id;
    }
    const result = await supabasePost("schueler", data);
    if (result) schueler.push(result);
  }
  console.log(`  ${schueler.length} Schüler erstellt`);

  // Fahrstunden
  let fsCount = 0;
  for (const fs of fahrstundenData) {
    const data = {
      tenant_id: tenantId,
      schueler_id: schueler[fs.schuelerIdx]?.id,
      datum: today(fs.daysOffset),
      uhrzeit: fs.uhrzeit,
      dauer: fs.dauer,
      typ: fs.typ,
      status: fs.status,
      bewertung: fs.bewertung || null,
    };
    if (fs.fahrlehrerIdx !== undefined && fahrlehrer[fs.fahrlehrerIdx]) {
      data.fahrlehrer_id = fahrlehrer[fs.fahrlehrerIdx].id;
    }
    if (data.schueler_id) {
      await supabasePost("fahrstunden", data);
      fsCount++;
    }
  }
  console.log(`  ${fsCount} Fahrstunden erstellt`);

  // Zahlungen
  let zCount = 0;
  for (const z of zahlungenData) {
    const data = {
      tenant_id: tenantId,
      schueler_id: schueler[z.schuelerIdx]?.id,
      betrag: z.betrag,
      beschreibung: z.beschreibung,
      status: z.status,
      faellig_am: today(z.faelligOffset),
      bezahlt_am: z.bezahltOffset !== null ? today(z.bezahltOffset) : null,
      mahnungs_stufe: z.mahnungsStufe || 0,
    };
    if (data.schueler_id) {
      await supabasePost("zahlungen", data);
      zCount++;
    }
  }
  console.log(`  ${zCount} Zahlungen erstellt`);

  // Prüfungen
  let pCount = 0;
  for (const p of prüfungenData) {
    const data = {
      tenant_id: tenantId,
      schueler_id: schueler[p.schuelerIdx]?.id,
      typ: p.typ,
      datum: today(p.daysOffset),
      ergebnis: p.ergebnis,
      fehlerpunkte: p.fehlerpunkte || null,
    };
    if (data.schueler_id) {
      await supabasePost("pruefungen", data);
      pCount++;
    }
  }
  console.log(`  ${pCount} Prüfungen erstellt`);
}

async function main() {
  console.log("=== Demo Tenants Setup ===\n");

  // 1. Create auth users
  console.log("Creating auth users...");
  const starterUserId = await createOrGetUser("demo-starter@fahrschule.de", "DemoStarter2026!", "Thomas Müller");
  const proUserId = await createOrGetUser("demo-pro@fahrschule.de", "DemoPro2026!", "Michael Schmidt");

  // 2. Setup Starter tenant
  await setupTenant("fahrschule-mueller", "Fahrschule Müller", "starter", starterUserId,
    {
      fahrlehrer: [
        { vorname: "Thomas", nachname: "Müller", telefon: "+49 911 123 4567", email: "thomas@fahrschule-mueller.de", fuehrerscheinklassen: ["B", "BE"] },
        { vorname: "Petra", nachname: "Lang", telefon: "+49 911 123 4568", email: "petra@fahrschule-mueller.de", fuehrerscheinklassen: ["B", "B96"] },
      ],
      schueler: [
        { vorname: "Jan", nachname: "Hoffmann", email: "jan@starter.de", telefon: "+49 176 1111 1111", geburtsdatum: "2005-02-14", fuehrerscheinklasse: "B", status: "praxis", fahrlehrerId: 0, ort: "Nürnberg", plz: "90402", adresse: "Hauptstr. 5", dsgvo_einwilligung: true },
        { vorname: "Laura", nachname: "Krause", email: "laura@starter.de", telefon: "+49 176 2222 2222", geburtsdatum: "2004-11-08", fuehrerscheinklasse: "B", status: "theorie", fahrlehrerId: 1, ort: "Nürnberg", plz: "90403", dsgvo_einwilligung: true },
        { vorname: "Felix", nachname: "Neumann", email: "felix@starter.de", telefon: "+49 176 3333 3333", geburtsdatum: "2005-06-20", fuehrerscheinklasse: "B", status: "pruefung", fahrlehrerId: 0, ort: "Fürth", plz: "90762", dsgvo_einwilligung: true },
        { vorname: "Sarah", nachname: "Wolf", email: "sarah@starter.de", telefon: "+49 176 4444 4444", geburtsdatum: "2006-03-12", fuehrerscheinklasse: "B", status: "angemeldet", ort: "Nürnberg", plz: "90408", dsgvo_einwilligung: true },
        { vorname: "Moritz", nachname: "Schulz", email: "moritz@starter.de", telefon: "+49 176 5555 5555", geburtsdatum: "2004-09-03", fuehrerscheinklasse: "B", status: "bestanden", fahrlehrerId: 1, ort: "Nürnberg", plz: "90419", dsgvo_einwilligung: true, ausbildung_beendet_am: "2026-02-28" },
      ],
    },
    // Fahrstunden: schuelerIdx, fahrlehrerIdx, daysOffset, uhrzeit, dauer, typ, status, bewertung
    [
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -21, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 3 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -14, uhrzeit: "10:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 4 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -7, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 4 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -3, uhrzeit: "16:00", dauer: 45, typ: "sonderfahrt_autobahnfahrt", status: "abgeschlossen", bewertung: 5 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: 2, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "geplant" },
      { schuelerIdx: 2, fahrlehrerIdx: 0, daysOffset: -10, uhrzeit: "08:00", dauer: 90, typ: "pruefungsvorbereitung", status: "abgeschlossen", bewertung: 3 },
      { schuelerIdx: 2, fahrlehrerIdx: 0, daysOffset: -5, uhrzeit: "10:00", dauer: 90, typ: "pruefungsvorbereitung", status: "no_show" },
      { schuelerIdx: 4, fahrlehrerIdx: 1, daysOffset: -30, uhrzeit: "15:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 5 },
    ],
    // Zahlungen: schuelerIdx, betrag, beschreibung, status, faelligOffset, bezahltOffset, mahnungsStufe
    [
      { schuelerIdx: 0, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -60, bezahltOffset: -58 },
      { schuelerIdx: 0, betrag: 195, beschreibung: "Fahrstunden (3x65)", status: "bezahlt", faelligOffset: -14, bezahltOffset: -10 },
      { schuelerIdx: 0, betrag: 130, beschreibung: "Fahrstunden (2x65)", status: "offen", faelligOffset: 7, bezahltOffset: null },
      { schuelerIdx: 1, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -20, bezahltOffset: -18 },
      { schuelerIdx: 2, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -90, bezahltOffset: -85 },
      { schuelerIdx: 2, betrag: 195, beschreibung: "Fahrstunden (3x65)", status: "ueberfaellig", faelligOffset: -15, bezahltOffset: null, mahnungsStufe: 1 },
      { schuelerIdx: 4, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -120, bezahltOffset: -115 },
    ],
    // Prüfungen: schuelerIdx, typ, daysOffset, ergebnis, fehlerpunkte
    [
      { schuelerIdx: 4, typ: "theorie", daysOffset: -60, ergebnis: "bestanden", fehlerpunkte: 5 },
      { schuelerIdx: 4, typ: "praxis", daysOffset: -30, ergebnis: "bestanden" },
      { schuelerIdx: 2, typ: "theorie", daysOffset: -40, ergebnis: "bestanden", fehlerpunkte: 7 },
      { schuelerIdx: 0, typ: "theorie", daysOffset: -20, ergebnis: "bestanden", fehlerpunkte: 9 },
    ],
  );

  // 3. Setup Pro tenant
  await setupTenant("fahrschule-schmidt", "Fahrschule Schmidt", "pro", proUserId,
    {
      fahrlehrer: [
        { vorname: "Michael", nachname: "Schmidt", telefon: "+49 89 987 6543", email: "michael@fahrschule-schmidt.de", fuehrerscheinklassen: ["B", "BE", "A", "A2"] },
        { vorname: "Sandra", nachname: "Huber", telefon: "+49 89 987 6544", email: "sandra@fahrschule-schmidt.de", fuehrerscheinklassen: ["B", "B96", "BE"] },
      ],
      schueler: [
        { vorname: "David", nachname: "Maier", email: "david@pro.de", telefon: "+49 176 7001 0001", geburtsdatum: "2004-05-10", fuehrerscheinklasse: "B", status: "praxis", fahrlehrerId: 0, ort: "München", plz: "80802", adresse: "Leopoldstr. 20", dsgvo_einwilligung: true, whatsapp_einwilligung: true },
        { vorname: "Lena", nachname: "Berger", email: "lena@pro.de", telefon: "+49 176 7001 0002", geburtsdatum: "2005-01-25", fuehrerscheinklasse: "B", status: "praxis", fahrlehrerId: 1, ort: "München", plz: "80333", adresse: "Schillerstr. 8", dsgvo_einwilligung: true, whatsapp_einwilligung: true },
        { vorname: "Nico", nachname: "Hartmann", email: "nico@pro.de", telefon: "+49 176 7001 0003", geburtsdatum: "2005-08-17", fuehrerscheinklasse: "A2", status: "theorie", fahrlehrerId: 0, ort: "München", plz: "80469", dsgvo_einwilligung: true, whatsapp_einwilligung: true },
        { vorname: "Marie", nachname: "Schwarz", email: "marie@pro.de", telefon: "+49 176 7001 0004", geburtsdatum: "2004-12-03", fuehrerscheinklasse: "B", status: "pruefung", fahrlehrerId: 1, ort: "München", plz: "80634", dsgvo_einwilligung: true, whatsapp_einwilligung: true },
        { vorname: "Paul", nachname: "Richter", email: "paul@pro.de", telefon: "+49 176 7001 0005", geburtsdatum: "2006-02-28", fuehrerscheinklasse: "B", status: "angemeldet", ort: "Freising", plz: "85354", dsgvo_einwilligung: true, whatsapp_einwilligung: true },
        { vorname: "Julia", nachname: "Koch", email: "julia@pro.de", telefon: "+49 176 7001 0006", geburtsdatum: "2005-04-14", fuehrerscheinklasse: "B", status: "dokumente_ausstehend", ort: "München", plz: "80339", dsgvo_einwilligung: true },
        { vorname: "Tom", nachname: "Weber", email: "tom@pro.de", telefon: "+49 176 7001 0007", geburtsdatum: "2004-07-19", fuehrerscheinklasse: "B", status: "bestanden", fahrlehrerId: 0, ort: "München", plz: "80796", dsgvo_einwilligung: true, ausbildung_beendet_am: "2026-01-20" },
      ],
    },
    [
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -28, uhrzeit: "10:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 3 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -21, uhrzeit: "10:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 4 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -14, uhrzeit: "10:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 4 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -7, uhrzeit: "14:00", dauer: 45, typ: "sonderfahrt_ueberlandfahrt", status: "abgeschlossen", bewertung: 5 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: -3, uhrzeit: "16:00", dauer: 45, typ: "sonderfahrt_autobahnfahrt", status: "abgeschlossen", bewertung: 4 },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: 1, uhrzeit: "10:00", dauer: 45, typ: "sonderfahrt_nachtfahrt", status: "geplant" },
      { schuelerIdx: 0, fahrlehrerIdx: 0, daysOffset: 5, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "geplant" },
      { schuelerIdx: 1, fahrlehrerIdx: 1, daysOffset: -21, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 3 },
      { schuelerIdx: 1, fahrlehrerIdx: 1, daysOffset: -14, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 4 },
      { schuelerIdx: 1, fahrlehrerIdx: 1, daysOffset: -7, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "no_show" },
      { schuelerIdx: 1, fahrlehrerIdx: 1, daysOffset: 2, uhrzeit: "14:00", dauer: 90, typ: "normal", status: "geplant" },
      { schuelerIdx: 3, fahrlehrerIdx: 1, daysOffset: -10, uhrzeit: "08:00", dauer: 90, typ: "pruefungsvorbereitung", status: "abgeschlossen", bewertung: 4 },
      { schuelerIdx: 3, fahrlehrerIdx: 1, daysOffset: -5, uhrzeit: "08:00", dauer: 90, typ: "pruefungsvorbereitung", status: "abgeschlossen", bewertung: 5 },
      { schuelerIdx: 6, fahrlehrerIdx: 0, daysOffset: -60, uhrzeit: "10:00", dauer: 90, typ: "normal", status: "abgeschlossen", bewertung: 5 },
      { schuelerIdx: 6, fahrlehrerIdx: 0, daysOffset: -50, uhrzeit: "10:00", dauer: 45, typ: "sonderfahrt_autobahnfahrt", status: "abgeschlossen", bewertung: 5 },
    ],
    [
      { schuelerIdx: 0, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -60, bezahltOffset: -58 },
      { schuelerIdx: 0, betrag: 325, beschreibung: "Fahrstunden (5x65)", status: "bezahlt", faelligOffset: -14, bezahltOffset: -10 },
      { schuelerIdx: 0, betrag: 150, beschreibung: "Sonderfahrten (2x75)", status: "offen", faelligOffset: 7, bezahltOffset: null },
      { schuelerIdx: 1, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -40, bezahltOffset: -38 },
      { schuelerIdx: 1, betrag: 130, beschreibung: "Fahrstunden (2x65)", status: "offen", faelligOffset: 5, bezahltOffset: null },
      { schuelerIdx: 2, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -25, bezahltOffset: -22 },
      { schuelerIdx: 3, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -100, bezahltOffset: -95 },
      { schuelerIdx: 3, betrag: 260, beschreibung: "Fahrstunden (4x65)", status: "ueberfaellig", faelligOffset: -20, bezahltOffset: null, mahnungsStufe: 2 },
      { schuelerIdx: 4, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "offen", faelligOffset: 14, bezahltOffset: null },
      { schuelerIdx: 6, betrag: 350, beschreibung: "Grundgebühr Klasse B", status: "bezahlt", faelligOffset: -120, bezahltOffset: -118 },
      { schuelerIdx: 6, betrag: 205, beschreibung: "Fahrstunden + Sonderfahrten", status: "bezahlt", faelligOffset: -50, bezahltOffset: -45 },
    ],
    [
      { schuelerIdx: 6, typ: "theorie", daysOffset: -80, ergebnis: "bestanden", fehlerpunkte: 3 },
      { schuelerIdx: 6, typ: "praxis", daysOffset: -40, ergebnis: "bestanden" },
      { schuelerIdx: 3, typ: "theorie", daysOffset: -50, ergebnis: "bestanden", fehlerpunkte: 6 },
      { schuelerIdx: 3, typ: "praxis", daysOffset: -8, ergebnis: "nicht_bestanden" },
      { schuelerIdx: 0, typ: "theorie", daysOffset: -35, ergebnis: "bestanden", fehlerpunkte: 4 },
      { schuelerIdx: 1, typ: "theorie", daysOffset: -25, ergebnis: "nicht_bestanden", fehlerpunkte: 14 },
      { schuelerIdx: 1, typ: "theorie", daysOffset: -10, ergebnis: "bestanden", fehlerpunkte: 8 },
    ],
  );

  console.log("\n=== FERTIG ===");
  console.log("\nDemo Logins:");
  console.log("  Starter (€149): demo-starter@fahrschule.de / DemoStarter2026!");
  console.log("  Pro     (€249): demo-pro@fahrschule.de / DemoPro2026!");
  console.log("  Premium (€349): your-email@example.com / YOUR_PASSWORD");
}

main().catch(console.error);
