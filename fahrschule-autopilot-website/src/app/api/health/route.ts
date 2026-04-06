import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/monitoring";

/**
 * GET /api/health — Uptime-Check Endpoint
 * Für Monitoring-Services (UptimeRobot, Better Uptime, etc.)
 */
export async function GET() {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : health.status === "degraded" ? 503 : 500;

  return NextResponse.json(health, { status: statusCode });
}
