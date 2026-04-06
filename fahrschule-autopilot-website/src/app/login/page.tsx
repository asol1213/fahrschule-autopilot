"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-Mail oder Passwort falsch."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);
    if (error) {
      setError("Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.");
      return;
    }
    setResetSent(true);
  }

  if (resetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-background)]">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--c-foreground)]">
              Passwort zurücksetzen
            </h1>
            <p className="text-[var(--c-muted)] mt-2">
              Geben Sie Ihre E-Mail-Adresse ein, um einen Reset-Link zu erhalten.
            </p>
          </div>

          {resetSent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[var(--c-accent)]/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-[var(--c-accent)]" />
                </div>
              </div>
              <p className="text-[var(--c-foreground)]">
                Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.
              </p>
              <button
                onClick={() => { setResetMode(false); setResetSent(false); }}
                className="text-[var(--c-primary)] hover:underline text-sm"
              >
                Zurück zum Login
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-[var(--c-foreground)] mb-1"
                >
                  E-Mail
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-describedby={error ? "reset-error" : undefined}
                  aria-invalid={!!error}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
                  placeholder="inhaber@fahrschule.de"
                />
              </div>

              {error && (
                <div id="reset-error" role="alert" className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 px-4 rounded-lg bg-[var(--c-primary)] text-white font-medium hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sende...
                  </span>
                ) : (
                  "Reset-Link senden"
                )}
              </button>

              <button
                type="button"
                onClick={() => { setResetMode(false); setError(""); }}
                className="w-full text-center text-[var(--c-primary)] hover:underline text-sm"
              >
                Zurück zum Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c-background)]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--c-foreground)]">
            Fahrschule Autopilot
          </h1>
          <p className="text-[var(--c-muted)] mt-2">
            CRM Dashboard Login
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--c-foreground)] mb-1"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-describedby={error ? "login-error" : undefined}
              aria-invalid={!!error}
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
              placeholder="inhaber@fahrschule.de"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--c-foreground)]"
              >
                Passwort
              </label>
              <button
                type="button"
                onClick={() => { setResetMode(true); setError(""); }}
                className="text-xs text-[var(--c-primary)] hover:underline"
              >
                Passwort vergessen?
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-describedby={error ? "login-error" : undefined}
              aria-invalid={!!error}
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
              placeholder="Passwort eingeben"
            />
          </div>

          {error && (
            <div id="login-error" role="alert" className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[var(--c-primary)] text-white font-medium hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Anmelden...
              </span>
            ) : (
              "Anmelden"
            )}
          </button>
        </form>

        <p className="text-center text-[var(--c-muted)] text-sm mt-6">
          Noch kein Konto? Kontaktieren Sie uns unter{" "}
          <a
            href="mailto:andrew@fahrschulautopilot.de"
            className="text-[var(--c-primary)] hover:underline"
          >
            andrew@fahrschulautopilot.de
          </a>
        </p>
      </div>
    </div>
  );
}
