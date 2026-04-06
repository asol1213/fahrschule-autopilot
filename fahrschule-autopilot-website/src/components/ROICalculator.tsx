"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calculator, TrendingUp, Star, Euro, CreditCard, Globe, Phone } from "lucide-react";

type Plan = "starter" | "pro" | "premium";

const planConfig = {
  starter: { label: "Starter", price: 99 },
  pro: { label: "Pro", price: 249 },
  premium: { label: "Premium", price: 499 },
} as const;

export default function ROICalculator() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [schueler, setSchueler] = useState(50);
  const [stundenProWoche, setStundenProWoche] = useState(40);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("pro");

  const plan = planConfig[selectedPlan];

  // === STARTER SAVINGS ===
  // Termin-Erinnerungen → No-Shows verhindert
  const noShowRate = 0.08;
  const noShowsPerWeek = Math.round(stundenProWoche * noShowRate);
  const costPerNoShow = 70;
  const savedNoShows = Math.round(noShowsPerWeek * costPerNoShow * 4 * 0.35);

  // Google-Bewertungen → Mehr Neukunden
  const newReviewsMonthly = Math.round(schueler * 0.3);
  const revenuePerReview = 50;
  const reviewRevenue = newReviewsMonthly * revenuePerReview;

  const starterTotal = savedNoShows + reviewRevenue;

  // === PRO ADDITIONAL SAVINGS ===
  // Zahlungserinnerungen + AI-Chatbot + Warteliste + Onboarding
  const paymentRecovery = Math.round(schueler * 0.1 * 80);
  const proTimeSavedWeekly = Math.round(stundenProWoche * 0.08);
  const proLaborSavings = proTimeSavedWeekly * 25 * 4;
  const proExtra = paymentRecovery + proLaborSavings;

  // === PREMIUM ADDITIONAL SAVINGS ===
  // Website + SEO + Blog + Terminbuchung + CRM
  const premiumTimeSavedWeekly = Math.round(stundenProWoche * 0.06);
  const premiumLaborSavings = premiumTimeSavedWeekly * 25 * 4;
  const onlineNewStudents = Math.round(schueler * 0.04 * 120);
  const premiumExtra = premiumLaborSavings + onlineNewStudents;

  // AI Telefon-Assistent → Anrufe automatisch beantwortet
  const phoneCallsPerWeek = Math.round(schueler * 0.6);
  const minutesPerCall = 3;
  const phoneSavings = Math.round(phoneCallsPerWeek * minutesPerCall * (25 / 60) * 4);
  const phoneSavingsTotal = phoneSavings;

  // Cumulative totals
  const isProOrHigher = selectedPlan === "pro" || selectedPlan === "premium";
  const isPremium = selectedPlan === "premium";

  const planSavings =
    starterTotal +
    (isProOrHigher ? proExtra : 0) +
    (isPremium ? premiumExtra + phoneSavingsTotal : 0);

  const roi = Math.round(planSavings / plan.price);

  return (
    <section id="roi-rechner" className="py-24 sm:py-32 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-accent bg-accent/10 rounded-full px-4 py-1.5 mb-4">
            <Calculator className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
            ROI-Rechner
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Was sparen <span className="gradient-text">Sie</span> pro Monat?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Geben Sie Ihre Zahlen ein und sehen Sie sofort, wie viel Fahrschule Autopilot Ihnen bringt.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto max-w-4xl"
        >
          <div className="glass rounded-3xl p-8 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Inputs */}
              <div className="space-y-8">
                <h3 className="text-lg font-semibold mb-6">Ihre Fahrschule</h3>

                {/* Schueler Slider */}
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <label className="text-muted">Aktive Fahrschüler</label>
                    <span className="font-semibold text-primary-light">{schueler}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={schueler}
                    onChange={(e) => setSchueler(Number(e.target.value))}
                    className="w-full h-2 bg-surface-lighter rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>10</span>
                    <span>200</span>
                  </div>
                </div>

                {/* Stunden Slider */}
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <label className="text-muted">Fahrstunden pro Woche</label>
                    <span className="font-semibold text-primary-light">{stundenProWoche}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    value={stundenProWoche}
                    onChange={(e) => setStundenProWoche(Number(e.target.value))}
                    className="w-full h-2 bg-surface-lighter rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>10</span>
                    <span>120</span>
                  </div>
                </div>

                {/* Plan Selector */}
                <div className="border-t border-border pt-6">
                  <p className="text-sm text-muted mb-3">Plan wählen</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(planConfig) as Plan[]).map((key) => {
                      const p = planConfig[key];
                      const isSelected = selectedPlan === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedPlan(key)}
                          className={`rounded-lg p-3 text-center transition-all ${
                            isSelected
                              ? "bg-primary/15 border-2 border-primary/40"
                              : "bg-surface-lighter border-2 border-transparent hover:border-border"
                          }`}
                        >
                          <p className={`text-sm font-semibold ${isSelected ? "text-primary-light" : ""}`}>
                            {p.label}
                          </p>
                          <p className={`text-xs ${isSelected ? "text-primary-light/70" : "text-muted"}`}>
                            €{p.price}/Mo
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assumptions */}
                <div className="text-xs text-muted space-y-1 border-t border-border pt-4">
                  <p>Annahmen: ~8% No-Show-Rate, €70/Fahrstunde, 35% Reduktion durch Erinnerungen, €25/h Büroarbeit</p>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-5">
                <h3 className="text-lg font-semibold mb-6">
                  Ihre Ersparnis mit <span className="text-primary-light">{plan.label}</span>
                </h3>

                <div className="space-y-4">
                  {/* Row 1: No-Shows - STARTER */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <TrendingUp className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gerettete No-Shows</p>
                        <p className="text-xs text-muted">{noShowsPerWeek} No-Shows/Woche verhindert</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-400">+€{savedNoShows.toLocaleString("de-DE")}</span>
                  </div>

                  {/* Row 2: Reviews - STARTER */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                        <Star className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Neue Bewertungen</p>
                        <p className="text-xs text-muted">{newReviewsMonthly} neue Bewertungen → mehr Neukunden</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-yellow-400">+€{reviewRevenue.toLocaleString("de-DE")}</span>
                  </div>

                  {/* Row 3: Payments + Time - PRO */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isProOrHigher
                        ? "bg-surface border-border"
                        : "bg-surface/40 border-border/40 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isProOrHigher ? "bg-emerald-500/10" : "bg-emerald-500/5"}`}>
                        <CreditCard className={`h-5 w-5 ${isProOrHigher ? "text-emerald-400" : "text-emerald-400/40"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Zahlungen & Arbeitszeit</p>
                        <p className="text-xs text-muted">
                          {isProOrHigher
                            ? `Schnellere Zahlungen + ${proTimeSavedWeekly}h/Woche gespart`
                            : "Ab Pro verfügbar"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${isProOrHigher ? "text-emerald-400" : "text-emerald-400/30"}`}>
                      {isProOrHigher ? `+€${proExtra.toLocaleString("de-DE")}` : "\u2014"}
                    </span>
                  </div>

                  {/* Row 4: Online Visibility - PREMIUM */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isPremium
                        ? "bg-surface border-border"
                        : "bg-surface/40 border-border/40 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isPremium ? "bg-purple-500/10" : "bg-purple-500/5"}`}>
                        <Globe className={`h-5 w-5 ${isPremium ? "text-purple-400" : "text-purple-400/40"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Online-Sichtbarkeit</p>
                        <p className="text-xs text-muted">
                          {isPremium
                            ? `Website + SEO → ${Math.round(schueler * 0.04)} Neukunden/Monat`
                            : "Ab Premium verfügbar"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${isPremium ? "text-purple-400" : "text-purple-400/30"}`}>
                      {isPremium ? `+€${premiumExtra.toLocaleString("de-DE")}` : "\u2014"}
                    </span>
                  </div>

                  {/* Row 5: AI Phone - PREMIUM */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isPremium
                        ? "bg-surface border-border"
                        : "bg-surface/40 border-border/40 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isPremium ? "bg-cyan-500/10" : "bg-cyan-500/5"}`}>
                        <Phone className={`h-5 w-5 ${isPremium ? "text-cyan-400" : "text-cyan-400/40"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">AI Telefon-Assistent</p>
                        <p className="text-xs text-muted">
                          {isPremium
                            ? `${phoneCallsPerWeek} Anrufe/Woche automatisch beantwortet`
                            : "Ab Premium verfügbar"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${isPremium ? "text-cyan-400" : "text-cyan-400/30"}`}>
                      {isPremium ? `+€${phoneSavingsTotal.toLocaleString("de-DE")}` : "\u2014"}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Euro className="h-6 w-6 text-accent" />
                      <div>
                        <span className="text-lg font-semibold">Gesamt-Ersparnis</span>
                        <p className="text-xs text-muted">mit {plan.label} (€{plan.price}/Mo)</p>
                      </div>
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold gradient-text">
                      €{planSavings.toLocaleString("de-DE")}/Mo
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-surface-lighter">
                    <span className="text-sm text-muted">Return on Investment</span>
                    <span className="text-lg font-bold text-emerald-400">{roi}x ROI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
