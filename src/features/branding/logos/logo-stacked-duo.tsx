import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

const ratio = 130 / 80;

export function LogoStackedDuo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 130 80"
      width={size * ratio}
      height={size}
      fill="none"
      role="img"
      aria-label="Jobio"
      className={className}
      {...props}
    >
      <text
        x="0"
        y="36"
        fill="currentColor"
        fontSize="36"
        fontWeight="900"
        fontFamily="system-ui, sans-serif"
      >
        JOB
      </text>
      <text
        x="130"
        y="72"
        textAnchor="end"
        fill="#06b6d4"
        fontSize="28"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
    </svg>
  );
}
