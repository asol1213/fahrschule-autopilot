import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, MapPin, GraduationCap, Briefcase, Code2, Shield, Zap, Building2 } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Über den Gründer | Fahrschule Autopilot",
  description: "Andrew Arbo — Gründer von Fahrschule Autopilot. Ex-Deloitte Consultant, Data Architect & Automation-Experte.",
};

const experience = [
  {
    role: "Gründer & Automation Architect",
    company: "Fahrschule Autopilot",
    period: "2025 — heute",
    location: "Dubai, UAE",
    description: "Entwicklung einer AI-gestützten Automationsplattform speziell für deutsche Fahrschulen. End-to-End Automatisierung von No-Show-Management, Google-Bewertungen, Zahlungserinnerungen und Wartelisten.",
    highlights: [
      "5 vollautomatisierte Workflows für Fahrschulen entwickelt",
      "Self-hosted Infrastruktur mit 99.9% Uptime",
      "DSGVO-konforme Datenhaltung auf deutschen Servern",
    ],
    current: true,
  },
  {
    role: "EPM Architect & Data Strategist",
    company: "Arbo Data Strategy",
    period: "Jan 2025 — heute",
    location: "Remote",
    description: "Freelance-Beratung für Enterprise-Kunden im Bereich Datenautomatisierung und Business Intelligence.",
    highlights: [
      "Reporting-Zyklen von 5 Tagen auf Echtzeit komprimiert",
      "Automatisierte Validierung für >€20M Budgetportfolio",
      "Single Source of Truth via Snowflake/dbt Architektur",
    ],
    current: true,
  },
  {
    role: "Senior Consultant — Enterprise Technology",
    company: "Deloitte Consulting",
    period: "Jun 2023 — Dez 2024",
    location: "München / Remote",
    description: "Strategische Technologieberatung für internationale Enterprise-Kunden in den Bereichen Finance und Technologie.",
    highlights: [
      "High-Velocity Data Pipelines zwischen SAP S/4 HANA und EPM Clouds",
      "Reporting-Latenz von Tagen auf Stunden reduziert",
      "Portfolio internationaler Accounts (EMEA/APAC) gemanagt",
    ],
    current: false,
  },
  {
    role: "Consultant — Risk Advisory & SAP Audit",
    company: "Deloitte Advisory",
    period: "Nov 2021 — Mär 2023",
    location: "Nürnberg",
    description: "Prozessoptimierung und Datenautomatisierung in regulierten Finanzumgebungen.",
    highlights: [
      "ETL-Automatisierung für SAP ERP Interfaces (FI, CO, MM)",
      "Audit-Grade Datenintegrität sichergestellt",
      "GRC-Playbooks und technische Dokumentation erstellt",
    ],
    current: false,
  },
];

const skills = [
  { category: "Automation & AI", items: ["n8n", "Python", "Docker", "Workflow-Automation", "API-Integration", "WhatsApp Business API"] },
  { category: "Data Engineering", items: ["PostgreSQL", "Snowflake", "dbt", "Azure Data Factory", "ETL Pipelines", "Redis"] },
  { category: "Business Intelligence", items: ["Power BI", "Advanced DAX", "SQL", "Anaplan", "OneStream", "Excel/VBA"] },
  { category: "Infrastructure", items: ["Linux/Raspberry Pi", "Cloudflare", "Nginx", "WireGuard VPN", "Pi-hole", "Git"] },
];

