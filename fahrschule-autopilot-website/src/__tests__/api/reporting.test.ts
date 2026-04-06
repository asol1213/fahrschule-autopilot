import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for GET /api/reporting
 * Reporting dashboard — protected via Supabase session auth + tenant check.
 */

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { GET } from "@/app/api/reporting/route";
import { NextRequest } from "next/server";

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  const url = new URL("http://localhost/api/reporting");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { headers });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const terminal = ["maybeSingle", "single", "csv"];
  [
    "select", "insert", "update", "delete", "eq", "neq", "not", "is", "in",
    "gte", "lte", "ilike", "order", "limit", "range", "maybeSingle", "single",
    "csv",
  ].forEach((m) => {
    chain[m] = vi.fn(() => terminal.includes(m) ? result : chain);
  });
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(result));
  return chain;
}

function mockAuth(userId = "user-1") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("tenantId required");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest({ tenantId: "t1" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentifiziert/i);
  });

  it("returns 403 when user has no access to tenant", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({ tenantId: "t-other" }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/verweigert/i);
  });

  it("returns full reporting data with valid auth", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1" }, error: null });
      }
      if (table === "tenants") {
        return chainMock({ data: { name: "Test Fahrschule" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({
          data: [
            { status: "angemeldet", anmeldungs_datum: "2026-04-01", deleted_at: null },
            { status: "praxis", anmeldungs_datum: "2026-03-15", deleted_at: null },
            { status: "bestanden", anmeldungs_datum: "2026-01-01", deleted_at: null },
          ],
          error: null,
        });
      }
      if (table === "fahrstunden") {
        return chainMock({
          data: [
            { status: "abgeschlossen", bewertung: 5 },
            { status: "no_show", bewertung: null },
            { status: "geplant", bewertung: null },
          ],
          error: null,
        });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [
            { betrag: 500, status: "bezahlt", mahnungs_stufe: 0 },
            { betrag: 200, status: "offen", mahnungs_stufe: 0 },
            { betrag: 100, status: "ueberfaellig", mahnungs_stufe: 1 },
          ],
          error: null,
        });
      }
      if (table === "pruefungen") {
        return chainMock({
          data: [
            { typ: "theorie", ergebnis: "bestanden" },
            { typ: "theorie", ergebnis: "nicht_bestanden" },
            { typ: "praxis", ergebnis: "bestanden" },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({ tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();

    // Structure checks
    expect(json.tenantId).toBe("tenant-1");
    expect(json.tenantName).toBe("Test Fahrschule");
    expect(json).toHaveProperty("generatedAt");
    expect(json).toHaveProperty("schueler");
    expect(json).toHaveProperty("fahrstunden");
    expect(json).toHaveProperty("zahlungen");
    expect(json).toHaveProperty("pruefungen");
    expect(json).toHaveProperty("automationen");

    // Schueler stats
    expect(json.schueler.total).toBe(3);
    expect(json.schueler.nachStatus.angemeldet).toBe(1);
    expect(json.schueler.nachStatus.praxis).toBe(1);
    expect(json.schueler.nachStatus.bestanden).toBe(1);

    // Fahrstunden stats
    expect(json.fahrstunden.total).toBe(3);
    expect(json.fahrstunden.noShows).toBe(1);
    expect(json.fahrstunden.noShowRate).toBe(33);
    expect(json.fahrstunden.durchschnittsBewertung).toBe(5);

    // Zahlungen stats
    expect(json.zahlungen.summeBezahlt).toBe(500);
    expect(json.zahlungen.summeOffen).toBe(200);
    expect(json.zahlungen.summeUeberfaellig).toBe(100);
    expect(json.zahlungen.anzahlOffen).toBe(1);
    expect(json.zahlungen.anzahlUeberfaellig).toBe(1);

    // Pruefungen stats
    expect(json.pruefungen.total).toBe(3);
    expect(json.pruefungen.bestanden).toBe(2);
    expect(json.pruefungen.bestehensquote).toBe(67);
    expect(json.pruefungen.theorie.total).toBe(2);
    expect(json.pruefungen.theorie.bestanden).toBe(1);
    expect(json.pruefungen.praxis.total).toBe(1);
    expect(json.pruefungen.praxis.bestanden).toBe(1);
  });

  it("handles empty data gracefully", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "t1" }, error: null });
      }
      if (table === "tenants") {
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({ tenantId: "t1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tenantName).toBe("Fahrschule"); // Default fallback
    expect(json.schueler.total).toBe(0);
    expect(json.fahrstunden.total).toBe(0);
    expect(json.fahrstunden.noShowRate).toBe(0);
    expect(json.zahlungen.summeGesamt).toBe(0);
    expect(json.pruefungen.total).toBe(0);
    expect(json.pruefungen.bestehensquote).toBe(0);
  });

  it("calculates automation KPIs based on schueler count", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "t1" }, error: null });
      }
      if (table === "tenants") {
        return chainMock({ data: { name: "FS" }, error: null });
      }
      if (table === "schueler") {
        const students = Array.from({ length: 10 }, () => ({
          status: "praxis",
          anmeldungs_datum: "2026-01-01",
          deleted_at: null,
        }));
        return chainMock({ data: students, error: null });
      }
      if (table === "pruefungen") {
        return chainMock({
          data: [
            { typ: "praxis", ergebnis: "bestanden" },
            { typ: "praxis", ergebnis: "bestanden" },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({ tenantId: "t1" }));
    const json = await res.json();
    // 10 students * 8.5 = 85 reminders
    expect(json.automationen.erinnerungenGesendet).toBe(85);
    // 10 students * 2.5 = 25 hours saved
    expect(json.automationen.zeitGespart).toBe(25);
    // 2 passed exams = 2 review requests
    expect(json.automationen.bewertungenAngefragt).toBe(2);
  });

  it("correctly counts new registrations for current month", async () => {
    mockAuth();
    const currentMonth = new Date().toISOString().slice(0, 7);
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "t1" }, error: null });
      }
      if (table === "tenants") {
        return chainMock({ data: { name: "FS" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({
          data: [
            { status: "angemeldet", anmeldungs_datum: `${currentMonth}-01`, deleted_at: null },
            { status: "angemeldet", anmeldungs_datum: `${currentMonth}-15`, deleted_at: null },
            { status: "praxis", anmeldungs_datum: "2025-01-01", deleted_at: null },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({ tenantId: "t1" }));
    const json = await res.json();
    expect(json.schueler.neueAnmeldungenDiesenMonat).toBe(2);
  });
});
