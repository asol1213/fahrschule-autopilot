import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock setup: chainable Supabase query builder
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
    storage: { from: mockStorageFrom },
  })),
}));

import {
  schuelerDb,
  fahrstundenDb,
  zahlungenDb,
  dokumenteDb,
  kommunikationDb,
  pruefungenDb,
  fahrlehrerDb,
  fahrzeugeDb,
} from "@/lib/db/store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fully chainable query mock that records every call. */
function createQueryMock(returnValue: { data?: unknown; error?: unknown; count?: number } = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const builder = new Proxy(chain, {
    get(_target, prop: string | symbol) {
      if (typeof prop === "symbol") return undefined;
      if (prop === "then") return undefined; // not thenable until terminal
      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(builder);
      }
      return chain[prop];
    },
  });

  // Terminal methods that resolve data
  chain.single = vi.fn().mockResolvedValue(returnValue);

  // Make the proxy awaitable when used without .single()
  const awaitableBuilder = new Proxy(chain, {
    get(_target, prop: string | symbol) {
      if (typeof prop === "symbol") return undefined;
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve(returnValue);
      }
      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(awaitableBuilder);
      }
      return chain[prop];
    },
  });

  // Patch non-terminal methods to return the awaitable builder
  for (const method of [
    "select", "insert", "update", "delete", "eq", "is", "in",
    "or", "not", "gte", "lte", "ilike", "order", "limit", "range",
  ]) {
    chain[method] = vi.fn().mockReturnValue(awaitableBuilder);
  }
  chain.single = vi.fn().mockResolvedValue(returnValue);

  return { builder: awaitableBuilder, chain };
}

const TENANT = "tenant-123";
const UUID = "550e8400-e29b-41d4-a716-446655440000";

