import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Target — Cercles concentriques avec point central.
 * Évoque : précision, ciblage de missions, focus.
 */
export const LogoIconTarget = ({
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
    {/* Target rings */}
    <circle
      cx="30"
      cy="30"
      r="20"
      stroke="white"
      strokeWidth="2"
      opacity="0.4"
    />
    <circle
      cx="30"
      cy="30"
      r="13"
      stroke="white"
      strokeWidth="2"
      opacity="0.7"
    />
    <circle cx="30" cy="30" r="6" fill="white" />
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
