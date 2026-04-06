import type { Metadata } from "next";
import ReportingDashboard from "@/components/dashboard/ReportingDashboard";

export const metadata: Metadata = {
  title: "Reporting Dashboard | Fahrschule Autopilot",
  description: "KPIs, Statistiken und Automations-Report für Ihre Fahrschule.",
  robots: { index: false, follow: false },
};

export default function ReportingPage() {
  return <ReportingDashboard />;
}
