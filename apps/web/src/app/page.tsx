"use client";

import { HeroSection, AboutSection } from "@/features/landing";
import { scrollToElement } from "@/lib/scroll";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-white relative flex flex-col overflow-x-hidden">
      <HeroSection
        onConsultClick={scrollToElement("kontak")}
        onExploreClick={scrollToElement("program")}
      />
      <AboutSection />
    </main>
  );
}
