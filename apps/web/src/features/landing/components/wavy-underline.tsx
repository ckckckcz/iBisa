export function WavyUnderline() {
  return (
    <svg
      className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-1.5 sm:h-[9px] pointer-events-none overflow-visible"
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 1 4 Q 13 0, 25 4 T 50 4 T 75 4 T 99 4"
        stroke="#FACC15"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M 1 6.5 Q 13 2.5, 25 6.5 T 50 6.5 T 75 6.5 T 99 6.5"
        stroke="#FACC15"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