// Sample DB rows (snake_case, as Supabase returns them)
const schuelerRow = {
  id: UUID,
  tenant_id: TENANT,
  vorname: "Max",
  nachname: "Mustermann",
  email: "max@test.de",
  telefon: "+491234567890",
  geburtsdatum: "2000-01-01",
  adresse: "Teststr. 1",
  plz: "12345",
  ort: "Berlin",
  fuehrerscheinklasse: "B",
  vorbesitz: null,
  status: "angemeldet",
  fahrlehrer_id: null,
  anmeldungs_datum: "2026-01-01",
  notizen: null,
  whatsapp_einwilligung: true,
  email_einwilligung: true,
  dsgvo_einwilligung: true,
  dsgvo_einwilligung_datum: "2026-01-01",
  ausbildung_beendet_am: null,
  loeschung_geplant_am: null,
  deleted_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const fahrstundeRow = {
  id: UUID,
  tenant_id: TENANT,
  schueler_id: "schueler-1",
  fahrlehrer_id: "lehrer-1",
  datum: "2026-03-15",
  uhrzeit: "14:00",
  dauer: 90,
  typ: "normal",
  bewertung: 4,
  notizen: "Gut gefahren",
  status: "geplant",
  deleted_at: null,
  created_at: "2026-03-01T00:00:00Z",
};

const zahlungRow = {
  id: UUID,
  tenant_id: TENANT,
  schueler_id: "schueler-1",
  betrag: 49.99,
  beschreibung: "Fahrstunde",
  status: "offen",
  faellig_am: "2026-04-01",
  bezahlt_am: null,
  mahnungs_stufe: 0,
  deleted_at: null,
  created_at: "2026-03-01T00:00:00Z",
};

const dokumentRow = {
  id: UUID,
  tenant_id: TENANT,
  schueler_id: "schueler-1",
  typ: "sehtest",
  dateiname: "sehtest.pdf",
  upload_datum: "2026-01-15",
  ablauf_datum: "2028-01-15",
  vorhanden: true,
  deleted_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

const kommunikationRow = {
  id: UUID,
  tenant_id: TENANT,
  schueler_id: "schueler-1",
  kanal: "whatsapp",
  richtung: "eingehend",
  betreff: "Termin",
  inhalt: "Kann ich Freitag kommen?",
  datum: "2026-03-20T10:00:00Z",
  deleted_at: null,
};

const pruefungRow = {
  id: UUID,
  tenant_id: TENANT,
  schueler_id: "schueler-1",
  typ: "theorie",
  datum: "2026-04-10",
  ergebnis: "bestanden",
  fehlerpunkte: 5,
  notizen: null,
  deleted_at: null,
  created_at: "2026-03-01T00:00:00Z",
};

const fahrlehrerRow = {
  id: UUID,
  tenant_id: TENANT,
  vorname: "Hans",
  nachname: "Schmidt",
  telefon: "+4917712345",
  email: "hans@fahrschule.de",
  fuehrerscheinklassen: ["B", "BE"],
  aktiv: true,
  deleted_at: null,
};

const fahrzeugRow = {
  id: UUID,
  tenant_id: TENANT,
  kennzeichen: "N-AP 123",
  marke: "VW",
  modell: "Golf",
  baujahr: 2022,
  fuehrerscheinklasse: "B",
  tuev_bis: "2027-06-01",
  kilometerstand: 25000,
  status: "aktiv",
  notizen: null,
  deleted_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

// ===================================================================
// schuelerDb
// ===================================================================
describe("schuelerDb", () => {
  it("create() inserts and returns mapped Schueler", async () => {
    const { builder, chain } = createQueryMock({ data: schuelerRow });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.create({
      tenantId: TENANT,
      vorname: "Max",
      nachname: "Mustermann",
      email: "max@test.de",
      telefon: "+491234567890",
      geburtsdatum: "2000-01-01",
      adresse: "Teststr. 1",
      plz: "12345",
      ort: "Berlin",
      fuehrerscheinklasse: "B",
      status: "angemeldet",
      anmeldungsDatum: "2026-01-01",
    });

    expect(mockFrom).toHaveBeenCalledWith("schueler");
    expect(chain.insert).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result?.vorname).toBe("Max");
    expect(result?.tenantId).toBe(TENANT);
  });

  it("create() returns null on error", async () => {
    const { builder } = createQueryMock({ data: null, error: { message: "insert fail" } });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.create({
      tenantId: TENANT,
      vorname: "X",
      nachname: "Y",
      email: "x@y.de",
      telefon: "123",
      geburtsdatum: "2000-01-01",
      adresse: "",
      plz: "12345",
      ort: "Berlin",
      fuehrerscheinklasse: "B",
      status: "angemeldet",
      anmeldungsDatum: "2026-01-01",
    });

    expect(result).toBeNull();
  });

  it("getById() filters by id and excludes soft-deleted", async () => {
    const { builder, chain } = createQueryMock({ data: schuelerRow });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.getById(UUID, TENANT);

    expect(mockFrom).toHaveBeenCalledWith("schueler");
    expect(chain.eq).toHaveBeenCalledWith("id", UUID);
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result?.id).toBe(UUID);
  });

  it("getById() returns null when not found", async () => {
    const { builder } = createQueryMock({ data: null });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.getById("nonexistent");
    expect(result).toBeNull();
  });

  it("getByTenant() applies tenant filter and pagination", async () => {
    const { builder, chain } = createQueryMock({ data: [schuelerRow] });
    mockFrom.mockReturnValue(builder);

    const results = await schuelerDb.getByTenant(TENANT, { limit: 10, offset: 5 });

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(chain.range).toHaveBeenCalledWith(5, 14);
    expect(Array.isArray(results)).toBe(true);
  });

  it("getByTenant() returns empty array on null data", async () => {
    const { builder } = createQueryMock({ data: null });
    mockFrom.mockReturnValue(builder);

    const results = await schuelerDb.getByTenant(TENANT);
    expect(results).toEqual([]);
  });

  it("update() maps camelCase to snake_case and filters by tenant", async () => {
    const { builder, chain } = createQueryMock({ data: { ...schuelerRow, vorname: "Moritz" } });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.update(UUID, { vorname: "Moritz" }, TENANT);

    expect(chain.update).toHaveBeenCalledWith({ vorname: "Moritz" });
    expect(chain.eq).toHaveBeenCalledWith("id", UUID);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result?.vorname).toBe("Moritz");
  });

  it("update() returns null on error", async () => {
    const { builder } = createQueryMock({ data: null, error: { message: "fail" } });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.update(UUID, { vorname: "X" });
    expect(result).toBeNull();
  });

  it("delete() soft-deletes by setting deleted_at", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.delete(UUID, TENANT);

    expect(chain.update).toHaveBeenCalled();
    const updateArg = chain.update.mock.calls[0][0];
    expect(updateArg).toHaveProperty("deleted_at");
    expect(chain.eq).toHaveBeenCalledWith("id", UUID);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result).toBe(true);
  });

  it("delete() returns false on error", async () => {
    const { builder } = createQueryMock({ error: { message: "fail" } });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.delete(UUID);
    expect(result).toBe(false);
  });

  it("hardDelete() permanently removes the row", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.hardDelete(UUID, TENANT);

    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("id", UUID);
    expect(result).toBe(true);
  });

  it("search() uses ilike with tenant filter", async () => {
    const { builder, chain } = createQueryMock({ data: [schuelerRow] });
    mockFrom.mockReturnValue(builder);

    const results = await schuelerDb.search(TENANT, "Max");

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.or).toHaveBeenCalledWith(
      "vorname.ilike.%Max%,nachname.ilike.%Max%,email.ilike.%Max%"
    );
    expect(chain.limit).toHaveBeenCalledWith(500);
    expect(Array.isArray(results)).toBe(true);
  });

  it("getByStatus() filters by status and tenant", async () => {
    const { builder, chain } = createQueryMock({ data: [schuelerRow] });
    mockFrom.mockReturnValue(builder);

    await schuelerDb.getByStatus(TENANT, "angemeldet");

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.eq).toHaveBeenCalledWith("status", "angemeldet");
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.limit).toHaveBeenCalledWith(500);
  });

  it("count() returns count with tenant filter", async () => {
    const { builder, chain } = createQueryMock({ count: 42 });
    mockFrom.mockReturnValue(builder);

    const result = await schuelerDb.count(TENANT);

    expect(chain.select).toHaveBeenCalledWith("*", { count: "exact", head: true });
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    // count comes from the resolved value
  });
});

