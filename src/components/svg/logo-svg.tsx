import type { ComponentPropsWithoutRef } from "react";

type LogoSvgProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Logo Jobio — Icône "Chat Check"
 * Squircle cyan avec bulle de conversation + checkmark blanc.
 * Carré (1:1 ratio) pour être utilisable comme app icon.
 */
export const LogoSvg = ({ size = 32, ...props }: LogoSvgProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Jobio"
      {...props}
    >
      {/* Squircle background */}
      <rect x="2" y="2" width="56" height="56" rx="14" fill="#06b6d4" />
      {/* Chat bubble */}
      <path
        d="M14 18h32a2 2 0 012 2v16a2 2 0 01-2 2H26l-8 6v-6h-4a2 2 0 01-2-2V20a2 2 0 012-2z"
        fill="white"
      />
      {/* Checkmark */}
      <path
        d="M24 28l4 4 8-8"
        stroke="#06b6d4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
