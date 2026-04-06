"use client";

import { motion } from "framer-motion";
import { Eye, ChevronRight } from "lucide-react";
import type { DemoConfig } from "@/data/demos";

const planColors = {
  starter: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400" },
  pro: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-400" },
  premium: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-400" },
};

export default function DemoBanner({ config }: { config: DemoConfig }) {
  const colors = planColors[config.slug];
  const otherPlans = (["starter", "pro", "premium"] as const).filter(p => p !== config.slug);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 ${colors.bg} border-b ${colors.border} backdrop-blur-xl`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className={`h-4 w-4 ${colors.text}`} />
              <span className="text-xs font-semibold text-foreground">DEMO</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              <span className="text-sm font-medium">{config.fahrschulName}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                {config.plan} — {config.preis}/Mo
              </span>
            </div>
            {/* Mobile: Show school name */}
            <div className="flex sm:hidden items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              <span className="text-xs font-medium truncate max-w-[120px]">{config.fahrschulName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted hidden sm:inline">Andere Pakete:</span>
            {otherPlans.map((p) => {
              const c = planColors[p];
              const label = p === "starter" ? "Starter" : p === "pro" ? "Pro" : "Premium";
              return (
                <a
                  key={p}
                  href={`/demo/${p}`}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border ${c.border} ${c.text} hover:${c.bg} transition-all`}
                >
                  {label}
                  <ChevronRight className="h-3 w-3" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
