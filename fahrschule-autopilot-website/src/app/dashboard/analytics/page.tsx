import type { Metadata } from "next";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics | Fahrschule Autopilot",
  description: "Trends, Charts und Anomalie-Erkennung für Ihre Fahrschule.",
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
