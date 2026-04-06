"use client";

import { Suspense } from "react";
import Link from "next/link";
import WartelisteForm from "./WartelisteForm";

export default function WartelistePage() {
  return (
    <div className="relative min-h-screen hero-gradient">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <Link
            href="/"
            className="inline-block mb-8 text-sm text-muted hover:text-foreground transition-colors"
          >
            &larr; Zurück zur Startseite
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Warteliste</span>
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Wir melden uns, sobald ein Platz frei ist
          </p>
        </div>

        {/* Form */}
        <Suspense fallback={
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20 animate-pulse">
            <div className="h-8 bg-surface-lighter rounded w-2/3 mx-auto mb-4" />
            <div className="h-4 bg-surface-lighter rounded w-1/2 mx-auto mb-8" />
            <div className="space-y-4">
              <div className="h-12 bg-surface-lighter rounded" />
              <div className="h-12 bg-surface-lighter rounded" />
              <div className="h-12 bg-surface-lighter rounded" />
            </div>
          </div>
        }>
          <WartelisteForm />
        </Suspense>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted/60 mt-10">
          Ihre Daten werden DSGVO-konform verarbeitet und nicht an Dritte
          weitergegeben.
        </p>
      </div>
    </div>
  );
}
