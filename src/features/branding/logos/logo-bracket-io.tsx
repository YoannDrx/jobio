import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

const ratio = 230 / 56;

export function LogoBracketIO({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 230 56"
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
      <text
        x="82"
        y="40"
        fill="#64748b"
        fontSize="30"
        fontWeight="400"
        fontFamily="system-ui, sans-serif"
      >
        [
      </text>
      <text
        x="96"
        y="40"
        fill="#06b6d4"
        fontSize="30"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
      <text
        x="138"
        y="40"
        fill="#64748b"
        fontSize="30"
        fontWeight="400"
        fontFamily="system-ui, sans-serif"
      >
        ]
      </text>
    </svg>
  );
}
