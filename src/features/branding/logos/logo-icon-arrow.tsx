import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

/**
 * Arrow Up — Flèche ascendante stylisée dans un squircle.
 * Évoque : croissance, progression de carrière, ambition.
 */
export const LogoIconArrow = ({
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
    {/* Stylized arrow up — geometric, modern */}
    <path d="M30 14L42 30H35V46H25V30H18L30 14Z" fill="white" />
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
