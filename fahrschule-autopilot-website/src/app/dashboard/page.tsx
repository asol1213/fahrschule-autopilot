import type { Metadata } from "next";
import DashboardApp from "@/components/dashboard/DashboardApp";

export const metadata: Metadata = {
  title: "CRM Dashboard | Fahrschule Autopilot",
  description: "Schülerverwaltung, Fahrstunden, Zahlungen und Dokumente verwalten.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardApp />;
}
