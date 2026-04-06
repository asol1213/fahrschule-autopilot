import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use a dummy URL during build/SSR if not configured
  // The client will fail on actual API calls, but won't crash during prerender
  const safeUrl = url && url.startsWith("http") ? url : "https://placeholder.supabase.co";
  const safeKey = key && key.length > 20 ? key : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

  return createBrowserClient(safeUrl, safeKey);
}
