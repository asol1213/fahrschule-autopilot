"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneCall,
  Clock,
  MessageSquare,
  UserCheck,
  Volume2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Brain,
  FileText,
  ArrowRight,
  Monitor,
  Search,
  TrendingUp,
  Bell,
  Star,
  BarChart3,
  CreditCard,
  MessageCircle,
  Users,
  Database,
  PenTool,
  Globe,
  Send,
  ChevronRight,
  CalendarDays,
  Mail,
  Shield,
  Zap,
  Award,
  Timer,
  CircleDollarSign,
  ClipboardList,
  UserPlus,
  Share2,
} from "lucide-react";
import type { DemoConfig } from "@/data/demos";
import DemoBanner from "./DemoBanner";
import DemoHero from "./DemoHero";
import LockedFeature from "./LockedFeature";
import DemoPricing from "./DemoPricing";
import DemoFooter from "./DemoFooter";

/* ─────────────────────────────────────────────
   Shared helpers
   ───────────────────────────────────────────── */

function SectionHeader({
  badge,
  badgeColor,
  icon: Icon,
  title,
  highlight,
  highlightColor,
  subtitle,
}: {
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  title: string;
  highlight: string;
  highlightColor: string;
  subtitle: string;
}) {
  return (
    <div className="text-center mb-12">
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-${badgeColor}-500/20 bg-${badgeColor}-500/5 px-4 py-1.5 text-xs font-medium text-${badgeColor}-400 mb-4`}
      >
        <Icon className="h-3.5 w-3.5" />
        {badge}
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
        {title} <span className={`text-${highlightColor}-400`}>{highlight}</span>
      </h2>
      <p className="text-[#8888a0] text-sm sm:text-base max-w-xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
}

function StatBar({ stats }: { stats: { label: string; value: string; icon: React.ElementType }[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#111118]/80 px-4 py-3"
        >
          <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center shrink-0">
            <s.icon className="h-4 w-4 text-[#3b82f6]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#f0f0f5]">{s.value}</div>
            <div className="text-xs text-[#8888a0]">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WhatsAppPhone({
  messages,
  contactName,
}: {
  messages: { from: "sent" | "received"; text: string; time: string }[];
  contactName: string;
}) {
  return (
    <div className="mx-auto max-w-sm">
      {/* Phone frame */}
      <div className="rounded-[2rem] border-2 border-[#2a2a3a] bg-[#0B141A] overflow-hidden shadow-2xl shadow-black/40">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[10px] text-white/60">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2.5 rounded-sm border border-white/40 relative">
              <div className="absolute inset-[1px] right-[2px] bg-white/60 rounded-[1px]" />
            </div>
          </div>
        </div>
        {/* WhatsApp header */}
        <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#075E54] flex items-center justify-center text-white text-sm font-bold">
            {contactName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{contactName}</div>
            <div className="text-[10px] text-white/50">online</div>
          </div>
          <Phone className="h-4 w-4 text-white/50" />
        </div>
        {/* Chat body */}
        <div className="px-3 py-4 space-y-2 min-h-[280px] bg-[#0B141A]">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.15, duration: 0.3 }}
              className={`flex ${msg.from === "sent" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed relative ${
                  msg.from === "sent"
                    ? "bg-[#005C4B] text-white rounded-br-none"
                    : "bg-[#1F2C34] text-white/90 rounded-bl-none"
                }`}
              >
                {msg.text}
                <span className="block text-right text-[9px] text-white/40 mt-1">{msg.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Input bar */}
        <div className="bg-[#1F2C34] px-3 py-2 flex items-center gap-2">
          <div className="flex-1 rounded-full bg-[#2A3942] px-4 py-2 text-xs text-white/30">
            Nachricht
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center">
            <Send className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        {/* Home indicator */}
        <div className="flex justify-center py-2">
          <div className="w-28 h-1 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   1. ErinnerungenDemo
   ───────────────────────────────────────────── */

function ErinnerungenDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const messages: { from: "sent" | "received"; text: string; time: string }[] = [
    {
      from: "received",
      text: `Hallo Max! 👋 Morgen um 14:00 Uhr hast du Fahrstunde bei ${config.inhaber}. Bitte sei 5 Min vorher da. Bei Verhinderung bitte 24h vorher absagen. Deine ${config.fahrschulName} 🚗`,
      time: "18:00",
    },
    {
      from: "received",
      text: "Erinnerung: In 2 Stunden ist deine Fahrstunde! 🕐",
      time: "12:00",
    },
    {
      from: "sent",
      text: "Danke, bin pünktlich! 👍",
      time: "12:02",
    },
  ];

  return (
    <section ref={ref} id="erinnerungen" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Termin-Erinnerungen"
            badgeColor="blue"
            icon={Bell}
            title="Nie wieder"
            highlight="No-Shows"
            highlightColor="blue"
            subtitle="Automatische WhatsApp-Erinnerungen 24h und 2h vor jeder Fahrstunde. Schüler bestätigen direkt im Chat."
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <WhatsAppPhone messages={messages} contactName={config.fahrschulName} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {[
                {
                  icon: Clock,
                  title: "24h vorher — Terminerinnerung",
                  desc: "Automatische WhatsApp-Nachricht mit allen Details zum Termin.",
                },
                {
                  icon: Bell,
                  title: "2h vorher — Letzte Erinnerung",
                  desc: "Kurze Erinnerung, damit kein Schüler den Termin vergisst.",
                },
                {
                  icon: CheckCircle2,
                  title: "Bestätigung empfangen",
                  desc: "Schüler bestätigen direkt per WhatsApp. Absagen werden erkannt.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl border border-[#2a2a3a] bg-[#111118]/60"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-[#3b82f6]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#f0f0f5]">{item.title}</h3>
                    <p className="text-xs text-[#8888a0] mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <StatBar
              stats={[
                { label: "Weniger No-Shows", value: "35%", icon: TrendingUp },
                { label: "Monatlich gespart", value: "€600-1.400", icon: CircleDollarSign },
                { label: "Antwortrate", value: "92%", icon: CheckCircle2 },
              ]}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   2. BewertungenDemo
   ───────────────────────────────────────────── */

function BewertungenDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const waMessages: { from: "sent" | "received"; text: string; time: string }[] = [
    {
      from: "received",
      text: `Herzlichen Glückwunsch zur bestandenen Prüfung! 🎉🥳 Wir würden uns riesig über eine Google-Bewertung freuen: fahrschule-bewertung.de/g/${config.slug}`,
      time: "15:30",
    },
    {
      from: "sent",
      text: "Vielen Dank für alles! Bewertung ist geschrieben ⭐⭐⭐⭐⭐",
      time: "16:45",
    },
  ];

  return (
    <section ref={ref} id="bewertungen" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Google-Bewertungen"
            badgeColor="yellow"
            icon={Star}
            title="Automatisch mehr"
            highlight="5-Sterne-Bewertungen"
            highlightColor="yellow"
            subtitle="Nach bestandener Prüfung erhalten Schüler automatisch eine Bewertungsanfrage per WhatsApp."
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="order-2 lg:order-1 space-y-6"
          >
            {/* Google Review Card */}
            <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-semibold text-[#f0f0f5]">Google Bewertung</span>
              </div>

              {/* Review */}
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-bold text-sm">
                    LK
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#f0f0f5]">Laura K.</div>
                    <div className="text-xs text-[#8888a0]">vor 2 Tagen</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-[#f0f0f5]/80 leading-relaxed">
                  Super Fahrschule! {config.inhaber} ist ein toller Fahrlehrer, sehr geduldig und hat alles gut
                  erklärt. Habe auf Anhieb bestanden. Kann ich nur weiterempfehlen!
                </p>
              </div>

              {/* Smart routing info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20">
                <Shield className="h-5 w-5 text-[#10b981] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-[#10b981]">Smart Routing aktiv</div>
                  <div className="text-[11px] text-[#8888a0]">
                    Bewertung &lt; 5 Sterne? Feedback geht intern an Sie statt auf Google.
                  </div>
                </div>
              </div>
            </div>

            <StatBar
              stats={[
                { label: "Neue Bewertungen/Monat", value: "15-20", icon: Star },
                { label: "Durchschnittliches Rating", value: "4.8+", icon: Award },
                { label: "Conversion Rate", value: "68%", icon: TrendingUp },
              ]}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="order-1 lg:order-2"
          >
            <WhatsAppPhone messages={waMessages} contactName={config.fahrschulName} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   3. ReportingDemo
   ───────────────────────────────────────────── */

function ReportingDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const statCards = [
    { label: "No-Shows verhindert", value: "12", icon: Shield, color: "blue" },
    { label: "Neue Bewertungen", value: "18", icon: Star, color: "yellow" },
    { label: "Offene Zahlungen", value: "€340", icon: CreditCard, color: "green" },
    { label: "Zeitersparnis", value: "23h", icon: Timer, color: "purple" },
  ];

  const monthlyData = [
    { month: "Okt", value: 65 },
    { month: "Nov", value: 78 },
    { month: "Dez", value: 52 },
    { month: "Jan", value: 88 },
    { month: "Feb", value: 95 },
    { month: "Mär", value: 110 },
  ];
  const maxVal = Math.max(...monthlyData.map((d) => d.value));

  return (
    <section ref={ref} id="reporting" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Reporting & Analytics"
            badgeColor="orange"
            icon={BarChart3}
            title="Alles im"
            highlight="Überblick"
            highlightColor="orange"
            subtitle="Monatlicher Report per E-Mail mit allen wichtigen Kennzahlen Ihrer Fahrschule."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Dashboard mockup */}
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] overflow-hidden shadow-2xl shadow-black/30">
            {/* Header */}
            <div className="bg-[#1a1a24] px-6 py-4 border-b border-[#2a2a3a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/20 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#f0f0f5]">Monatlicher Report</div>
                  <div className="text-[11px] text-[#8888a0]">{config.fahrschulName} — März 2025</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8888a0]">
                <Mail className="h-3.5 w-3.5" />
                Per E-Mail zugestellt
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <card.icon className={`h-4 w-4 text-${card.color}-400`} />
                      <TrendingUp className="h-3 w-3 text-[#10b981]" />
                    </div>
                    <div className="text-xl font-bold text-[#f0f0f5]">{card.value}</div>
                    <div className="text-[11px] text-[#8888a0] mt-0.5">{card.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-[#f0f0f5]">Automations-Performance</span>
                  <span className="text-xs text-[#10b981] flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +23% vs. Vormonat
                  </span>
                </div>
                <div className="flex items-end gap-3 h-32">
                  {monthlyData.map((d, i) => (
                    <motion.div
                      key={d.month}
                      className="flex-1 flex flex-col items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      <motion.div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#3b82f6] to-[#3b82f6]/60"
                        initial={{ height: 0 }}
                        animate={inView ? { height: `${(d.value / maxVal) * 100}%` } : { height: 0 }}
                        transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                      />
                      <span className="text-[10px] text-[#8888a0]">{d.month}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   4. ZahlungenDemo (Pro+)
   ───────────────────────────────────────────── */

function ZahlungenDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const messages: { from: "sent" | "received"; text: string; time: string }[] = [
    {
      from: "received",
      text: `Hallo Max, für deine Fahrstunden vom 15.03. steht noch eine Rechnung über €280 offen. Bitte überweise bis zum 25.03. Fragen? Antworte einfach hier. Deine ${config.fahrschulName}`,
      time: "10:00",
    },
    {
      from: "received",
      text: "Freundliche Erinnerung: Die Rechnung über €280 ist noch offen. Bitte überweise zeitnah, damit deine nächste Fahrstunde stattfinden kann. 🙏",
      time: "10:00",
    },
    {
      from: "sent",
      text: "Ist überwiesen! 💸",
      time: "11:23",
    },
  ];

  return (
    <section ref={ref} id="zahlungen" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#10b981]/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Zahlungserinnerungen"
            badgeColor="green"
            icon={CreditCard}
            title="Schnellerer"
            highlight="Zahlungseingang"
            highlightColor="green"
            subtitle="Automatische Zahlungserinnerungen per WhatsApp. Freundlich, aber bestimmt."
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <WhatsAppPhone messages={messages} contactName={config.fahrschulName} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Timeline */}
            <div className="space-y-0">
              {[
                {
                  day: "Tag 1",
                  title: "Rechnung fällig",
                  desc: "Erste freundliche Erinnerung per WhatsApp",
                  active: true,
                },
                {
                  day: "Tag 7",
                  title: "Zweite Erinnerung",
                  desc: "Sanfte Nachfrage mit Zahlungsfrist",
                  active: true,
                },
                {
                  day: "Tag 14",
                  title: "Letzte Erinnerung",
                  desc: "Hinweis auf mögliche Terminsperre",
                  active: false,
                },
              ].map((step, i) => (
                <motion.div
                  key={step.day}
                  initial={{ opacity: 0, x: 10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.active
                          ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                          : "bg-[#23232f] text-[#8888a0] border border-[#2a2a3a]"
                      }`}
                    >
                      {step.day.split(" ")[1]}
                    </div>
                    {i < 2 && <div className="w-px h-8 bg-[#2a2a3a]" />}
                  </div>
                  <div className="pb-8">
                    <div className="text-xs text-[#8888a0] mb-0.5">{step.day}</div>
                    <div className="text-sm font-semibold text-[#f0f0f5]">{step.title}</div>
                    <div className="text-xs text-[#8888a0]">{step.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <StatBar
              stats={[
                { label: "Schnellerer Zahlungseingang", value: "30-50%", icon: Zap },
                { label: "Weniger Mahnungen", value: "70%", icon: Shield },
                { label: "Automatisiert", value: "100%", icon: CheckCircle2 },
              ]}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   5. ChatbotDemo (Pro+)
   ───────────────────────────────────────────── */

function ChatbotDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [selectedQ, setSelectedQ] = useState<number | null>(null);

  const quickReplies = [
    {
      question: "Was kostet der Führerschein?",
      answer: `Klasse B kostet bei ${config.fahrschulName} ca. €2.500-3.200, je nach Anzahl der benötigten Fahrstunden. Grundgebühr: €350, Fahrstunde (45 min): €65. Gerne erstelle ich ein individuelles Angebot!`,
    },
    {
      question: "Wie melde ich mich an?",
      answer: `Ganz einfach! Du kannst dich direkt hier auf unserer Website anmelden oder in der Fahrschule vorbeikommen. Adresse: ${config.adresse}. Bring bitte Personalausweis und ggf. Sehtest mit.`,
    },
    {
      question: "Öffnungszeiten?",
      answer: `Unsere Öffnungszeiten:\nMo-Fr: 10:00-18:00 Uhr\nSa: 10:00-13:00 Uhr\nOder ruf uns an: ${config.telefon}`,
    },
  ];

  return (
    <section ref={ref} id="chatbot" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="AI-Chatbot"
            badgeColor="purple"
            icon={MessageCircle}
            title="24/7 für Ihre"
            highlight="Interessenten da"
            highlightColor="purple"
            subtitle="Ein AI-Chatbot auf Ihrer Website beantwortet Fragen, sammelt Kontaktdaten und bucht Termine."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-lg mx-auto"
        >
          {/* Chat widget mockup */}
          <div className="rounded-2xl border border-purple-500/20 bg-[#111118] overflow-hidden shadow-2xl shadow-purple-500/5">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{config.fahrschulName}</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-xs text-white/70">Online — Antwortet sofort</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="px-4 py-5 space-y-3 min-h-[300px] bg-[#0a0a0f]">
              {/* Bot greeting */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="flex gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl rounded-bl-md px-3.5 py-2.5 text-sm text-[#f0f0f5]/90 max-w-[85%]">
                  Hallo! 👋 Ich bin der AI-Assistent von {config.fahrschulName}. Wie kann ich dir helfen?
                </div>
              </motion.div>

              {/* Quick replies */}
              {selectedQ === null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-2 pl-9"
                >
                  {quickReplies.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedQ(i)}
                      className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
                    >
                      {qr.question}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Selected conversation */}
              <AnimatePresence>
                {selectedQ !== null && (
                  <>
                    {/* User message */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <div className="bg-purple-600 rounded-xl rounded-br-md px-3.5 py-2.5 text-sm text-white max-w-[85%]">
                        {quickReplies[selectedQ].question}
                      </div>
                    </motion.div>

                    {/* Bot reply */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex gap-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl rounded-bl-md px-3.5 py-2.5 text-sm text-[#f0f0f5]/90 max-w-[85%] whitespace-pre-line">
                        {quickReplies[selectedQ].answer}
                      </div>
                    </motion.div>

                    {/* Reset */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="pl-9"
                    >
                      <button
                        onClick={() => setSelectedQ(null)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        ← Andere Frage stellen
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#2a2a3a] bg-[#111118] flex items-center gap-2">
              <div className="flex-1 rounded-full bg-[#1a1a24] border border-[#2a2a3a] px-4 py-2.5 text-xs text-[#8888a0]">
                Schreibe eine Nachricht...
              </div>
              <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center">
                <Send className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="max-w-lg mx-auto"
        >
          <StatBar
            stats={[
              { label: "Anfragen automatisiert", value: "80%", icon: Zap },
              { label: "Antwortzeit", value: "<3 Sek.", icon: Timer },
              { label: "Mehr Leads", value: "+40%", icon: TrendingUp },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   6. OnboardingDemo (Pro+)
   ───────────────────────────────────────────── */

function OnboardingDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const steps = [
    {
      icon: UserPlus,
      title: "Anmeldung eingegangen",
      desc: "Max Mustermann hat sich online angemeldet.",
      status: "done" as const,
      color: "blue",
    },
    {
      icon: MessageSquare,
      title: "Willkommens-WhatsApp gesendet",
      desc: `"Willkommen bei ${config.fahrschulName}! 🎉 Wir freuen uns auf dich..."`,
      status: "done" as const,
      color: "green",
    },
    {
      icon: ClipboardList,
      title: "Unterlagen-Checkliste gesendet",
      desc: "Sehtest ✓ · Erste-Hilfe-Kurs ✗ · Passfoto ✗ · Antrag ✗",
      status: "done" as const,
      color: "purple",
    },
    {
      icon: CalendarDays,
      title: "Erster Theorie-Termin vorgeschlagen",
      desc: "Donnerstag 20.03. um 18:00 Uhr — Theorie Block 1",
      status: "current" as const,
      color: "orange",
    },
    {
      icon: Database,
      title: "Schüler in System eingetragen",
      desc: "Alle Daten automatisch in Ihrer Verwaltung gespeichert.",
      status: "pending" as const,
      color: "cyan",
    },
  ];

  return (
    <section ref={ref} id="onboarding" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Schüler-Onboarding"
            badgeColor="cyan"
            icon={Users}
            title="Jeder neue Schüler wird"
            highlight="automatisch begrüßt"
            highlightColor="cyan"
            subtitle="Vom Eingang der Anmeldung bis zum ersten Theorie-Termin — alles automatisiert."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">
                M
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f0f0f5]">Max Mustermann</div>
                <div className="text-[11px] text-[#8888a0]">Klasse B — Anmeldung 18.03.2025</div>
              </div>
            </div>

            <div className="space-y-0">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -15 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="flex gap-4"
                >
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        step.status === "done"
                          ? "bg-[#10b981]/20 border border-[#10b981]/30"
                          : step.status === "current"
                            ? `bg-${step.color}-500/20 border-2 border-${step.color}-500/50`
                            : "bg-[#23232f] border border-[#2a2a3a]"
                      }`}
                    >
                      {step.status === "done" ? (
                        <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                      ) : (
                        <step.icon
                          className={`h-4 w-4 ${
                            step.status === "current" ? `text-${step.color}-400` : "text-[#8888a0]"
                          }`}
                        />
                      )}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={`w-px h-full min-h-[2rem] ${
                          step.status === "done" ? "bg-[#10b981]/30" : "bg-[#2a2a3a]"
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-6 pt-1">
                    <div className="text-sm font-semibold text-[#f0f0f5]">{step.title}</div>
                    <div className="text-xs text-[#8888a0] mt-0.5">{step.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <StatBar
            stats={[
              { label: "Zeitersparnis pro Schüler", value: "45 Min", icon: Timer },
              { label: "Nichts vergessen", value: "100%", icon: CheckCircle2 },
              { label: "Schnellerer Start", value: "3 Tage", icon: Zap },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   7. EmpfehlungenDemo (Pro+)
   ───────────────────────────────────────────── */

function EmpfehlungenDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const messages: { from: "sent" | "received"; text: string; time: string }[] = [
    {
      from: "received",
      text: `Hey Max! Du bist jetzt fast fertig mit deinem Führerschein 🏆 Kennst du jemanden der auch den Führerschein machen möchte? Empfiehl uns und bekomme 50€ Rabatt auf deine Restrechnung! Teile einfach diesen Link: fahrschule.de/empfehlung/max-m`,
      time: "14:00",
    },
    {
      from: "sent",
      text: "Cool, hab den Link direkt an zwei Freunde geschickt! 🙌",
      time: "14:15",
    },
  ];

  return (
    <section ref={ref} id="empfehlungen" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Empfehlungssystem"
            badgeColor="pink"
            icon={Share2}
            title="Neue Schüler durch"
            highlight="Mundpropaganda"
            highlightColor="pink"
            subtitle="Schüler empfehlen automatisch ihre Freunde — mit Tracking und Belohnungssystem."
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <WhatsAppPhone messages={messages} contactName={config.fahrschulName} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* How it works */}
            <div className="space-y-3">
              {[
                {
                  num: "1",
                  title: "Automatischer Versand",
                  desc: "Schüler erhalten nach der Prüfung einen personalisierten Empfehlungslink.",
                },
                {
                  num: "2",
                  title: "Einfaches Teilen",
                  desc: "Ein Klick — der Link wird an Freunde per WhatsApp weitergeleitet.",
                },
                {
                  num: "3",
                  title: "Belohnung & Tracking",
                  desc: "Für jede erfolgreiche Empfehlung gibt es einen Rabatt. Alles wird getrackt.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl border border-[#2a2a3a] bg-[#111118]/60"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-sm font-bold text-pink-400 shrink-0">
                    {item.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#f0f0f5]">{item.title}</h3>
                    <p className="text-xs text-[#8888a0] mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <StatBar
              stats={[
                { label: "Empfehlungen pro Monat", value: "2-5", icon: Users },
                { label: "Conversion Rate", value: "45%", icon: TrendingUp },
                { label: "Kosten pro Lead", value: "€0", icon: CircleDollarSign },
              ]}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   8. AnmeldungDemo (Pro+) — kept from original
   ───────────────────────────────────────────── */

function AnmeldungDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="anmeldung" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Online Anmeldung"
            badgeColor="blue"
            icon={FileText}
            title="Digitale Anmeldung für"
            highlight={config.fahrschulName}
            highlightColor="blue"
            subtitle="Schüler melden sich online an — die Daten landen direkt bei Ihnen."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6 sm:p-8">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-8">
              {["Persönliches", "Führerschein", "Termine", "Absenden"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? "bg-[#3b82f6] text-white"
                        : "bg-[#23232f] text-[#8888a0] border border-[#2a2a3a]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="hidden sm:inline text-xs text-[#8888a0]">{step}</span>
                  {i < 3 && <div className="w-6 sm:w-12 h-0.5 bg-[#2a2a3a] mx-1" />}
                </div>
              ))}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Vorname", placeholder: "Max" },
                { label: "Nachname", placeholder: "Mustermann" },
                { label: "E-Mail", placeholder: "max@beispiel.de" },
                { label: "Telefon", placeholder: "+49 171 1234567" },
                { label: "Geburtsdatum", placeholder: "15.06.2007" },
                { label: "Führerscheinklasse", placeholder: "Klasse B" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-xs text-[#8888a0] mb-1.5 block">{field.label} *</label>
                  <div className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] px-3.5 py-2.5 text-sm text-[#8888a0]/50">
                    {field.placeholder}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <span className="text-xs text-[#8888a0]">Schritt 1 von 4</span>
              <div className="rounded-full bg-[#3b82f6] px-6 py-2.5 text-sm font-medium text-white flex items-center gap-2">
                Weiter
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          <StatBar
            stats={[
              { label: "Digitale Anmeldungen", value: "24/7", icon: Globe },
              { label: "Zeitersparnis", value: "15 Min", icon: Timer },
              { label: "Fehlerrate", value: "0%", icon: Shield },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   9. TelefonDemo (Premium) — kept from original
   ───────────────────────────────────────────── */

function TelefonDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const features = [
    { icon: PhoneCall, title: "24/7 erreichbar", desc: "Kein Anruf geht verloren — auch nachts und am Wochenende." },
    { icon: MessageSquare, title: "Beantwortet Fragen", desc: "Preise, Öffnungszeiten, Anmeldeprozess — alles automatisch." },
    { icon: Clock, title: "Bucht Termine", desc: "Erfasst Daten und leitet sie an den Fahrlehrer weiter." },
    { icon: UserCheck, title: "Transfer an Mensch", desc: "Komplexe Anliegen werden direkt an Sie weitergeleitet." },
  ];

  const conversation = [
    { speaker: "ai", text: `Guten Tag, ${config.fahrschulName}, wie kann ich Ihnen helfen?` },
    { speaker: "caller", text: "Ich möchte mich für Klasse B anmelden." },
    { speaker: "ai", text: "Sehr gerne! Haben Sie schon einen Sehtest und Erste-Hilfe-Kurs?" },
    { speaker: "caller", text: "Sehtest ja, Erste-Hilfe noch nicht." },
    { speaker: "ai", text: "Kein Problem. Passt Ihnen Mittwoch oder Donnerstag?" },
    { speaker: "caller", text: "Donnerstag wäre super!" },
    { speaker: "ai", text: `Perfekt! ${config.inhaber} meldet sich in 24h bei Ihnen.` },
  ];

  return (
    <section ref={ref} id="telefon" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="AI Telefon-Assistent"
            badgeColor="purple"
            icon={Phone}
            title="Ihr Telefon wird"
            highlight="intelligent"
            highlightColor="purple"
            subtitle="Eine AI-Stimme beantwortet Anrufe, bucht Termine und leitet bei Bedarf weiter."
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex gap-3 p-4 rounded-xl border border-[#2a2a3a] bg-[#111118]/60"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#f0f0f5]">{f.title}</h3>
                  <p className="text-xs text-[#8888a0]">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-purple-500/20 bg-[#111118] overflow-hidden shadow-2xl shadow-purple-500/5"
          >
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-5 py-3 flex items-center gap-3 border-b border-[#2a2a3a]">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Phone className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f0f0f5]">AI-Assistent</div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-[10px] text-[#10b981]">Aktiver Anruf</span>
                </div>
              </div>
              <Volume2 className="h-4 w-4 text-[#8888a0] ml-auto" />
            </div>
            <div className="px-4 py-5 space-y-2.5 max-h-[350px] overflow-y-auto">
              {conversation.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  className={`flex ${step.speaker === "caller" ? "justify-end" : ""}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                      step.speaker === "ai"
                        ? "bg-purple-500/10 border border-purple-500/20 rounded-bl-md text-[#f0f0f5]/90"
                        : "bg-[#1a1a24] border border-[#2a2a3a] text-[#8888a0] rounded-br-md"
                    }`}
                  >
                    {step.text}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[#2a2a3a] bg-[#1a1a24]/50 flex items-center justify-center gap-4">
              {["Preise erfragt", "Termin gebucht", "Daten erfasst"].map((tag) => (
                <span key={tag} className="text-[10px] text-[#10b981] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   10. WebsiteDemo (Premium) — kept from original
   ───────────────────────────────────────────── */

function WebsiteDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="website" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Professionelle Website"
            badgeColor="cyan"
            icon={Monitor}
            title="Ihre eigene Website mit"
            highlight="Top-SEO"
            highlightColor="cyan"
            subtitle="SEO-optimiert, mobil-responsive, mit allen Automationen integriert."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] overflow-hidden shadow-2xl shadow-black/30">
            {/* Browser chrome */}
            <div className="bg-[#1a1a24] px-4 py-3 flex items-center gap-2 border-b border-[#2a2a3a]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-1.5 text-xs text-[#8888a0] flex items-center gap-2">
                <Shield className="h-3 w-3 text-[#10b981]" />
                fahrschule-{config.inhaber.split(" ")[1]?.toLowerCase() || "name"}.de
              </div>
            </div>
            {/* Mock website content */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#3b82f6]">
                    {config.fahrschulName.charAt(config.fahrschulName.indexOf(" ") + 1)}
                  </span>
                </div>
                <span className="font-bold text-[#f0f0f5]">{config.fahrschulName}</span>
              </div>
              {/* Hero placeholder */}
              <div className="rounded-xl bg-gradient-to-r from-[#3b82f6]/20 to-[#10b981]/20 p-6 mb-6">
                <div className="h-6 rounded bg-white/10 w-3/4 mb-3" />
                <div className="h-4 rounded bg-white/5 w-full mb-2" />
                <div className="h-4 rounded bg-white/5 w-5/6" />
                <div className="mt-4 w-32 h-9 rounded-full bg-[#3b82f6]/30" />
              </div>
              {/* Feature cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Search, label: "SEO-optimiert", desc: "Top-Rankings" },
                  { icon: Monitor, label: "Responsive", desc: "Alle Geräte" },
                  { icon: TrendingUp, label: "Conversion", desc: "Mehr Leads" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] p-3 text-center"
                  >
                    <item.icon className="h-5 w-5 text-[#3b82f6] mx-auto mb-1" />
                    <span className="text-xs font-medium text-[#f0f0f5] block">{item.label}</span>
                    <span className="text-[10px] text-[#8888a0]">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <StatBar
            stats={[
              { label: "Ladezeit", value: "<1.5 Sek.", icon: Zap },
              { label: "SEO-Score", value: "95+", icon: Search },
              { label: "Mobile-First", value: "100%", icon: Monitor },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   11. TheorieDemo (Premium) — kept from original
   ───────────────────────────────────────────── */

function TheorieDemo({ config: _config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const categories = [
    { name: "Gefahrenlehre", count: 518, pct: 72, color: "#ef4444" },
    { name: "Verhalten", count: 736, pct: 58, color: "#3b82f6" },
    { name: "Verkehrszeichen", count: 228, pct: 85, color: "#a855f7" },
    { name: "Technik", count: 478, pct: 41, color: "#f97316" },
  ];

  return (
    <section ref={ref} id="theorie" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#10b981]/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Theorie-Trainer"
            badgeColor="green"
            icon={Brain}
            title="2.300+ Übungsfragen mit"
            highlight="AI-Tutor"
            highlightColor="green"
            subtitle="Ihre Schüler üben online — mit AI-Tutor der jede Frage verständlich erklärt."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-xl border border-[#2a2a3a] bg-[#111118] p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4" style={{ color: cat.color }} />
                  <span className="text-sm font-semibold text-[#f0f0f5]">{cat.name}</span>
                </div>
                <div className="text-2xl font-bold text-[#f0f0f5] mb-1">{cat.count}</div>
                <div className="text-xs text-[#8888a0] mb-3">Fragen</div>
                <div className="w-full h-2 rounded-full bg-[#23232f]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${cat.pct}%` } : { width: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                  />
                </div>
                <div className="text-right text-[10px] text-[#8888a0] mt-1">{cat.pct}% gelernt</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="text-center mt-8"
          >
            <a
              href="/theorie"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
            >
              Theorie-Trainer ausprobieren
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   12. CRMDemo (Premium)
   ───────────────────────────────────────────── */

function CRMDemo({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const students = [
    {
      name: "Max Mustermann",
      status: "Praxis",
      statusColor: "blue",
      stunden: "12/20",
      termin: "Mo, 24.03. 14:00",
      zahlung: "Bezahlt",
      zahlungColor: "green",
    },
    {
      name: "Laura Klein",
      status: "Theorie",
      statusColor: "purple",
      stunden: "0/20",
      termin: "Di, 25.03. 18:00",
      zahlung: "Offen",
      zahlungColor: "yellow",
    },
    {
      name: "Tim Fischer",
      status: "Prüfung",
      statusColor: "green",
      stunden: "20/20",
      termin: "Mi, 26.03. 10:00",
      zahlung: "Bezahlt",
      zahlungColor: "green",
    },
    {
      name: "Sarah Wagner",
      status: "Praxis",
      statusColor: "blue",
      stunden: "8/20",
      termin: "Do, 27.03. 16:00",
      zahlung: "Teilweise",
      zahlungColor: "orange",
    },
    {
      name: "Jonas Braun",
      status: "Theorie",
      statusColor: "purple",
      stunden: "0/20",
      termin: "Fr, 28.03. 18:00",
      zahlung: "Bezahlt",
      zahlungColor: "green",
    },
  ];

  return (
    <section ref={ref} id="crm" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="CRM & Datenbank"
            badgeColor="orange"
            icon={Database}
            title="Komplette"
            highlight="Schülerverwaltung"
            highlightColor="orange"
            subtitle="Alle Schüler, Termine, Zahlungen und Fortschritte an einem Ort."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] overflow-hidden shadow-2xl shadow-black/30">
            {/* Header */}
            <div className="bg-[#1a1a24] px-6 py-4 border-b border-[#2a2a3a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Database className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#f0f0f5]">Schülerverwaltung</div>
                  <div className="text-[11px] text-[#8888a0]">{config.fahrschulName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#23232f] border border-[#2a2a3a] px-3 py-1.5 text-xs text-[#8888a0] flex items-center gap-1.5">
                  <Search className="h-3 w-3" />
                  Suchen...
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a3a]">
                    {["Name", "Status", "Fahrstunden", "Nächster Termin", "Zahlung"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold text-[#8888a0] uppercase tracking-wider px-5 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <motion.tr
                      key={s.name}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="border-b border-[#2a2a3a]/50 hover:bg-[#1a1a24]/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[10px] font-bold text-[#3b82f6]">
                            {s.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span className="text-sm font-medium text-[#f0f0f5]">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-${s.statusColor}-500/10 text-${s.statusColor}-400 border border-${s.statusColor}-500/20`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[#23232f]">
                            <div
                              className="h-full rounded-full bg-[#3b82f6]"
                              style={{
                                width: `${(parseInt(s.stunden.split("/")[0]) / parseInt(s.stunden.split("/")[1])) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#8888a0]">{s.stunden}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#8888a0]">{s.termin}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-${s.zahlungColor}-500/10 text-${s.zahlungColor}-400`}
                        >
                          {s.zahlung}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-[#2a2a3a] bg-[#1a1a24]/50 flex items-center justify-between">
              <span className="text-[11px] text-[#8888a0]">5 von 47 Schülern</span>
              <div className="flex items-center gap-1">
                <div className="w-7 h-7 rounded-md bg-[#3b82f6]/20 flex items-center justify-center text-[11px] text-[#3b82f6] font-bold">
                  1
                </div>
                <div className="w-7 h-7 rounded-md bg-[#23232f] flex items-center justify-center text-[11px] text-[#8888a0]">
                  2
                </div>
                <div className="w-7 h-7 rounded-md bg-[#23232f] flex items-center justify-center text-[11px] text-[#8888a0]">
                  3
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   13. BlogDemo (Premium)
   ───────────────────────────────────────────── */

function BlogDemo({ config: _config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const posts = [
    {
      title: "Führerschein mit 17: Alles was du wissen musst",
      excerpt: "Begleitetes Fahren ab 17 — Voraussetzungen, Ablauf und Tipps für Eltern und Fahrschüler.",
      date: "15. März 2025",
      readTime: "5 Min",
      category: "Ratgeber",
      categoryColor: "blue",
      gradient: "from-[#3b82f6]/20 to-[#3b82f6]/5",
    },
    {
      title: "10 Tipps für die Theorieprüfung 2025",
      excerpt: "So bestehst du die Theorieprüfung beim ersten Mal — bewährte Lernstrategien und Tricks.",
      date: "8. März 2025",
      readTime: "7 Min",
      category: "Tipps",
      categoryColor: "green",
      gradient: "from-[#10b981]/20 to-[#10b981]/5",
    },
    {
      title: "Neue Führerscheinreform: Was ändert sich?",
      excerpt: "Die wichtigsten Änderungen der EU-Führerscheinrichtlinie im Überblick — was bedeutet das für Sie?",
      date: "1. März 2025",
      readTime: "4 Min",
      category: "News",
      categoryColor: "purple",
      gradient: "from-purple-500/20 to-purple-500/5",
    },
  ];

  return (
    <section ref={ref} id="blog" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            badge="Blog-Erstellung"
            badgeColor="cyan"
            icon={PenTool}
            title="SEO-Blog für"
            highlight="mehr Sichtbarkeit"
            highlightColor="cyan"
            subtitle="Regelmäßige Blog-Artikel zu Führerschein-Themen — automatisch erstellt und SEO-optimiert."
          />
        </motion.div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post, i) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="rounded-2xl border border-[#2a2a3a] bg-[#111118] overflow-hidden group hover:border-[#3b82f6]/30 transition-all duration-300"
            >
              {/* Image placeholder */}
              <div className={`h-32 bg-gradient-to-br ${post.gradient} flex items-center justify-center`}>
                <PenTool className="h-8 w-8 text-[#8888a0]/30" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-${post.categoryColor}-500/10 text-${post.categoryColor}-400 border border-${post.categoryColor}-500/20`}
                  >
                    {post.category}
                  </span>
                  <span className="text-[10px] text-[#8888a0]">{post.readTime} Lesezeit</span>
                </div>
                <h3 className="text-sm font-bold text-[#f0f0f5] mb-2 group-hover:text-[#3b82f6] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-[#8888a0] leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8888a0]">{post.date}</span>
                  <span className="text-xs text-[#3b82f6] flex items-center gap-1 group-hover:gap-2 transition-all">
                    Lesen
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <StatBar
            stats={[
              { label: "Artikel pro Monat", value: "4-8", icon: PenTool },
              { label: "Organischer Traffic", value: "+120%", icon: TrendingUp },
              { label: "Automatisch erstellt", value: "100%", icon: Sparkles },
            ]}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA Section
   ───────────────────────────────────────────── */

function DemoCTA({ config: _config }: { config: DemoConfig }) {
  return (
    <section id="kontakt" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#10b981] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-[#f0f0f5]">
            Überzeugt? Lassen Sie uns starten.
          </h2>
          <p className="text-[#8888a0] mb-8 max-w-md mx-auto">
            Kostenloses 10-Minuten Gespräch. Wir zeigen Ihnen die konkreten Zahlen für Ihre Fahrschule.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#3b82f6] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#2563eb] hover:shadow-lg hover:shadow-[#3b82f6]/25 transition-all"
            >
              Kostenlose Demo buchen
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/491714774026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-7 py-3.5 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/20 transition-all"
            >
              Per WhatsApp schreiben
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Main Demo Page
   ───────────────────────────────────────────── */

export default function DemoPage({ config }: { config: DemoConfig }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5]">
      <DemoBanner config={config} />

      <DemoHero config={config} />

      {/* ── Always active (Starter+) ── */}
      <ErinnerungenDemo config={config} />
      <BewertungenDemo config={config} />
      <ReportingDemo config={config} />

      {/* ── Pro+ features ── */}
      <LockedFeature isLocked={!config.features.zahlungen} requiredPlan="Pro">
        <ZahlungenDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.chatbot} requiredPlan="Pro">
        <ChatbotDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.onboarding} requiredPlan="Pro">
        <OnboardingDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.empfehlungen} requiredPlan="Pro">
        <EmpfehlungenDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.anmeldung} requiredPlan="Pro">
        <AnmeldungDemo config={config} />
      </LockedFeature>

      {/* ── Premium features ── */}
      <LockedFeature isLocked={!config.features.telefon} requiredPlan="Premium">
        <TelefonDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.website} requiredPlan="Premium">
        <WebsiteDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.theorie} requiredPlan="Premium">
        <TheorieDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.crm} requiredPlan="Premium">
        <CRMDemo config={config} />
      </LockedFeature>

      <LockedFeature isLocked={!config.features.blog} requiredPlan="Premium">
        <BlogDemo config={config} />
      </LockedFeature>

      <DemoPricing currentPlan={config.slug} />

      <DemoCTA config={config} />

      <DemoFooter config={config} />
    </div>
  );
}
