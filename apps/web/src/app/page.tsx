"use client";

import {
  HeroSection,
  AboutSection,
  ProgramSection,
  StatsSection,
  TestimonialSection,
  CtaSection,
} from "@/features/landing";
import { scrollToElement } from "@/lib/scroll";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-white relative flex flex-col overflow-x-hidden">
      <HeroSection
        onConsultClick={scrollToElement("konsultasi")}
        onExploreClick={scrollToElement("layanan")}
      />
      <AboutSection />
      <ProgramSection />
      <StatsSection />
      <TestimonialSection />
      <CtaSection onConsultClick={scrollToElement("konsultasi")} />
    </main>
  );
}