// ===================================================================
// fahrstundenDb
// ===================================================================
describe("fahrstundenDb", () => {
  it("create() inserts and returns mapped Fahrstunde", async () => {
    const { builder, chain } = createQueryMock({ data: fahrstundeRow });
    mockFrom.mockReturnValue(builder);

    const result = await fahrstundenDb.create({
      tenantId: TENANT,
      schuelerId: "schueler-1",
      fahrlehrerId: "lehrer-1",
      datum: "2026-03-15",
      uhrzeit: "14:00",
      dauer: 90,
      typ: "normal",
      status: "geplant",
    });

    expect(mockFrom).toHaveBeenCalledWith("fahrstunden");
    expect(chain.insert).toHaveBeenCalled();
    expect(result?.tenantId).toBe(TENANT);
    expect(result?.dauer).toBe(90);
  });

  it("create() returns null on error", async () => {
    const { builder } = createQueryMock({ data: null, error: { message: "fail" } });
    mockFrom.mockReturnValue(builder);

    const result = await fahrstundenDb.create({
      tenantId: TENANT,
      schuelerId: "s1",
      datum: "2026-03-15",
      uhrzeit: "10:00",
      dauer: 45,
      typ: "normal",
      status: "geplant",
    });

    expect(result).toBeNull();
  });

  it("getBySchueler() filters by schueler_id and tenant_id", async () => {
    const { builder, chain } = createQueryMock({ data: [fahrstundeRow] });
    mockFrom.mockReturnValue(builder);

    await fahrstundenDb.getBySchueler("schueler-1", TENANT);

    expect(chain.eq).toHaveBeenCalledWith("schueler_id", "schueler-1");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.limit).toHaveBeenCalledWith(500);
  });

  it("getByTenant() applies pagination", async () => {
    const { builder, chain } = createQueryMock({ data: [fahrstundeRow] });
    mockFrom.mockReturnValue(builder);

    await fahrstundenDb.getByTenant(TENANT, { limit: 20, offset: 10 });

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.limit).toHaveBeenCalledWith(20);
    expect(chain.range).toHaveBeenCalledWith(10, 29);
  });

  it("getByDate() filters by exact date", async () => {
    const { builder, chain } = createQueryMock({ data: [fahrstundeRow] });
    mockFrom.mockReturnValue(builder);

    await fahrstundenDb.getByDate(TENANT, "2026-03-15");

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.eq).toHaveBeenCalledWith("datum", "2026-03-15");
  });

  it("getByDateRange() uses gte/lte for range", async () => {
    const { builder, chain } = createQueryMock({ data: [fahrstundeRow] });
    mockFrom.mockReturnValue(builder);

    await fahrstundenDb.getByDateRange(TENANT, "2026-03-01", "2026-03-31");

    expect(chain.gte).toHaveBeenCalledWith("datum", "2026-03-01");
    expect(chain.lte).toHaveBeenCalledWith("datum", "2026-03-31");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });

  it("update() maps fields to snake_case", async () => {
    const { builder, chain } = createQueryMock({ data: { ...fahrstundeRow, status: "abgeschlossen" } });
    mockFrom.mockReturnValue(builder);

    const result = await fahrstundenDb.update(UUID, { status: "abgeschlossen" }, TENANT);

    expect(chain.update).toHaveBeenCalledWith({ status: "abgeschlossen" });
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result?.status).toBe("abgeschlossen");
  });

  it("delete() soft-deletes with tenant isolation", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await fahrstundenDb.delete(UUID, TENANT);

    expect(chain.update).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result).toBe(true);
  });
});

