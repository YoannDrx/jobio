import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Pulse Signal — Trois arcs concentriques émanant d'un point.
 * Évoque : broadcasting, outreach, veille active.
 */
export const LogoIconPulse = ({
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
    {/* Center dot */}
    <circle cx="22" cy="30" r="5" fill="white" />
    {/* Signal arcs */}
    <path
      d="M30 18a16 16 0 010 24"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.9"
    />
    <path
      d="M36 12a24 24 0 010 36"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M42 6a32 32 0 010 48"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.3"
    />
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
