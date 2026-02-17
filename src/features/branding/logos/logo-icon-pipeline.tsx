import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Pipeline Flow — Trois cercles connectés par des lignes (kanban/pipeline).
 * Évoque : workflow, pipeline de missions, progression.
 */
export const LogoIconPipeline = ({
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
    {/* Pipeline: 3 dots connected */}
    <circle cx="16" cy="30" r="5" fill="white" />
    <line
      x1="21"
      y1="30"
      x2="25"
      y2="30"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="30" cy="30" r="5" fill="white" opacity="0.75" />
    <line
      x1="35"
      y1="30"
      x2="39"
      y2="30"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="44" cy="30" r="5" fill="white" opacity="0.5" />
    {/* Small checkmark in last circle */}
    <path
      d="M41 30l2 2 4-4"
      stroke="#06b6d4"
      strokeWidth="1.5"
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
