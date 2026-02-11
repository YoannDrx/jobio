import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoSplitClean = ({
  size = 32,
  className,
  ...props
}: LogoProps) => {
  const ratio = 220 / 64;
  return (
    <svg
      role="img"
      aria-label="Jobio"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 64"
      width={size * ratio}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#0f172a" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="28"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        J
      </text>
      <text
        x="70"
        y="40"
        fill="currentColor"
        fontSize="28"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        OB
      </text>
      <text
        x="126"
        y="40"
        fill="#06b6d4"
        fontSize="28"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
    </svg>
  );
};
