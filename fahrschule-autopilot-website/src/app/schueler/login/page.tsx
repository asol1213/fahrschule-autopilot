"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft, UserPlus, LogIn } from "lucide-react";

type Mode = "login" | "register";

export default function SchuelerLoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-Mail oder Passwort falsch."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/schueler/dashboard");
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }

      setSuccess(data.message || "Registrierung erfolgreich!");
      setMode("login");
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c-background)] px-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--c-muted)] hover:text-[var(--c-foreground)] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <div className="p-8 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--c-primary)]/10 mb-3">
              <BookOpen className="h-6 w-6 text-[var(--c-primary)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--c-foreground)]">
              Theorie-Trainer
            </h1>
            <p className="text-[var(--c-muted)] text-sm mt-1">
              {mode === "login" ? "Melde dich an" : "Erstelle dein Konto"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-[var(--c-surface-light)] p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-[var(--c-primary)] text-white shadow-sm"
                  : "text-[var(--c-muted)] hover:text-[var(--c-foreground)]"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Anmelden
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "register"
                  ? "bg-[var(--c-primary)] text-white shadow-sm"
                  : "text-[var(--c-muted)] hover:text-[var(--c-foreground)]"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Registrieren
            </button>
          </div>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Login form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-[var(--c-foreground)] mb-1">
                  E-Mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
                  placeholder="deine@email.de"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-[var(--c-foreground)] mb-1">
                  Passwort
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
                  placeholder="Passwort"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-[var(--c-primary)] text-white font-medium hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Anmelden..." : "Anmelden"}
              </button>
            </form>
          )}

          {/* Register form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-code" className="block text-sm font-medium text-[var(--c-foreground)] mb-1">
                  Einladungscode
                </label>
                <input
                  id="reg-code"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent font-mono tracking-wider uppercase"
                  placeholder="ABC123"
                  maxLength={20}
                />
                <p className="text-[var(--c-muted)] text-xs mt-1">
                  Bekommst du von deiner Fahrschule
                </p>
              </div>
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-[var(--c-foreground)] mb-1">
                  Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
                  placeholder="Max Mustermann (optional)"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-[var(--c-foreground)] mb-1">
                  E-Mail
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
                  placeholder="deine@email.de"
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-[var(--c-foreground)] mb-1">
                  Passwort
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--c-surface-light)] border border-[var(--c-border)] text-[var(--c-foreground)] placeholder-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent"
                  placeholder="Mind. 8 Zeichen"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-[var(--c-primary)] text-white font-medium hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registrieren..." : "Konto erstellen"}
              </button>
            </form>
          )}

          <p className="text-center text-[var(--c-muted)] text-xs mt-6">
            Bist du Fahrschulinhaber?{" "}
            <Link href="/login" className="text-[var(--c-primary)] hover:underline">
              Zum CRM Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
