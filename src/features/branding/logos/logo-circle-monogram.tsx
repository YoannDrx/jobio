import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoCircleMonogram = ({
  size = 32,
  className,
  ...props
}: LogoProps) => (
  <svg
    width={size * 3.29}
    height={size}
    viewBox="0 0 230 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Jobio"
    className={className}
    {...props}
  >
    <circle cx="35" cy="35" r="30" fill="#06b6d4" />
    <text
      x="35"
      y="38"
      textAnchor="middle"
      fill="white"
      fontSize="30"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
      dominantBaseline="central"
    >
      J
    </text>
    <text
      x="82"
      y="43"
      fill="currentColor"
      fontSize="24"
      fontWeight="600"
      fontFamily="system-ui, sans-serif"
      letterSpacing="8"
    >
      OBIO
    </text>
  </svg>
);
