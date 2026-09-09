export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface NavbarProps {
  readonly onConsultClick: () => void;
}

export interface HeroSectionProps {
  readonly onConsultClick: () => void;
  readonly onExploreClick: () => void;
}
