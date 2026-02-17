import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoSlashSplit = ({
  size = 32,
  className,
  ...props
}: LogoProps) => {
  return (
    <svg
      width={size * 3.75}
      height={size}
      viewBox="0 0 210 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
      <line
        x1="86"
        y1="8"
        x2="74"
        y2="50"
        stroke="#06b6d4"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="92"
        y="40"
        fill="#06b6d4"
        fontSize="30"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
    </svg>
  );
};
