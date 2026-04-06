"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import ProblemSection from "@/components/ProblemSection";
import FeaturesSection from "@/components/FeaturesSection";
import PhoneAssistantSection from "@/components/PhoneAssistantSection";
import DemoPreview from "@/components/DemoPreview";
import HowItWorks from "@/components/HowItWorks";
import ROICalculator from "@/components/ROICalculator";
import PricingSection from "@/components/PricingSection";
import Testimonials from "@/components/Testimonials";
import CaseStudies from "@/components/CaseStudies";
import FAQ from "@/components/FAQ";
import AboutSection from "@/components/AboutSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });
import StickyCTA from "@/components/StickyCTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <ProblemSection />
        <FeaturesSection />
        <PhoneAssistantSection />
        <DemoPreview />
        <HowItWorks />
        <ROICalculator />
        <PricingSection />
        <Testimonials />
        <CaseStudies />
        <FAQ />
        <AboutSection />
        <CTASection />
      </main>
      <Footer />
      <ChatWidget />
      <StickyCTA />
    </>
  );
}
