"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormData } from "./types";
import { inputClass } from "./constants";
import { SectionHeading, Field } from "./shared";

interface StepPersonalDataProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

export default function StepPersonalData({
  register,
  errors,
}: StepPersonalDataProps) {
  return (
    <div className="space-y-6">
      <SectionHeading
        title="Pers\u00f6nliche Daten"
        subtitle="Erz\u00e4hlen Sie uns ein wenig \u00fcber sich."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Vorname" required error={errors.vorname?.message}>
          <input
            {...register("vorname", {
              required: "Vorname ist erforderlich",
            })}
            placeholder="Max"
            className={inputClass}
          />
        </Field>
        <Field label="Nachname" required error={errors.nachname?.message}>
          <input
            {...register("nachname", {
              required: "Nachname ist erforderlich",
            })}
            placeholder="Mustermann"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Geburtsdatum"
          required
          error={errors.geburtsdatum?.message}
        >
          <input
            type="date"
            {...register("geburtsdatum", {
              required: "Geburtsdatum ist erforderlich",
            })}
            className={inputClass}
          />
        </Field>
        <Field
          label="Telefonnummer"
          required
          error={errors.telefon?.message}
        >
          <input
            type="tel"
            {...register("telefon", {
              required: "Telefonnummer ist erforderlich",
            })}
            placeholder="+49 123 456789"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="E-Mail" required error={errors.email?.message}>
        <input
          type="email"
          {...register("email", {
            required: "E-Mail ist erforderlich",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Ung\u00fcltige E-Mail-Adresse",
            },
          })}
          placeholder="max@beispiel.de"
          className={inputClass}
        />
      </Field>

      <Field label="Stra\u00dfe + Hausnummer">
        <input
          {...register("strasse")}
          placeholder="Musterstra\u00dfe 12"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="PLZ" required error={errors.plz?.message}>
          <input
            {...register("plz", {
              required: "PLZ ist erforderlich",
              pattern: {
                value: /^\d{5}$/,
                message: "Bitte 5-stellige PLZ eingeben",
              },
            })}
            placeholder="12345"
            maxLength={5}
            className={inputClass}
          />
        </Field>
        <Field label="Ort" required error={errors.ort?.message}>
          <input
            {...register("ort", {
              required: "Ort ist erforderlich",
            })}
            placeholder="Berlin"
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}
