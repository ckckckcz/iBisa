import type { IconSvgElement } from "@hugeicons/react";

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface NavbarProps {
  readonly onConsultClick: () => void;
}

export interface HeroSectionProps {
  readonly onConsultClick: () => void;
  readonly onExploreClick?: () => void;
}

export interface AboutSectionProps {
  readonly onContactClick?: () => void;
}

export interface ProgramItem {
  readonly icon: IconSvgElement;
  readonly title: string;
  readonly description: string;
}

export interface ProgramSectionProps {
  readonly programs?: readonly ProgramItem[];
}

export interface StatItem {
  readonly icon: IconSvgElement;
  readonly value: string;
  readonly label: string;
}

export interface StatsSectionProps {
  readonly stats?: readonly StatItem[];
}

export interface TestimonialItem {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
}

export interface TestimonialSectionProps {
  readonly testimonials?: readonly TestimonialItem[];
}

export interface CtaSectionProps {
  readonly onConsultClick?: () => void;
}

export interface FooterLink {
  readonly title: string;
  readonly href: string;
}

export interface FooterSocialLink {
  readonly icon: IconSvgElement;
  readonly href: string;
  readonly label: string;
}

