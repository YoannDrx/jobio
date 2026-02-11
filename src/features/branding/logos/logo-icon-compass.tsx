import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Compass — Rose des vents simplifiée.
 * Évoque : navigation, direction, trouver sa voie.
 */
export const LogoIconCompass = ({
  size = 32,
  className,
  ...props
}: LogoProps) => (
  <svg
    width={size * 3.5}
    height={size}
    viewBox="0 0 210 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Jobio"
    className={className}
    {...props}
  >
    {/* Squircle background */}
    <rect x="2" y="2" width="56" height="56" rx="14" fill="#06b6d4" />
    {/* Compass circle */}
    <circle
      cx="30"
      cy="30"
      r="18"
      stroke="white"
      strokeWidth="2"
      opacity="0.5"
    />
    {/* Compass needle — diamond pointing NE */}
    <path d="M30 14L36 30L30 46L24 30Z" fill="white" opacity="0.4" />
    <path d="M30 14L36 30L30 30L24 30Z" fill="white" />
    {/* Center dot */}
    <circle cx="30" cy="30" r="3" fill="white" />
    {/* jobio text */}
    <text
      x="70"
      y="40"
      fill="currentColor"
      fontSize="28"
      fontWeight="600"
      fontFamily="system-ui, sans-serif"
    >
      jobio
    </text>
  </svg>
);
