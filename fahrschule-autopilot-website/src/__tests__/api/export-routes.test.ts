import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn() },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual("@/lib/api-auth");
  return {
    ...actual,
    rateLimit: () => () => false,
    getClientIp: () => "127.0.0.1",
    requireAuth: vi.fn(async () => ({ userId: "u1", tenantId: "t1", role: "inhaber" })),
    isAuthed: (r: unknown) => !(r instanceof NextResponse),
  };
});

vi.mock("@/lib/analytics/export-helpers", () => ({
  today: () => "2026-04-01",
  formatDate: (d: string | null) => d || "",
  statusLabel: (s: string) => s || "",
  typLabel: (t: string) => t || "",
}));

vi.mock("@/lib/analytics/pdf-generator", () => ({
  generateMonthlyReportPDF: vi.fn(() => new Uint8Array([37, 80, 68, 70])), // %PDF
}));

import { GET as exportGET } from "@/app/api/export/route";
import { GET as exportPdfGET } from "@/app/api/export/pdf/route";
import { NextRequest } from "next/server";

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, { method: "GET", headers });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = { data: result.data, error: result.error };
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv", "count"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv", "count"].includes(m) ? result : chain);
  });
  return chain;
}

// ---------------------------------------------------------------------------
// GET /api/export
// ---------------------------------------------------------------------------
describe("GET /api/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 without tenantId", async () => {
    const res = await exportGET(makeRequest("/api/export"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-CSV format", async () => {
    const res = await exportGET(makeRequest("/api/export?tenantId=t1&format=json"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/CSV/);
  });

  it("returns 400 for unknown export type", async () => {
    const res = await exportGET(makeRequest("/api/export?tenantId=t1&format=csv&type=unknown"));
    expect(res.status).toBe(400);
  });

  it("exports schueler CSV", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: [
        { vorname: "Max", nachname: "M", email: "m@x.de", telefon: "123", geburtsdatum: "2000-01-01", fuehrerscheinklasse: "B", status: "aktiv", anmeldungs_datum: "2026-01-01", ort: "Stuttgart" },
      ],
      error: null,
    }));

    const res = await exportGET(makeRequest("/api/export?tenantId=t1&type=schueler"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("schueler_");
    const text = await res.text();
    expect(text).toContain("Vorname");
    expect(text).toContain("Max");
  });

  it("exports zahlungen CSV", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: [
        { betrag: 55.00, beschreibung: "Grundgebühr", status: "offen", faellig_am: "2026-04-01", bezahlt_am: null, mahnungs_stufe: 0, schueler: { vorname: "Max", nachname: "M" } },
      ],
      error: null,
    }));

    const res = await exportGET(makeRequest("/api/export?tenantId=t1&type=zahlungen"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Betrag");
  });

  it("exports fahrstunden CSV", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: [
        { datum: "2026-04-01", uhrzeit: "10:00", dauer: 45, typ: "normal", status: "geplant", bewertung: null, schueler: { vorname: "Max", nachname: "M" }, fahrlehrer: { vorname: "Hans", nachname: "L" } },
      ],
      error: null,
    }));

    const res = await exportGET(makeRequest("/api/export?tenantId=t1&type=fahrstunden"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Datum");
  });

  it("exports report CSV", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));

    const res = await exportGET(makeRequest("/api/export?tenantId=t1&type=report"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Kennzahl");
    expect(text).toContain("Gesamt Sch");
  });

  it("includes BOM for Excel compatibility", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await exportGET(makeRequest("/api/export?tenantId=t1&type=report"));
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // UTF-8 BOM is EF BB BF
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
  });
});

// ---------------------------------------------------------------------------
// GET /api/export/pdf
// ---------------------------------------------------------------------------
describe("GET /api/export/pdf", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 without tenantId", async () => {
    const res = await exportPdfGET(makeRequest("/api/export/pdf"));
    expect(res.status).toBe(400);
  });

  it("returns PDF with correct headers", async () => {
    // tenant query
    const tenantChain = chainMock({ data: { name: "Fahrschule Test", plan: "pro" }, error: null });
    // data queries
    const dataChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? tenantChain : dataChain;
    });

    const res = await exportPdfGET(makeRequest("/api/export/pdf?tenantId=t1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("report_");
  });
});
