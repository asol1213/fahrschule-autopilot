import type { Metadata } from "next";
import BusinessDashboard from "@/components/admin/BusinessDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Fahrschule Autopilot",
  description: "Interne Business-Metriken: MRR, Kunden, LTV, Pipeline.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <BusinessDashboard />;
}
