import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Lightning — Éclair stylisé dans un squircle.
 * Évoque : rapidité, efficacité, énergie.
 */
export const LogoIconLightning = ({
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
    {/* Lightning bolt — geometric */}
    <path d="M34 10L20 32H28L24 50L40 26H32L34 10Z" fill="white" />
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
