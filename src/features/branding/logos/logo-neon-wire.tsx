import { useId } from "react";
import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoNeonWire = ({ size = 32, className, ...props }: LogoProps) => {
  const uid = useId();
  const glowId = `glow-${uid}`;

  return (
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
      <defs>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M 45 15 L 45 52 Q 45 65 32 65 Q 20 65 20 55"
        stroke="#06b6d4"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
      />
      <text
        x="65"
        y="50"
        fill="currentColor"
        fontSize="36"
        fontWeight="300"
        fontFamily="system-ui, sans-serif"
      >
        obio
      </text>
    </svg>
  );
};
