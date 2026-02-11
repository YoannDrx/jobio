import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Rocket — Fusée simplifiée/géométrique.
 * Évoque : lancement, démarrage, ambition, vitesse.
 */
export const LogoIconRocket = ({
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
    {/* Rocket body */}
    <path
      d="M30 10C30 10 38 18 38 30C38 42 30 48 30 48C30 48 22 42 22 30C22 18 30 10 30 10Z"
      fill="white"
    />
    {/* Window */}
    <circle cx="30" cy="26" r="4" fill="#06b6d4" />
    {/* Fins */}
    <path d="M22 36L16 42L22 40Z" fill="white" opacity="0.7" />
    <path d="M38 36L44 42L38 40Z" fill="white" opacity="0.7" />
    {/* Flame */}
    <path
      d="M27 48L30 54L33 48"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.5"
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
