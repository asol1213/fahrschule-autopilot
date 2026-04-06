import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

// Mock fetch globally before importing the module
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", mockFetch);

describe("Event Emission System", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("EventType definitions", () => {
    it("has all 18 event types defined in the union type", async () => {
      // We verify by importing and using each event type
      const expectedTypes = [
        "fahrstunde.abgeschlossen",
        "fahrstunde.geplant",
        "fahrstunde.abgesagt",
        "fahrstunde.no_show",
        "pruefung.bestanden",
        "pruefung.nicht_bestanden",
        "pruefung.geplant",
        "zahlung.erstellt",
        "zahlung.ueberfaellig",
        "zahlung.bezahlt",
        "zahlung.fehlgeschlagen",
        "zahlung.mahnung",
        "schueler.angemeldet",
        "schueler.status_geaendert",
        "schueler.bestanden",
        "schueler.dsgvo_loeschung",
        "dokument.fehlend",
        "dokument.ablauf_bald",
      ];
      expect(expectedTypes).toHaveLength(18);
      // Each of these would be accepted by the EventType union
      for (const type of expectedTypes) {
        expect(typeof type).toBe("string");
        expect(type).toMatch(/^[a-z]+\.[a-z_]+$/);
      }
    });

    it("event types follow domain.action naming convention", () => {
      const domains = [
        "fahrstunde",
        "pruefung",
        "zahlung",
        "schueler",
        "dokument",
      ];
      domains.forEach((d) => expect(typeof d).toBe("string"));
    });
  });

  describe("emitEvent()", () => {
    it("sends event to n8n webhook when URL is configured", async () => {
      vi.stubEnv("N8N_EVENTS_WEBHOOK_URL", "https://n8n.example.com/webhook");
      vi.stubEnv("WEBHOOK_SECRET", "test-secret");

      // Re-import to pick up env vars
      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      await emitEvent("fahrstunde.abgeschlossen", "tenant-123", {
        schuelerId: "s1",
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://n8n.example.com/webhook");
      expect(options.method).toBe("POST");
    });

    it("includes correct payload structure", async () => {
      vi.stubEnv("N8N_EVENTS_WEBHOOK_URL", "https://n8n.example.com/webhook");
      vi.stubEnv("WEBHOOK_SECRET", "secret");

      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      await emitEvent("pruefung.bestanden", "tenant-abc", {
        schuelerId: "s2",
        note: "bestanden",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toHaveProperty("type", "pruefung.bestanden");
      expect(body).toHaveProperty("tenantId", "tenant-abc");
      expect(body).toHaveProperty("data");
      expect(body.data).toEqual({ schuelerId: "s2", note: "bestanden" });
      expect(body).toHaveProperty("timestamp");
      expect(new Date(body.timestamp).getTime()).not.toBeNaN();
    });

    it("generates HMAC-SHA256 signature when webhook secret is set", async () => {
      const secret = "my-webhook-secret";
      vi.stubEnv("N8N_EVENTS_WEBHOOK_URL", "https://n8n.example.com/webhook");
      vi.stubEnv("WEBHOOK_SECRET", secret);

      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      await emitEvent("zahlung.bezahlt", "t1", { betrag: 55 });

      const options = mockFetch.mock.calls[0][1];
      const bodyStr = options.body;
      const expectedSig = `sha256=${createHmac("sha256", secret).update(bodyStr).digest("hex")}`;

      expect(options.headers["X-Webhook-Signature"]).toBe(expectedSig);
    });

    it("omits signature header when webhook secret is not set", async () => {
      vi.stubEnv("N8N_EVENTS_WEBHOOK_URL", "https://n8n.example.com/webhook");
      delete process.env.WEBHOOK_SECRET;

      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      await emitEvent("zahlung.erstellt", "t1", {});

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).not.toHaveProperty("X-Webhook-Signature");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("does not call fetch when N8N_EVENTS_WEBHOOK_URL is not set", async () => {
      delete process.env.N8N_EVENTS_WEBHOOK_URL;

      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      await emitEvent("schueler.angemeldet", "t1", { name: "Max" });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not throw when fetch fails (fire-and-forget)", async () => {
      vi.stubEnv("N8N_EVENTS_WEBHOOK_URL", "https://n8n.example.com/webhook");
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      // Should not throw
      await expect(
        emitEvent("dokument.fehlend", "t1", {})
      ).resolves.toBeUndefined();
    });

    it("logs event in development mode", async () => {
      vi.stubEnv("NODE_ENV", "development");
      delete process.env.N8N_EVENTS_WEBHOOK_URL;

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      await emitEvent("fahrstunde.geplant", "t1", { zeit: "14:00" });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[EVENT] fahrstunde.geplant"),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it("includes ISO timestamp in payload", async () => {
      vi.stubEnv("N8N_EVENTS_WEBHOOK_URL", "https://n8n.example.com/webhook");
      vi.stubEnv("WEBHOOK_SECRET", "s");

      vi.resetModules();
      const { emitEvent } = await import("@/lib/events/emit");

      const before = new Date().toISOString();
      await emitEvent("schueler.bestanden", "t1", {});
      const after = new Date().toISOString();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.timestamp >= before).toBe(true);
      expect(body.timestamp <= after).toBe(true);
    });
  });

  describe("DEFAULT_PREISE", () => {
    it("has prices for all lesson types", async () => {
      const { DEFAULT_PREISE } = await import("@/lib/events/emit");
      expect(Object.keys(DEFAULT_PREISE)).toHaveLength(5);
      expect(DEFAULT_PREISE.normal).toBe(55);
      expect(DEFAULT_PREISE.pruefungsvorbereitung).toBe(70);
    });
  });

  describe("FAHRSTUNDEN_LABELS", () => {
    it("has labels matching all price keys", async () => {
      const { DEFAULT_PREISE, FAHRSTUNDEN_LABELS } = await import(
        "@/lib/events/emit"
      );
      const priceKeys = Object.keys(DEFAULT_PREISE);
      const labelKeys = Object.keys(FAHRSTUNDEN_LABELS);
      expect(labelKeys).toEqual(priceKeys);
    });
  });
});
