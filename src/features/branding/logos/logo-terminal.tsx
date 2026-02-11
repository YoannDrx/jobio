import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoTerminal = ({ size = 32, className, ...props }: LogoProps) => (
  <svg
    width={size * 3.43}
    height={size}
    viewBox="0 0 240 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Jobio"
    className={className}
    {...props}
  >
    <text
      x="5"
      y="45"
      fill="#94a3b8"
      fontSize="28"
      fontWeight="400"
      fontFamily="'Courier New', monospace"
    >
      {">"}
    </text>
    <text
      x="30"
      y="45"
      fill="#06b6d4"
      fontSize="32"
      fontWeight="700"
      fontFamily="'Courier New', monospace"
    >
      J
    </text>
    <text
      x="55"
      y="45"
      fill="currentColor"
      fontSize="28"
      fontWeight="400"
      fontFamily="'Courier New', monospace"
    >
      obio
    </text>
    <rect x="155" y="22" width="14" height="28" fill="#06b6d4" opacity="0.6" />
  </svg>
);
