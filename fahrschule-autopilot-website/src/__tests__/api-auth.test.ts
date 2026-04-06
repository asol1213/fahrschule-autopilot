import { describe, it, expect } from "vitest";
import { safeCompare } from "@/lib/api-auth";

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("test-key-123", "test-key-123")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(safeCompare("test-key-123", "wrong-key-456")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(safeCompare("short", "muchlongerstring")).toBe(false);
  });

  it("returns false for empty vs non-empty", () => {
    expect(safeCompare("", "something")).toBe(false);
  });

  it("returns true for empty vs empty", () => {
    expect(safeCompare("", "")).toBe(true);
  });

  it("handles special characters", () => {
    const key = "sk-ant-api03-abc123!@#$%^&*()";
    expect(safeCompare(key, key)).toBe(true);
    expect(safeCompare(key, key + "x")).toBe(false);
  });
});
