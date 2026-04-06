import type { Metadata } from "next";
import TheorieApp from "@/components/theorie/TheorieApp";

export const metadata: Metadata = {
  title: "Theorie-Trainer | Dashboard",
};

export default function DashboardTheoriePage() {
  return (
    <div className="-m-8">
      <TheorieApp />
    </div>
  );
}
