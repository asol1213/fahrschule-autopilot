import { NextResponse } from "next/server";
import { captureError } from "@/lib/monitoring";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "SERVER_ERROR";

const STATUS_MAP: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status: STATUS_MAP[code] }
  );
}

export function serverError(
  error: unknown,
  context: { component: string; action?: string; [key: string]: unknown }
) {
  const err = error instanceof Error ? error : new Error(String(error));
  captureError(err, context);
  console.error(`[${context.component}] ${context.action ?? "error"}:`, err.message);
  return apiError("SERVER_ERROR", "Ein interner Fehler ist aufgetreten");
}
