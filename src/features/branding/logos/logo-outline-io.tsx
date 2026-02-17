import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoOutlineIO = ({
  size = 32,
  className,
  ...props
}: LogoProps) => {
  return (
    <svg
      width={size * 3.57}
      height={size}
      viewBox="0 0 200 56"
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
      <text
        x="82"
        y="40"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="1.5"
        fontSize="30"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
    </svg>
  );
};
