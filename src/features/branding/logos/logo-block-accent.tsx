import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

const ratio = 200 / 56;

export function LogoBlockAccent({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 56"
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
        y="40"
        fill="currentColor"
        fontSize="30"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        JOB
      </text>
      <rect x="78" y="8" width="62" height="42" rx="8" fill="#06b6d4" />
      <text
        x="82"
        y="40"
        fill="white"
        fontSize="30"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
    </svg>
  );
}