// ===================================================================
// zahlungenDb
// ===================================================================
describe("zahlungenDb", () => {
  it("create() inserts with snake_case mapping", async () => {
    const { builder, chain } = createQueryMock({ data: zahlungRow });
    mockFrom.mockReturnValue(builder);

    const result = await zahlungenDb.create({
      tenantId: TENANT,
      schuelerId: "schueler-1",
      betrag: 49.99,
      beschreibung: "Fahrstunde",
      status: "offen",
      faelligAm: "2026-04-01",
      mahnungsStufe: 0,
    });

    expect(mockFrom).toHaveBeenCalledWith("zahlungen");
    expect(result?.betrag).toBe(49.99);
  });

  it("create() returns null on error", async () => {
    const { builder } = createQueryMock({ data: null, error: { message: "fail" } });
    mockFrom.mockReturnValue(builder);

    const result = await zahlungenDb.create({
      tenantId: TENANT,
      schuelerId: "s1",
      betrag: 100,
      beschreibung: "Test",
      status: "offen",
      faelligAm: "2026-04-01",
      mahnungsStufe: 0,
    });
    expect(result).toBeNull();
  });

  it("getBySchueler() filters by schueler and tenant", async () => {
    const { builder, chain } = createQueryMock({ data: [zahlungRow] });
    mockFrom.mockReturnValue(builder);

    await zahlungenDb.getBySchueler("schueler-1", TENANT);

    expect(chain.eq).toHaveBeenCalledWith("schueler_id", "schueler-1");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });

  it("getByTenant() supports pagination", async () => {
    const { builder, chain } = createQueryMock({ data: [zahlungRow] });
    mockFrom.mockReturnValue(builder);

    await zahlungenDb.getByTenant(TENANT, { limit: 25 });

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.limit).toHaveBeenCalledWith(25);
  });

  it("getOffene() filters by offen and ueberfaellig statuses", async () => {
    const { builder, chain } = createQueryMock({ data: [zahlungRow] });
    mockFrom.mockReturnValue(builder);

    await zahlungenDb.getOffene(TENANT);

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.in).toHaveBeenCalledWith("status", ["offen", "ueberfaellig"]);
  });

  it("update() maps bezahltAm to bezahlt_am", async () => {
    const { builder, chain } = createQueryMock({ data: { ...zahlungRow, status: "bezahlt", bezahlt_am: "2026-04-01" } });
    mockFrom.mockReturnValue(builder);

    const result = await zahlungenDb.update(UUID, { status: "bezahlt", bezahltAm: "2026-04-01" }, TENANT);

    expect(chain.update).toHaveBeenCalledWith({ status: "bezahlt", bezahlt_am: "2026-04-01" });
    expect(result?.status).toBe("bezahlt");
  });

  it("delete() soft-deletes", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await zahlungenDb.delete(UUID, TENANT);
    expect(result).toBe(true);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });

  it("summe() sums betrag values with tenant filter", async () => {
    const { builder, chain } = createQueryMock({ data: [{ betrag: 100 }, { betrag: 200.50 }] });
    mockFrom.mockReturnValue(builder);

    const result = await zahlungenDb.summe(TENANT);

    expect(chain.select).toHaveBeenCalledWith("betrag");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result).toBe(300.50);
  });

  it("summe() filters by status when provided", async () => {
    const { builder, chain } = createQueryMock({ data: [{ betrag: 50 }] });
    mockFrom.mockReturnValue(builder);

    await zahlungenDb.summe(TENANT, "bezahlt");

    expect(chain.eq).toHaveBeenCalledWith("status", "bezahlt");
  });

  it("summe() returns 0 for empty result", async () => {
    const { builder } = createQueryMock({ data: null });
    mockFrom.mockReturnValue(builder);

    const result = await zahlungenDb.summe(TENANT);
    expect(result).toBe(0);
  });
});

