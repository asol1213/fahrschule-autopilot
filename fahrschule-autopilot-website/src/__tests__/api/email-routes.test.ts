import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      admin: { getUserById: vi.fn(async () => ({ data: { user: { email: "owner@example.com" } } })) },
    },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/email/resend", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/lib/email/templates", () => ({
  outreachEmail: vi.fn(() => "<html>outreach</html>"),
  followUpEmail: vi.fn(() => "<html>followup</html>"),
  monthlyReportEmail: vi.fn(() => "<html>report</html>"),
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

import { POST as sendPOST } from "@/app/api/email/send/route";
import { POST as reportPOST } from "@/app/api/email/report/route";
import { NextRequest } from "next/server";

function makeRequest(url: string, body?: object, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } } : { headers }),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv", "count", "reduce"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv", "count"].includes(m) ? result : chain);
  });
  return chain;
}

// ---------------------------------------------------------------------------
// POST /api/email/send
// ---------------------------------------------------------------------------
describe("POST /api/email/send", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when to is missing", async () => {
    const res = await sendPOST(makeRequest("/api/email/send", { subject: "Test" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/to.*subject/i);
  });

  it("returns 400 when subject is missing", async () => {
    const res = await sendPOST(makeRequest("/api/email/send", { to: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("sends outreach email successfully", async () => {
    mockSendEmail.mockResolvedValue({ success: true, id: "email-1" });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));

    const res = await sendPOST(makeRequest("/api/email/send", {
      to: "kunde@example.com",
      subject: "Angebot",
      typ: "outreach",
      nachricht: "Hallo!",
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.emailId).toBe("email-1");
  });

  it("sends follow_up email and updates followUp record", async () => {
    mockSendEmail.mockResolvedValue({ success: true, id: "email-2" });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));

    const res = await sendPOST(makeRequest("/api/email/send", {
      to: "kunde@example.com",
      subject: "Follow-Up",
      typ: "follow_up",
      nachricht: "Noch Interesse?",
      followUpId: "fu-1",
    }));

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("follow_ups");
  });

  it("updates lead status when leadId provided", async () => {
    mockSendEmail.mockResolvedValue({ success: true, id: "email-3" });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));

    await sendPOST(makeRequest("/api/email/send", {
      to: "lead@example.com",
      subject: "Test",
      typ: "outreach",
      nachricht: "Hi",
      leadId: "lead-1",
    }));

    expect(mockFrom).toHaveBeenCalledWith("sales_leads");
  });

  it("returns 500 when email sending fails", async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: "Provider down" });

    const res = await sendPOST(makeRequest("/api/email/send", {
      to: "test@example.com",
      subject: "Test",
      nachricht: "Body",
    }));

    expect(res.status).toBe(500);
  });

  it("sends custom HTML when no typ specified", async () => {
    mockSendEmail.mockResolvedValue({ success: true, id: "email-4" });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));

    const res = await sendPOST(makeRequest("/api/email/send", {
      to: "test@example.com",
      subject: "Custom",
      html: "<p>Custom HTML</p>",
    }));

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: "<p>Custom HTML</p>",
    }));
  });
});

// ---------------------------------------------------------------------------
// POST /api/email/report
// ---------------------------------------------------------------------------
describe("POST /api/email/report", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends report for a specific tenant", async () => {
    // tenant lookup
    const tenantChain = chainMock({ data: { name: "Fahrschule Test", owner_user_id: "owner-1" }, error: null });
    // owner user lookup
    const ownerChain = chainMock({ data: { user_id: "owner-1" }, error: null });
    // data queries (schueler, zahlungen, fahrstunden, pruefungen)
    const dataChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return tenantChain;
      if (callCount === 2) return ownerChain;
      return dataChain;
    });

    mockSendEmail.mockResolvedValue({ success: true, id: "report-1" });

    const res = await reportPOST(makeRequest("/api/email/report", { tenantId: "t-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.sent).toBe(1);
  });

  it("handles tenant not found gracefully", async () => {
    const tenantChain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(tenantChain);

    const res = await reportPOST(makeRequest("/api/email/report", { tenantId: "nonexistent" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.failed).toBe(1);
  });
});
