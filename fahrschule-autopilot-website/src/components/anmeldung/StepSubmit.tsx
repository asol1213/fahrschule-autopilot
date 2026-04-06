"use client";

import type { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { ShieldCheck, Clock } from "lucide-react";
import type { FormData } from "./types";
import { UHRZEITEN } from "./constants";
import { SectionHeading, SummaryCard, SummaryRow } from "./shared";

interface StepSubmitProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  isSubmitting: boolean;
  watch: UseFormWatch<FormData>;
}

export default function StepSubmit({
  register,
  errors,
  watch,
}: StepSubmitProps) {
  const formValues = watch();

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Zusammenfassung"
        subtitle="Pr\u00fcfe deine Angaben und sende die Anmeldung ab."
      />

      {/* Summary cards */}
      <div className="space-y-4">
        <SummaryCard title="Pers\u00f6nliche Daten">
          <SummaryRow
            label="Name"
            value={`${formValues.vorname} ${formValues.nachname}`}
          />
          <SummaryRow label="Geburtsdatum" value={formValues.geburtsdatum} />
          <SummaryRow label="Telefon" value={formValues.telefon} />
          <SummaryRow label="E-Mail" value={formValues.email} />
          {formValues.strasse ? (
            <SummaryRow
              label="Adresse"
              value={`${formValues.strasse}, ${formValues.plz} ${formValues.ort}`}
            />
          ) : (
            <SummaryRow
              label="Ort"
              value={`${formValues.plz} ${formValues.ort}`}
            />
          )}
        </SummaryCard>

        <SummaryCard title="F\u00fchrerschein-Details">
          <SummaryRow label="Klasse" value={formValues.klasse} />
          <SummaryRow
            label="Vorbesitz"
            value={
              formValues.vorbesitz.length
                ? formValues.vorbesitz.join(", ")
                : "Keine"
            }
          />
          <SummaryRow label="Sehtest" value={formValues.sehtest} />
          <SummaryRow label="Erste Hilfe" value={formValues.ersteHilfe} />
          <SummaryRow label="Sprache" value={formValues.theoriesprache} />
        </SummaryCard>

        <SummaryCard title="Terminw\u00fcnsche">
          <SummaryRow
            label="Tage"
            value={
              formValues.bevorzugteTage.length
                ? formValues.bevorzugteTage.join(", ")
                : "Keine Angabe"
            }
          />
          <SummaryRow
            label="Uhrzeit"
            value={
              UHRZEITEN.find(
                (u) => u.value === formValues.bevorzugteUhrzeit,
              )?.label || "Keine Angabe"
            }
          />
          {formValues.wieErfahren && (
            <SummaryRow label="Erfahren \u00fcber" value={formValues.wieErfahren} />
          )}
          {formValues.nachricht && (
            <SummaryRow label="Nachricht" value={formValues.nachricht} />
          )}
        </SummaryCard>
      </div>

      {/* Checkboxes */}
      <div className="space-y-4 rounded-xl border border-border bg-surface-light/50 p-5">
        <label className="flex cursor-pointer items-start gap-3 group">
          <input
            type="checkbox"
            {...register("dsgvo", {
              required: "Du musst der Datenschutzerkl\u00e4rung zustimmen",
            })}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border bg-surface-light accent-primary"
          />
          <span className="text-sm text-muted transition-colors group-hover:text-foreground">
            Ich habe die{" "}
            <a
              href="/datenschutz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Datenschutzerkl\u00e4rung
            </a>{" "}
            gelesen und stimme der Verarbeitung meiner Daten zu.{" "}
            <span className="text-red-400">*</span>
          </span>
        </label>
        {errors.dsgvo && (
          <p className="-mt-2 pl-8 text-xs text-red-400">
            {errors.dsgvo.message}
          </p>
        )}

        <label className="flex cursor-pointer items-start gap-3 group">
          <input
            type="checkbox"
            {...register("kontaktEinwilligung", {
              required: "Bitte stimme der Kontaktaufnahme zu",
            })}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border bg-surface-light accent-primary"
          />
          <span className="text-sm text-muted transition-colors group-hover:text-foreground">
            Ich bin damit einverstanden, per E-Mail oder Telefon kontaktiert zu
            werden. <span className="text-red-400">*</span>
          </span>
        </label>
        {errors.kontaktEinwilligung && (
          <p className="-mt-2 pl-8 text-xs text-red-400">
            {errors.kontaktEinwilligung.message}
          </p>
        )}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-accent">DSGVO-konform</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">
            Antwort in 24h
          </span>
        </div>
      </div>
    </div>
  );
}
