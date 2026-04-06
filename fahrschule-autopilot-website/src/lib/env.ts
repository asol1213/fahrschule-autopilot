import { z } from "zod";

/**
 * Env validation — called once at startup via instrumentation.ts.
 * Fails fast with clear messages if required variables are missing.
 */

const serverSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // AI (required for chatbot/tutor/social features)
  ANTHROPIC_API_KEY: z.string().min(10).optional(),

  // Email
  RESEND_API_KEY: z.string().min(5).optional(),

  // Admin & Security
  ADMIN_API_KEY: z.string().min(16, "ADMIN_API_KEY should be at least 16 characters").optional(),
  CRON_SECRET: z.string().min(16).optional(),
  WEBHOOK_SECRET: z.string().min(16).optional(),

  // fonio.ai
  FONIO_WEBHOOK_SECRET: z.string().min(10).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(10).optional(),

  // Webhooks
  WEBHOOK_ANMELDUNG_URL: z.string().url().optional(),
  N8N_EVENTS_WEBHOOK_URL: z.string().url().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let validated = false;

export function validateEnv(): void {
  if (validated) return;

  const result = serverSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");

    console.error(
      `\n❌ Environment validation failed:\n${missing}\n\nCheck your .env.local file or Vercel environment variables.\n`
    );

    // In production, fail hard. In dev, warn only.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Environment validation failed. See logs above.");
    }
  }

  validated = true;
}