// ===================================================================
// dokumenteDb
// ===================================================================
describe("dokumenteDb", () => {
  it("create() inserts dokument with snake_case mapping", async () => {
    const { builder, chain } = createQueryMock({ data: dokumentRow });
    mockFrom.mockReturnValue(builder);

    const result = await dokumenteDb.create({
      tenantId: TENANT,
      schuelerId: "schueler-1",
      typ: "sehtest",
      dateiname: "sehtest.pdf",
      vorhanden: true,
    });

    expect(mockFrom).toHaveBeenCalledWith("dokumente");
    expect(result?.typ).toBe("sehtest");
    expect(result?.vorhanden).toBe(true);
  });

  it("getBySchueler() filters by schueler and tenant", async () => {
    const { builder, chain } = createQueryMock({ data: [dokumentRow] });
    mockFrom.mockReturnValue(builder);

    const results = await dokumenteDb.getBySchueler("schueler-1", TENANT);

    expect(chain.eq).toHaveBeenCalledWith("schueler_id", "schueler-1");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(Array.isArray(results)).toBe(true);
  });

  it("update() maps camelCase fields", async () => {
    const { builder, chain } = createQueryMock({ data: { ...dokumentRow, vorhanden: true } });
    mockFrom.mockReturnValue(builder);

    const result = await dokumenteDb.update(UUID, { vorhanden: true, uploadDatum: "2026-03-01" }, TENANT);

    expect(chain.update).toHaveBeenCalledWith({ vorhanden: true, upload_datum: "2026-03-01" });
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });

  it("delete() soft-deletes with tenant filter", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await dokumenteDb.delete(UUID, TENANT);

    expect(result).toBe(true);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });

  it("getFehlende() returns dokumente where vorhanden=false", async () => {
    const { builder, chain } = createQueryMock({ data: [{ ...dokumentRow, vorhanden: false }] });
    mockFrom.mockReturnValue(builder);

    await dokumenteDb.getFehlende(TENANT);

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.eq).toHaveBeenCalledWith("vorhanden", false);
  });
});

