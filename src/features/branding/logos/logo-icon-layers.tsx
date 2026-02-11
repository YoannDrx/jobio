import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Layers — Trois rectangles empilés en décalé.
 * Évoque : structure, organisation, progression.
 */
export const LogoIconLayers = ({
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
    {/* Three stacked layers */}
    <rect
      x="14"
      y="38"
      width="32"
      height="8"
      rx="2"
      fill="white"
      opacity="0.4"
    />
    <rect
      x="17"
      y="27"
      width="32"
      height="8"
      rx="2"
      fill="white"
      opacity="0.7"
    />
    <rect x="20" y="16" width="32" height="8" rx="2" fill="white" />
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
