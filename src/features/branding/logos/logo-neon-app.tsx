import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoNeonApp = ({ size = 32, className, ...props }: LogoProps) => {
  const uid = useId();
  const filterId = `neon-${uid}`;
  return (
    <svg
      width={size * 3.33}
      height={size}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Jobio"
      className={className}
      {...props}
    >
      <defs>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="2" y="2" width="196" height="56" rx="14" fill="#0a0a1a" />
      <text
        x="24"
        y="36"
        fill="white"
        fontSize="28"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        JOB
      </text>
      <text
        x="110"
        y="36"
        fill="#06b6d4"
        fontSize="28"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        filter={`url(#${filterId})`}
      >
        IO
      </text>
    </svg>
  );
};
