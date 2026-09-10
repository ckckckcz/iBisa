"use client";

import { Navbar } from "@/features/navbar";
import {
  HeroSection,
  AboutSection,
  ProgramSection,
  TestimonialSection,
  CtaSection,
} from "@/features/landing";
import { Footer } from "@/features/footer";
import { scrollToElement } from "@/lib/scroll";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-white relative flex flex-col overflow-x-hidden">
      <div className="w-full flex justify-center pt-4 sm:pt-6 bg-white">
        <Navbar onConsultClick={scrollToElement("konsultasi")} />
      </div>
      <HeroSection
        onConsultClick={scrollToElement("konsultasi")}
        onExploreClick={scrollToElement("layanan")}
      />
      <AboutSection />
      <ProgramSection />
      <TestimonialSection />
      <CtaSection onConsultClick={scrollToElement("konsultasi")} />
      <Footer />
    </main>
  );
}