// ===================================================================
// kommunikationDb
// ===================================================================
describe("kommunikationDb", () => {
  it("create() inserts kommunikation", async () => {
    const { builder, chain } = createQueryMock({ data: kommunikationRow });
    mockFrom.mockReturnValue(builder);

    const result = await kommunikationDb.create({
      tenantId: TENANT,
      schuelerId: "schueler-1",
      kanal: "whatsapp",
      richtung: "eingehend",
      inhalt: "Hallo",
      datum: "2026-03-20T10:00:00Z",
    });

    expect(mockFrom).toHaveBeenCalledWith("kommunikation");
    expect(result?.kanal).toBe("whatsapp");
  });

  it("create() returns null on error", async () => {
    const { builder } = createQueryMock({ data: null, error: { message: "fail" } });
    mockFrom.mockReturnValue(builder);

    const result = await kommunikationDb.create({
      tenantId: TENANT,
      schuelerId: "s1",
      kanal: "email",
      richtung: "ausgehend",
      inhalt: "Test",
      datum: "2026-01-01",
    });
    expect(result).toBeNull();
  });

  it("getBySchueler() applies tenant isolation", async () => {
    const { builder, chain } = createQueryMock({ data: [kommunikationRow] });
    mockFrom.mockReturnValue(builder);

    await kommunikationDb.getBySchueler("schueler-1", TENANT);

    expect(chain.eq).toHaveBeenCalledWith("schueler_id", "schueler-1");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.limit).toHaveBeenCalledWith(500);
  });

  it("getByTenant() supports pagination", async () => {
    const { builder, chain } = createQueryMock({ data: [kommunikationRow] });
    mockFrom.mockReturnValue(builder);

    await kommunikationDb.getByTenant(TENANT, { limit: 10, offset: 0 });

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it("delete() soft-deletes with tenant filter", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await kommunikationDb.delete(UUID, TENANT);
    expect(result).toBe(true);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });
});

// ===================================================================
// pruefungenDb
// ===================================================================
describe("pruefungenDb", () => {
  it("create() inserts pruefung", async () => {
    const { builder, chain } = createQueryMock({ data: pruefungRow });
    mockFrom.mockReturnValue(builder);

    const result = await pruefungenDb.create({
      tenantId: TENANT,
      schuelerId: "schueler-1",
      typ: "theorie",
      datum: "2026-04-10",
      ergebnis: "bestanden",
      fehlerpunkte: 5,
    });

    expect(mockFrom).toHaveBeenCalledWith("pruefungen");
    expect(result?.typ).toBe("theorie");
    expect(result?.ergebnis).toBe("bestanden");
  });

  it("getBySchueler() filters by schueler and tenant", async () => {
    const { builder, chain } = createQueryMock({ data: [pruefungRow] });
    mockFrom.mockReturnValue(builder);

    await pruefungenDb.getBySchueler("schueler-1", TENANT);

    expect(chain.eq).toHaveBeenCalledWith("schueler_id", "schueler-1");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });

  it("getByTenant() applies pagination", async () => {
    const { builder, chain } = createQueryMock({ data: [pruefungRow] });
    mockFrom.mockReturnValue(builder);

    await pruefungenDb.getByTenant(TENANT, { limit: 5 });

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.limit).toHaveBeenCalledWith(5);
  });

  it("delete() soft-deletes", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await pruefungenDb.delete(UUID, TENANT);
    expect(result).toBe(true);
  });

  it("bestehensquote() calculates pass rate percentage", async () => {
    const { builder, chain } = createQueryMock({
      data: [
        { ergebnis: "bestanden" },
        { ergebnis: "bestanden" },
        { ergebnis: "nicht_bestanden" },
        { ergebnis: "bestanden" },
      ],
    });
    mockFrom.mockReturnValue(builder);

    const result = await pruefungenDb.bestehensquote(TENANT);

    expect(chain.select).toHaveBeenCalledWith("ergebnis");
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result).toBe(75); // 3/4 = 75%
  });

  it("bestehensquote() returns 0 for no exams", async () => {
    const { builder } = createQueryMock({ data: null });
    mockFrom.mockReturnValue(builder);

    const result = await pruefungenDb.bestehensquote(TENANT);
    expect(result).toBe(0);
  });
});

