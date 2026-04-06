import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://fahrschulautopilot.de",
  "https://www.fahrschulautopilot.de",
];

export async function middleware(request: NextRequest) {
  // CORS preflight for API routes
  if (request.method === "OPTIONS" && request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") ?? "";
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development";

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key, x-api-key, x-webhook-signature",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Session refresh for authenticated routes
  return await updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/schueler/login", "/api/:path*"],
};
