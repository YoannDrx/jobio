import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoCodeTag = ({ size = 32, className, ...props }: LogoProps) => {
  const ratio = 240 / 60;
  return (
    <svg
      role="img"
      aria-label="Jobio"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 60"
      width={size * ratio}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <text
        x="0"
        y="38"
        fill="#64748b"
        fontSize="26"
        fontWeight="400"
        fontFamily="'Courier New', monospace"
      >
        {"<"}
      </text>
      <text
        x="18"
        y="38"
        fill="currentColor"
        fontSize="26"
        fontWeight="700"
        fontFamily="'Courier New', monospace"
      >
        JOB
      </text>
      <text
        x="66"
        y="38"
        fill="#64748b"
        fontSize="26"
        fontWeight="400"
        fontFamily="'Courier New', monospace"
      >
        {"/>"}
      </text>
      <text
        x="100"
        y="38"
        fill="#06b6d4"
        fontSize="30"
        fontWeight="800"
        fontFamily="'Courier New', monospace"
      >
        IO
      </text>
    </svg>
  );
};
