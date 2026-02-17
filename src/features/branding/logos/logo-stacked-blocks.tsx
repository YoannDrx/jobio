import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoStackedBlocks = ({
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
    <rect x="20" y="10" width="40" height="10" rx="2" fill="#06b6d4" />
    <rect x="38" y="22" width="12" height="12" rx="2" fill="#06b6d4" />
    <rect x="36" y="36" width="12" height="12" rx="2" fill="#06b6d4" />
    <rect x="32" y="50" width="12" height="12" rx="2" fill="#06b6d4" />
    <rect x="18" y="56" width="18" height="10" rx="2" fill="#06b6d4" />
    <text
      x="70"
      y="55"
      fill="currentColor"
      fontSize="36"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
    >
      obio
    </text>
  </svg>
);
