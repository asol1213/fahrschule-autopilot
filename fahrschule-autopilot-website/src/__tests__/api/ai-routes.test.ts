import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/monitoring", () => ({
  captureError: vi.fn(),
}));

vi.mock("@/data/stvo", () => ({
  searchStVO: vi.fn(() => []),
  formatStVOContext: vi.fn(() => ""),
}));

import { POST as chatbotPOST } from "@/app/api/chatbot/route";
import { POST as tutorPOST } from "@/app/api/tutor/route";
import { NextRequest } from "next/server";

function makeRequest(url: string, body?: object, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } } : { headers }),
  });
}

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------
describe("POST /api/chatbot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns 400 when message is missing", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const res = await chatbotPOST(makeRequest("/api/chatbot", { message: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Nachricht/);
  });

  it("returns 503 when ANTHROPIC_API_KEY not configured", async () => {
    const res = await chatbotPOST(makeRequest("/api/chatbot", { message: "Hallo" }));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.response).toMatch(/WhatsApp/);
  });

  it("returns chatbot response on success", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "Hallo! Wie kann ich Ihnen helfen?" }],
      }),
    });

    const res = await chatbotPOST(makeRequest("/api/chatbot", { message: "Was kostet das?" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.response).toBe("Hallo! Wie kann ich Ihnen helfen?");
  });

  it("handles Anthropic API error gracefully", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await chatbotPOST(makeRequest("/api/chatbot", { message: "Hallo" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.response).toMatch(/nicht verfügbar/);
  });

  it("passes chat history to API", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "Antwort" }],
      }),
    });

    await chatbotPOST(makeRequest("/api/chatbot", {
      message: "Neue Frage",
      chatHistory: [
        { role: "user", content: "Erste Frage" },
        { role: "assistant", content: "Erste Antwort" },
      ],
    }));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.messages.length).toBe(3);
  });

  it("sanitizes message input (max 1000 chars)", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "OK" }],
      }),
    });

    const longMessage = "A".repeat(2000);
    await chatbotPOST(makeRequest("/api/chatbot", { message: longMessage }));

    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMsg = fetchBody.messages[fetchBody.messages.length - 1];
    expect(userMsg.content.length).toBeLessThanOrEqual(1000);
  });
});

// ---------------------------------------------------------------------------
// Tutor
// ---------------------------------------------------------------------------
describe("POST /api/tutor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns 503 when ANTHROPIC_API_KEY not configured", async () => {
    const res = await tutorPOST(makeRequest("/api/tutor", {
      question: "Was bedeutet dieses Schild?",
      userAnswer: "Vorfahrt gewähren",
      correctAnswers: "Vorfahrt gewähren",
      explanation: "Richtig!",
    }));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toMatch(/nicht verfügbar/);
  });

  it("returns 400 on invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/tutor", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    const res = await tutorPOST(req);
    expect(res.status).toBe(400);
  });

  it("returns 413 when content-length exceeds limit", async () => {
    const req = new NextRequest("http://localhost/api/tutor", {
      method: "POST",
      body: JSON.stringify({ question: "test" }),
      headers: {
        "content-type": "application/json",
        "content-length": "20000",
      },
    });
    const res = await tutorPOST(req);
    expect(res.status).toBe(413);
  });

  it("returns SSE stream on valid request", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    // Mock streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Gut"}}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"message_stop"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    const res = await tutorPOST(makeRequest("/api/tutor", {
      question: "Wer hat Vorfahrt?",
      userAnswer: "Rechts",
      correctAnswers: "Rechts",
      explanation: "Rechts vor Links",
    }));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("handles followUp messages", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"message_stop"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

    const res = await tutorPOST(makeRequest("/api/tutor", {
      question: "",
      userAnswer: "",
      correctAnswers: "",
      explanation: "",
      followUp: "Kannst du das nochmal erklären?",
    }));

    expect(res.status).toBe(200);
  });
});