// ===================================================================
// fahrlehrerDb
// ===================================================================
describe("fahrlehrerDb", () => {
  it("create() inserts fahrlehrer", async () => {
    const { builder, chain } = createQueryMock({ data: fahrlehrerRow });
    mockFrom.mockReturnValue(builder);

    const result = await fahrlehrerDb.create({
      tenantId: TENANT,
      vorname: "Hans",
      nachname: "Schmidt",
      telefon: "+4917712345",
      email: "hans@fahrschule.de",
      fuehrerscheinklassen: ["B", "BE"],
      aktiv: true,
    });

    expect(mockFrom).toHaveBeenCalledWith("fahrlehrer");
    expect(result?.vorname).toBe("Hans");
    expect(result?.fuehrerscheinklassen).toEqual(["B", "BE"]);
  });

  it("getByTenant() filters by tenant and excludes deleted", async () => {
    const { builder, chain } = createQueryMock({ data: [fahrlehrerRow] });
    mockFrom.mockReturnValue(builder);

    await fahrlehrerDb.getByTenant(TENANT);

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.order).toHaveBeenCalledWith("nachname");
  });

  it("getById() filters by id and tenant", async () => {
    const { builder, chain } = createQueryMock({ data: fahrlehrerRow });
    mockFrom.mockReturnValue(builder);

    const result = await fahrlehrerDb.getById(UUID, TENANT);

    expect(chain.eq).toHaveBeenCalledWith("id", UUID);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result?.nachname).toBe("Schmidt");
  });

  it("update() maps fields correctly", async () => {
    const { builder, chain } = createQueryMock({ data: { ...fahrlehrerRow, aktiv: false } });
    mockFrom.mockReturnValue(builder);

    const result = await fahrlehrerDb.update(UUID, { aktiv: false }, TENANT);

    expect(chain.update).toHaveBeenCalledWith({ aktiv: false });
    expect(result?.aktiv).toBe(false);
  });

  it("delete() soft-deletes", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await fahrlehrerDb.delete(UUID, TENANT);
    expect(result).toBe(true);
  });
});

// ===================================================================
// fahrzeugeDb
// ===================================================================
describe("fahrzeugeDb", () => {
  it("create() inserts fahrzeug with snake_case mapping", async () => {
    const { builder, chain } = createQueryMock({ data: fahrzeugRow });
    mockFrom.mockReturnValue(builder);

    const result = await fahrzeugeDb.create({
      tenantId: TENANT,
      kennzeichen: "N-AP 123",
      marke: "VW",
      modell: "Golf",
      baujahr: 2022,
      fuehrerscheinklasse: "B",
      tuevBis: "2027-06-01",
      kilometerstand: 25000,
      status: "aktiv",
    });

    expect(mockFrom).toHaveBeenCalledWith("fahrzeuge");
    expect(result?.kennzeichen).toBe("N-AP 123");
    expect(result?.tuevBis).toBe("2027-06-01");
  });

  it("getByTenant() filters and orders by kennzeichen", async () => {
    const { builder, chain } = createQueryMock({ data: [fahrzeugRow] });
    mockFrom.mockReturnValue(builder);

    await fahrzeugeDb.getByTenant(TENANT);

    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(chain.order).toHaveBeenCalledWith("kennzeichen");
  });

  it("getById() with tenant filter", async () => {
    const { builder, chain } = createQueryMock({ data: fahrzeugRow });
    mockFrom.mockReturnValue(builder);

    const result = await fahrzeugeDb.getById(UUID, TENANT);

    expect(chain.eq).toHaveBeenCalledWith("id", UUID);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
    expect(result?.marke).toBe("VW");
  });

  it("update() maps tuevBis to tuev_bis", async () => {
    const { builder, chain } = createQueryMock({ data: { ...fahrzeugRow, tuev_bis: "2028-01-01" } });
    mockFrom.mockReturnValue(builder);

    await fahrzeugeDb.update(UUID, { tuevBis: "2028-01-01", kilometerstand: 30000 }, TENANT);

    expect(chain.update).toHaveBeenCalledWith({ tuev_bis: "2028-01-01", kilometerstand: 30000 });
  });

  it("delete() soft-deletes", async () => {
    const { builder, chain } = createQueryMock({ error: null });
    mockFrom.mockReturnValue(builder);

    const result = await fahrzeugeDb.delete(UUID, TENANT);
    expect(result).toBe(true);
    expect(chain.eq).toHaveBeenCalledWith("tenant_id", TENANT);
  });

  it("getById() returns null when not found", async () => {
    const { builder } = createQueryMock({ data: null });
    mockFrom.mockReturnValue(builder);

    const result = await fahrzeugeDb.getById("nonexistent");
    expect(result).toBeNull();
  });
});
