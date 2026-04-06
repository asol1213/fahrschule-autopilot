"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { faqs, CATEGORY_LABELS, type FAQCategory } from "@/data/faqs";

const categories: Array<{ key: FAQCategory | "alle"; label: string }> = [
  { key: "alle", label: "Alle" },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key: key as FAQCategory,
    label,
  })),
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left group"
      >
        <span className="text-sm sm:text-base font-medium pr-4 group-hover:text-primary-light transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPageContent() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory | "alle">("alle");

  const filtered =
    activeCategory === "alle" ? faqs : faqs.filter((f) => f.category === activeCategory);

  const counts: Record<string, number> = { alle: faqs.length };
  for (const f of faqs) {
    counts[f.category] = (counts[f.category] || 0) + 1;
  }

  return (
    <div>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-primary text-white"
                : "bg-surface border border-border text-muted hover:text-foreground hover:border-primary/30"
            }`}
          >
            {cat.label} ({counts[cat.key] || 0})
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        {filtered.length === 0 ? (
          <p className="text-center text-muted py-8">Keine FAQs in dieser Kategorie.</p>
        ) : (
          filtered.map((faq, i) => <FAQItem key={`${faq.category}-${i}`} q={faq.q} a={faq.a} />)
        )}
      </div>
    </div>
  );
}
