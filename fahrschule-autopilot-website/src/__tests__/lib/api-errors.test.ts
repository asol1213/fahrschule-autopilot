import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  metrics: { distribution: vi.fn() },
}));

import * as Sentry from "@sentry/nextjs";
import { apiError, serverError } from "@/lib/api-errors";

describe("api-errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("apiError()", () => {
    it("returns 400 for VALIDATION_ERROR", async () => {
      const res = apiError("VALIDATION_ERROR", "Invalid input");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Invalid input");
    });

    it("returns 401 for UNAUTHORIZED", async () => {
      const res = apiError("UNAUTHORIZED", "Not authenticated");
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 for FORBIDDEN", async () => {
      const res = apiError("FORBIDDEN", "Access denied");
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("returns 404 for NOT_FOUND", async () => {
      const res = apiError("NOT_FOUND", "Resource not found");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("returns 429 for RATE_LIMITED", async () => {
      const res = apiError("RATE_LIMITED", "Too many requests");
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error.code).toBe("RATE_LIMITED");
    });

    it("returns 409 for CONFLICT", async () => {
      const res = apiError("CONFLICT", "Already exists");
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe("CONFLICT");
    });

    it("returns 500 for SERVER_ERROR", async () => {
      const res = apiError("SERVER_ERROR", "Internal error");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("SERVER_ERROR");
    });

    it("includes details when provided", async () => {
      const res = apiError("VALIDATION_ERROR", "Bad field", {
        field: "email",
        reason: "invalid format",
      });
      const body = await res.json();
      expect(body.error.details).toEqual({
        field: "email",
        reason: "invalid format",
      });
    });

    it("omits details when not provided", async () => {
      const res = apiError("NOT_FOUND", "Not here");
      const body = await res.json();
      expect(body.error).not.toHaveProperty("details");
    });

    it("returns JSON content type", () => {
      const res = apiError("UNAUTHORIZED", "test");
      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("serverError()", () => {
    it("returns 500 status", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const res = serverError(new Error("boom"), { component: "test" });
      expect(res.status).toBe(500);
    });

    it("returns generic error message (no internal details leaked)", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const res = serverError(new Error("DB password exposed"), {
        component: "db",
      });
      const body = await res.json();
      expect(body.error.message).toBe("Ein interner Fehler ist aufgetreten");
      expect(body.error.message).not.toContain("DB password");
    });

    it("logs the error with component name", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      serverError(new Error("test error"), {
        component: "PaymentService",
        action: "processPayment",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PaymentService] processPayment:",
        "test error"
      );
      consoleSpy.mockRestore();
    });

    it("handles non-Error objects", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const res = serverError("string error", { component: "test" });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("SERVER_ERROR");
    });

    it("calls captureError from monitoring (which calls Sentry)", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(Sentry.captureException).mockClear();

      serverError(new Error("sentry test"), {
        component: "SentryTest",
        action: "test",
      });

      // captureError internally calls Sentry.captureException
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });
});
