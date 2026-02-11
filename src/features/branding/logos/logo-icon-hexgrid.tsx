import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Hex Grid — Cluster de petits hexagones (nid d'abeille).
 * Évoque : réseau, organisation, structure modulaire.
 */
export const LogoIconHexGrid = ({
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
    {/* Hexagons — honeycomb cluster */}
    {/* Center hex */}
    <path d="M30 22l6 3.5v7L30 36l-6-3.5v-7Z" fill="white" />
    {/* Top-left hex */}
    <path d="M18 15l6 3.5v7L18 29l-6-3.5v-7Z" fill="white" opacity="0.6" />
    {/* Top-right hex */}
    <path d="M42 15l6 3.5v7L42 29l-6-3.5v-7Z" fill="white" opacity="0.6" />
    {/* Bottom-left hex */}
    <path d="M18 29l6 3.5v7L18 43l-6-3.5v-7Z" fill="white" opacity="0.35" />
    {/* Bottom-right hex */}
    <path d="M42 29l6 3.5v7L42 43l-6-3.5v-7Z" fill="white" opacity="0.35" />
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
