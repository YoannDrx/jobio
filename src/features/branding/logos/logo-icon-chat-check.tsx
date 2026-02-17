import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Chat Check — Bulle de conversation avec un checkmark.
 * Évoque : communication réussie, deal conclu, suivi.
 */
export const LogoIconChatCheck = ({
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
    {/* Chat bubble */}
    <path
      d="M14 18h32a2 2 0 012 2v16a2 2 0 01-2 2H26l-8 6v-6h-4a2 2 0 01-2-2V20a2 2 0 012-2z"
      fill="white"
    />
    {/* Checkmark inside bubble */}
    <path
      d="M24 28l4 4 8-8"
      stroke="#06b6d4"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
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
