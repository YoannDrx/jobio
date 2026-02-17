import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoWaveUnderline = ({
  size = 32,
  className,
  ...props
}: LogoProps) => (
  <svg
    width={size * 2.75}
    height={size}
    viewBox="0 0 220 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Jobio"
    className={className}
    {...props}
  >
    <text
      x="10"
      y="45"
      fill="#06b6d4"
      fontSize="40"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      J
    </text>
    <text
      x="35"
      y="45"
      fill="currentColor"
      fontSize="40"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      obio
    </text>
    <path
      d="M 10 68 Q 30 55 50 68 Q 70 81 90 68 Q 110 55 130 68 Q 150 81 170 68"
      stroke="#06b6d4"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);
