"use client";

import type { UseFormRegister, FieldErrors, Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { FormData } from "./types";
import {
  KLASSEN,
  VORBESITZ_OPTIONS,
  SPRACHEN,
  selectClass,
} from "./constants";
import { SectionHeading, Label, Field, RadioPill } from "./shared";

interface StepLicenseProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
}

export default function StepLicense({
  register,
  errors,
  control,
}: StepLicenseProps) {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="F\u00fchrerschein-Details"
        subtitle="Welche Fahrerlaubnis m\u00f6chtest du erwerben?"
      />

      {/* Gew\u00fcnschte Klasse */}
      <div>
        <Label text="Gew\u00fcnschte Klasse" required />
        {errors.klasse && (
          <p className="mt-1 text-xs text-red-400">
            {errors.klasse.message}
          </p>
        )}
        <Controller
          control={control}
          name="klasse"
          rules={{ required: "Bitte w\u00e4hle eine Klasse" }}
          render={({ field }) => (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {KLASSEN.map((k) => {
                const isSelected = field.value === k.value;
                return (
                  <motion.button
                    key={k.value}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => field.onChange(k.value)}
                    className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-lg shadow-primary/10"
                        : "border-border bg-surface-light hover:border-primary/40 hover:bg-surface-lighter"
                    }`}
                  >
                    <span
                      className={`text-lg font-bold transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}
                    >
                      {k.title}
                    </span>
                    <p className="mt-0.5 text-xs text-muted">{k.desc}</p>
                    {isSelected && (
                      <motion.div
                        layoutId="klasseCheck"
                        className="absolute right-2.5 top-2.5"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Vorbesitz */}
      <div>
        <Label text="Vorbesitz einer Fahrerlaubnis" />
        <Controller
          control={control}
          name="vorbesitz"
          render={({ field }) => (
            <div className="mt-3 flex flex-wrap gap-2">
              {VORBESITZ_OPTIONS.map((v) => {
                const selected =
                  v === "Keine"
                    ? field.value.length === 0
                    : field.value.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      if (v === "Keine") {
                        field.onChange([]);
                      } else {
                        const next = field.value.includes(v)
                          ? field.value.filter((x: string) => x !== v)
                          : [...field.value, v];
                        field.onChange(next);
                      }
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-light text-muted hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Sehtest */}
      <div>
        <Label text="Sehtest vorhanden?" required />
        {errors.sehtest && (
          <p className="mt-1 text-xs text-red-400">
            {errors.sehtest.message}
          </p>
        )}
        <Controller
          control={control}
          name="sehtest"
          rules={{ required: "Bitte ausw\u00e4hlen" }}
          render={({ field }) => (
            <div className="mt-3 flex flex-wrap gap-3">
              {["Ja", "Nein", "Termin geplant"].map((opt) => (
                <RadioPill
                  key={opt}
                  label={opt}
                  selected={field.value === opt}
                  onClick={() => field.onChange(opt)}
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Erste Hilfe */}
      <div>
        <Label text="Erste-Hilfe-Kurs absolviert?" required />
        {errors.ersteHilfe && (
          <p className="mt-1 text-xs text-red-400">
            {errors.ersteHilfe.message}
          </p>
        )}
        <Controller
          control={control}
          name="ersteHilfe"
          rules={{ required: "Bitte ausw\u00e4hlen" }}
          render={({ field }) => (
            <div className="mt-3 flex flex-wrap gap-3">
              {["Ja", "Nein", "Termin geplant"].map((opt) => (
                <RadioPill
                  key={opt}
                  label={opt}
                  selected={field.value === opt}
                  onClick={() => field.onChange(opt)}
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Theoriesprache */}
      <Field label="Theorieunterricht-Sprache">
        <div className="relative">
          <select
            {...register("theoriesprache")}
            className={selectClass}
          >
            {SPRACHEN.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted" />
        </div>
      </Field>
    </div>
  );
}
