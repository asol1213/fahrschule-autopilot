import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { GET as DatevGET } from "@/app/api/crm/export/datev/route";
import { GET as LexofficeGET } from "@/app/api/crm/export/lexoffice/route";
import { NextRequest } from "next/server";

function makeRequest(path: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { method: "GET" });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "order", "limit", "range", "maybeSingle", "single", "csv"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv"].includes(m) ? result : chain);
  });
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function mockAuth(userId = "user-1", tenantId = "tenant-1", role = "inhaber") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
  mockFrom.mockImplementation((table: string) => {
    if (table === "tenant_users") {
      return chainMock({ data: { tenant_id: tenantId, role }, error: null });
    }
    return chainMock({ data: [], error: null });
  });
}

function mockNoAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

describe("GET /api/crm/export/datev", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when required params are missing", async () => {
    const res = await DatevGET(makeRequest("/api/crm/export/datev", { tenantId: "t-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await DatevGET(makeRequest("/api/crm/export/datev", { von: "2026-01-01", bis: "2026-03-31" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await DatevGET(makeRequest("/api/crm/export/datev", { tenantId: "t-1", von: "2026-01-01", bis: "2026-03-31" }));
    expect(res.status).toBe(401);
  });

  it("generates DATEV CSV export", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [{
            id: "z-12345678-abcd",
            betrag: 55,
            beschreibung: "Fahrstunde",
            bezahlt_am: "2026-02-15",
            status: "bezahlt",
            schueler: { vorname: "Max", nachname: "Muster" },
          }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await DatevGET(makeRequest("/api/crm/export/datev", {
      tenantId: "tenant-1",
      von: "2026-01-01",
      bis: "2026-03-31",
    }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/csv/);
    expect(res.headers.get("Content-Disposition")).toMatch(/DATEV_Export/);

    const csv = await res.text();
    expect(csv).toContain("Umsatz");
    expect(csv).toContain("H");
    expect(csv).toContain("EUR");
  });

  it("returns empty CSV when no payments found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await DatevGET(makeRequest("/api/crm/export/datev", {
      tenantId: "tenant-1",
      von: "2026-01-01",
      bis: "2026-03-31",
    }));
    expect(res.status).toBe(200);
    const csv = await res.text();
    // Only header row
    const lines = csv.split("\n").filter(Boolean);
    expect(lines.length).toBe(1);
  });
});

describe("GET /api/crm/export/lexoffice", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when required params are missing", async () => {
    const res = await LexofficeGET(makeRequest("/api/crm/export/lexoffice", { tenantId: "t-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await LexofficeGET(makeRequest("/api/crm/export/lexoffice", { tenantId: "t-1", von: "2026-01-01", bis: "2026-03-31" }));
    expect(res.status).toBe(401);
  });

  it("generates lexoffice CSV export", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [{
            id: "z-12345678-abcd",
            betrag: 55,
            beschreibung: "Fahrstunde",
            bezahlt_am: "2026-02-15",
            faellig_am: "2026-02-01",
            status: "bezahlt",
            schueler: { vorname: "Max", nachname: "Muster" },
          }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await LexofficeGET(makeRequest("/api/crm/export/lexoffice", {
      tenantId: "tenant-1",
      von: "2026-01-01",
      bis: "2026-03-31",
    }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/csv/);
    expect(res.headers.get("Content-Disposition")).toMatch(/lexoffice_Export/);

    const csv = await res.text();
    expect(csv).toContain("Rechnungsnummer");
    expect(csv).toContain("bezahlt");
    expect(csv).toContain("Max Muster");
  });

  it("returns 500 on database error", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({ data: null, error: { message: "DB error" } });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await LexofficeGET(makeRequest("/api/crm/export/lexoffice", {
      tenantId: "tenant-1",
      von: "2026-01-01",
      bis: "2026-03-31",
    }));
    expect(res.status).toBe(500);
  });
});
