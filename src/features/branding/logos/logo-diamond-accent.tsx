import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoDiamondAccent = ({
  size = 32,
  className,
  ...props
}: LogoProps) => (
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
    <text
      x="10"
      y="56"
      fill="#06b6d4"
      fontSize="42"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      J
    </text>
    <rect
      x="22"
      y="12"
      width="8"
      height="8"
      rx="1"
      fill="#f59e0b"
      transform="rotate(45 26 16)"
    />
    <text
      x="42"
      y="56"
      fill="currentColor"
      fontSize="36"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      ob
    </text>
    <rect
      x="113"
      y="18"
      width="6"
      height="6"
      rx="1"
      fill="#f59e0b"
      transform="rotate(45 116 21)"
    />
    <text
      x="108"
      y="56"
      fill="currentColor"
      fontSize="36"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      i
    </text>
    <text
      x="122"
      y="56"
      fill="currentColor"
      fontSize="36"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      o
    </text>
  </svg>
);
