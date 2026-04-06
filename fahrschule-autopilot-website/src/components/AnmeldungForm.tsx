"use client";

import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  User,
  Car,
  Calendar,
  Send,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import type { FormData } from "./anmeldung/types";
import StepPersonalData from "./anmeldung/StepPersonalData";
import StepLicense from "./anmeldung/StepLicense";
import StepPreferences from "./anmeldung/StepPreferences";
import StepSubmit from "./anmeldung/StepSubmit";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  { label: "Persönliche Daten", icon: User },
  { label: "Führerschein", icon: Car },
  { label: "Terminwünsche", icon: Calendar },
  { label: "Absenden", icon: Send },
] as const;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const TENANT_MAP: Record<string, { id: string; name: string }> = {
  "fahrschule-mueller": { id: "29decffc-25a6-4bcb-bb36-aac5b83d1887", name: "Fahrschule Müller" },
  "fahrschule-schmidt": { id: "5b177a69-21d5-410e-b2b0-2b7d92bd2d42", name: "Fahrschule Schmidt" },
  "fahrschule-weber": { id: "f748a840-5d56-4dfa-b269-6144d595d5cd", name: "Fahrschule Weber" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AnmeldungForm() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("fahrschule") || "";
  const tenant = useMemo(() => TENANT_MAP[tenantSlug] || null, [tenantSlug]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      vorname: "",
      nachname: "",
      geburtsdatum: "",
      telefon: "",
      email: "",
      strasse: "",
      plz: "",
      ort: "",
      klasse: "",
      vorbesitz: [],
      sehtest: "",
      ersteHilfe: "",
      theoriesprache: "Deutsch",
      bevorzugteTage: [],
      bevorzugteUhrzeit: "",
      wieErfahren: "",
      nachricht: "",
      dsgvo: false,
      kontaktEinwilligung: false,
    },
  });

  /* ---- Navigation helpers ---- */

  const fieldsPerStep: (keyof FormData)[][] = useMemo(() => [
    ["vorname", "nachname", "geburtsdatum", "telefon", "email", "plz", "ort"],
    ["klasse", "sehtest", "ersteHilfe"],
    [],
    ["dsgvo", "kontaktEinwilligung"],
  ], []);

  const goNext = useCallback(async () => {
    const valid = await trigger(fieldsPerStep[step]);
    if (!valid) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  }, [step, trigger, fieldsPerStep]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // Wenn keine Fahrschule ausgewählt: Auswahl anzeigen
  if (!tenant) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h2 className="text-xl font-bold mb-2 text-center">Fahrschule wählen</h2>
        <p className="text-sm text-muted text-center mb-6">
          Bei welcher Fahrschule möchten Sie sich anmelden?
        </p>
        <div className="space-y-3">
          {Object.entries(TENANT_MAP).map(([slug, t]) => (
            <a
              key={slug}
              href={`/anmeldung?fahrschule=${slug}`}
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div>
                <div className="font-semibold text-foreground group-hover:text-primary-light transition-colors">{t.name}</div>
                <div className="text-xs text-muted mt-0.5">Online-Anmeldung starten</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary-light transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Submit ---- */

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/anmeldung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tenantId: tenant?.id }),
      });

      setIsSuccess(true);

      const end = Date.now() + 1500;
      const colors = ["#3b82f6", "#10b981", "#f59e0b"];
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } catch {
      /* silent */
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Helpers ---- */

  const completedSteps = Array.from({ length: step }, (_, i) => i);

  /* ================================================================ */
  /*  SUCCESS VIEW                                                     */
  /* ================================================================ */

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center sm:p-12"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
          Anmeldung erfolgreich!
        </h2>
        <p className="mb-8 text-muted">
          Vielen Dank für deine Anmeldung. Wir melden uns innerhalb von 24
          Stunden bei dir.
        </p>

        <div className="mx-auto max-w-md space-y-4 text-left">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Nächste Schritte
          </h3>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-light p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              1
            </span>
            <p className="text-sm text-foreground/80">
              Wir prüfen deine Anmeldung und melden uns per E-Mail oder Telefon.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-light p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              2
            </span>
            <div className="text-sm text-foreground/80">
              <p>Sehtest machen lassen.</p>
              <a
                href="https://www.fielmann.de/sehtest/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Sehtest online buchen <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-light p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              3
            </span>
            <div className="text-sm text-foreground/80">
              <p>Erste-Hilfe-Kurs absolvieren.</p>
              <a
                href="https://www.erstehilfe.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Erste-Hilfe-Kurs buchen <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-light p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              4
            </span>
            <div className="text-sm text-foreground/80">
              <p>Biometrisches Passfoto besorgen.</p>
              <a
                href="https://www.dm.de/services/fotoservice/passbilder"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Passfoto-Service finden <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ================================================================ */
  /*  FORM VIEW                                                        */
  /* ================================================================ */

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* ---------- Progress bar ---------- */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = completedSteps.includes(i);
            const isCurrent = i === step;
            return (
              <div key={i} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                      isCompleted
                        ? "border-accent bg-accent/10"
                        : isCurrent
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-border bg-surface"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    ) : (
                      <Icon
                        className={`h-5 w-5 transition-colors duration-300 ${isCurrent ? "text-primary" : "text-muted/50"}`}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`hidden text-xs font-medium transition-colors duration-300 sm:block ${
                      isCompleted
                        ? "text-accent"
                        : isCurrent
                          ? "text-primary"
                          : "text-muted/50"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-border sm:mx-4">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-primary"
                      initial={false}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Form ---------- */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {step === 0 && (
                <StepPersonalData register={register} errors={errors} />
              )}
              {step === 1 && (
                <StepLicense
                  register={register}
                  errors={errors}
                  control={control}
                />
              )}
              {step === 2 && (
                <StepPreferences
                  register={register}
                  errors={errors}
                  control={control}
                />
              )}
              {step === 3 && (
                <StepSubmit
                  register={register}
                  errors={errors}
                  isSubmitting={isSubmitting}
                  watch={watch}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* ---------- Navigation buttons ---------- */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            {step > 0 ? (
              <motion.button
                type="button"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={goPrev}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-light px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </motion.button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <motion.button
                type="button"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
              >
                Weiter
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary via-blue-500 to-accent px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Jetzt anmelden
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
