"use client";

import type { ReactNode } from "react";

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export function Label({
  text,
  required,
}: {
  text: string;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-foreground/80">
      {text}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </span>
  );
}

export function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <Label text={label} required={required} />
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function RadioPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
          : "border-border bg-surface-light text-muted hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-light/50 p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
