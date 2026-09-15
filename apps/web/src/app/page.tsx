"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
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
  const [isVisible, setIsVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      // Always show navbar near the top of the page (< 50px)
      if (currentScrollPos < 50) {
        setIsVisible(true);
      } else {
        // Show navbar when scrolling UP, hide when scrolling DOWN
        setIsVisible(prevScrollPos > currentScrollPos);
      }
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="w-full min-h-screen bg-white relative flex flex-col pt-16 sm:pt-20">
        {/* Floating Fixed Navbar Container with Scroll Hide/Show Animation */}
        <div
          className={`fixed top-3 sm:top-4 inset-x-0 z-50 flex justify-center px-4 transition-all duration-300 ease-in-out ${
            isVisible ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-full max-w-5xl flex justify-center">
            <Navbar onConsultClick={scrollToElement("konsultasi")} />
          </div>
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
    </MotionConfig>
  );
}
