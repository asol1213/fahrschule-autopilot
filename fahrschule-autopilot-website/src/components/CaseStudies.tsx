"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, Users, TrendingUp, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { caseStudies } from "@/data/case-studies";

export default function CaseStudies() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="fallstudien" className="py-24 sm:py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-accent bg-accent/10 rounded-full px-4 py-1.5 mb-4">
            Echte Ergebnisse
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Fallstudien aus der Praxis
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            So rechnet sich Fahrschule Autopilot für verschiedene Betriebsgrößen.
          </p>
        </motion.div>

        {/* Case Studies */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {caseStudies.map((cs, i) => (
            <motion.div
              key={cs.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`rounded-2xl border bg-gradient-to-br ${cs.color} p-6 sm:p-8`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold">{cs.title}</h3>
                  <p className="text-sm text-muted flex items-center gap-2 mt-1">
                    <Users className="h-3.5 w-3.5" />
                    {cs.subtitle}
                    <span className="text-muted/40">|</span>
                    <MapPin className="h-3.5 w-3.5" />
                    {cs.location}
                  </p>
                </div>
                <span className={`text-xs font-semibold rounded-full px-3 py-1.5 border border-current/20 ${cs.accentColor} bg-current/5 whitespace-nowrap`}>
                  {cs.plan}
                </span>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {cs.results.map((r) => (
                  <div key={r.label} className="rounded-xl bg-background/50 border border-border p-4">
                    <p className="text-xs text-muted uppercase tracking-wider mb-2">{r.label}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-red-400 line-through">{r.before}</span>
                      <ArrowRight className="h-3 w-3 text-muted" />
                      <span className="text-sm font-semibold text-emerald-400">{r.after}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${r.savedColor}`} />
                      <span className={`text-xs font-medium ${r.savedColor}`}>{r.saved}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Summary */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm"><span className="font-bold text-emerald-400">{cs.totalSaved}/Mo</span> <span className="text-muted">gespart</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span className="text-sm"><span className="font-bold text-purple-400">{cs.totalTime}/Woche</span> <span className="text-muted">Zeit gewonnen</span></span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted">ROI:</span>
                  <span className="text-lg font-bold gradient-text">{cs.roi}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
