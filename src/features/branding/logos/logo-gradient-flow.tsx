import { useId } from "react";
import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoGradientFlow = ({
  size = 32,
  className,
  ...props
}: LogoProps) => {
  const uid = useId();
  const gradientId = `gradientFlow-${uid}`;

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
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <text
        x="10"
        y="54"
        fill={`url(#${gradientId})`}
        fontSize="48"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        J
      </text>
      <path
        d="M18 58 Q22 72 40 68 Q60 64 80 60"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <text
        x="46"
        y="54"
        fill="currentColor"
        fontSize="36"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        obio
      </text>
    </svg>
  );
};