export default function Gruender() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start mb-20">
          <div className="md:col-span-1">
            <div className="w-full max-w-[280px] mx-auto md:mx-0 rounded-2xl overflow-hidden border-2 border-border shadow-2xl shadow-black/30">
              <Image
                src="/andrew-portrait.jpeg"
                alt="Andrew Arbo"
                width={560}
                height={420}
                quality={100}
                unoptimized
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              Gründer & Automation Architect
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">Andrew Arbo</h1>
            <p className="text-lg text-muted mb-6 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/60" />
              Dubai, UAE — Remote für deutsche Fahrschulen
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Ex-Deloitte Consultant und Data Architect mit 5+ Jahren Erfahrung in
              Enterprise-Technologie und Prozessautomatisierung. Ich habe Fahrschule Autopilot
              gegründet, weil ich gesehen habe, wie viel Zeit Fahrschulen durch manuelle
              Prozesse verlieren — und wie einfach sich das mit intelligenter Automation lösen lässt.
            </p>
            <p className="text-muted leading-relaxed mb-8">
              Mein Ansatz: Keine generische Software, sondern maßgeschneiderte Automation,
              die ich persönlich für jede Fahrschule aufsetze. Sie bekommen einen direkten
              Ansprechpartner — kein Callcenter, kein Ticket-System.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://calendly.com/andrewarbohq/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Gespräch buchen
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="mailto:andrew@fahrschulautopilot.de"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-muted hover:text-foreground hover:border-muted transition-all"
              >
                <Mail className="h-4 w-4" />
                andrew@fahrschulautopilot.de
              </a>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {[
            { icon: Building2, label: "Ex-Deloitte", sub: "Senior Consultant" },
            { icon: Briefcase, label: "5+ Jahre", sub: "Enterprise-Erfahrung" },
            { icon: GraduationCap, label: "B.Sc.", sub: "Industrial Engineering" },
            { icon: Zap, label: "80%+", sub: "Weniger manueller Aufwand" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-surface p-5 text-center">
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold">{stat.label}</p>
              <p className="text-xs text-muted">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Experience */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Berufserfahrung</h2>
          </div>
          <div className="space-y-8">
            {experience.map((exp) => (
              <div key={exp.role + exp.company} className="relative rounded-xl border border-border bg-surface p-6 sm:p-8">
                {exp.current && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-2.5 py-1">
                    Aktuell
                  </span>
                )}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{exp.role}</h3>
                    <p className="text-primary-light font-medium">{exp.company}</p>
                  </div>
                  <div className="text-sm text-muted mt-1 sm:mt-0 sm:text-right shrink-0">
                    <p>{exp.period}</p>
                    <p>{exp.location}</p>
                  </div>
                </div>
                <p className="text-sm text-muted mb-4">{exp.description}</p>
                <ul className="space-y-1.5">
                  {exp.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-muted">
                      <span className="text-accent mt-1 shrink-0">&#x2713;</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Ausbildung</h2>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">B.Sc. Industrial Engineering</h3>
                <p className="text-primary-light font-medium">FAU Erlangen-Nürnberg</p>
              </div>
              <p className="text-sm text-muted mt-1 sm:mt-0">Okt 2016 — Okt 2021</p>
            </div>
            <p className="text-sm text-muted mb-3">Schwerpunkt: Business Processes & Information Systems</p>
            <div className="flex items-start gap-2 text-sm text-muted">
              <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>Abschlussarbeit: Data-Driven Process Optimization & Transfer Learning — <strong className="text-foreground">Note 1.0 (Ausgezeichnet)</strong></span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Tech Stack</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skills.map((group) => (
              <div key={group.category} className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold mb-3">{group.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="text-xs text-muted rounded-full border border-border px-3 py-1.5 bg-surface-light"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-6">Sprachen</h2>
          <div className="flex gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 flex-1 text-center">
              <p className="text-2xl mb-1">🇩🇪</p>
              <p className="font-semibold text-sm">Deutsch</p>
              <p className="text-xs text-muted">Muttersprache</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5 flex-1 text-center">
              <p className="text-2xl mb-1">🇬🇧</p>
              <p className="font-semibold text-sm">Englisch</p>
              <p className="text-xs text-muted">Fließend (C1)</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Bereit, Ihre Fahrschule zu automatisieren?
          </h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            Lassen Sie uns in einem kostenlosen 30-Minuten-Gespräch besprechen,
            wie Autopilot Ihnen Zeit und Geld spart.
          </p>
          <a
            href="https://calendly.com/andrewarbohq/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            Kostenloses Gespräch buchen
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
