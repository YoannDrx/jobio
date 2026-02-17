import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoAppIcon = ({ size = 32, className, ...props }: LogoProps) => (
  <svg
    width={size * 2.5}
    height={size}
    viewBox="0 0 200 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Jobio"
    className={className}
    {...props}
  >
    <rect x="4" y="8" width="64" height="64" rx="16" fill="#06b6d4" />
    <text
      x="36"
      y="50"
      textAnchor="middle"
      fill="white"
      fontSize="36"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      J
    </text>
    <text
      x="80"
      y="52"
      fill="currentColor"
      fontSize="32"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      obio
    </text>
  </svg>
);
