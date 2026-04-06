"use client";

import type { UseFormRegister, FieldErrors, Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { FormData } from "./types";
import { TAGE, UHRZEITEN, WIE_ERFAHREN, inputClass, selectClass } from "./constants";
import { SectionHeading, Label, Field } from "./shared";

interface StepPreferencesProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
}

export default function StepPreferences({
  register,
  control,
}: StepPreferencesProps) {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Terminw\u00fcnsche"
        subtitle="Wann passt es dir am besten?"
      />

      {/* Bevorzugte Tage */}
      <div>
        <Label text="Bevorzugte Tage" />
        <Controller
          control={control}
          name="bevorzugteTage"
          render={({ field }) => (
            <div className="mt-3 flex flex-wrap gap-2">
              {TAGE.map((tag) => {
                const selected = field.value.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? field.value.filter((t: string) => t !== tag)
                        : [...field.value, tag];
                      field.onChange(next);
                    }}
                    className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-light text-muted hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Bevorzugte Uhrzeit */}
      <div>
        <Label text="Bevorzugte Uhrzeit" />
        <Controller
          control={control}
          name="bevorzugteUhrzeit"
          render={({ field }) => (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {UHRZEITEN.map((u) => {
                const isSelected = field.value === u.value;
                return (
                  <motion.button
                    key={u.value}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => field.onChange(u.value)}
                    className={`rounded-xl border p-4 text-center transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-lg shadow-primary/10"
                        : "border-border bg-surface-light hover:border-primary/40 hover:bg-surface-lighter"
                    }`}
                  >
                    <span
                      className={`block text-sm font-semibold transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}
                    >
                      {u.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {u.sub}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Wie erfahren */}
      <Field label="Wie hast du von uns erfahren?">
        <div className="relative">
          <select {...register("wieErfahren")} className={selectClass}>
            <option value="">Bitte w\u00e4hlen...</option>
            {WIE_ERFAHREN.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted" />
        </div>
      </Field>

      {/* Nachricht */}
      <Field label="Nachricht (optional)">
        <textarea
          {...register("nachricht")}
          rows={4}
          placeholder="Hast du besondere W\u00fcnsche oder Fragen?"
          className={inputClass + " resize-none"}
        />
      </Field>
    </div>
  );
}
