import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoPillDuo = ({ size = 32, className, ...props }: LogoProps) => {
  const ratio = 200 / 52;
  return (
    <svg
      role="img"
      aria-label="Jobio"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 52"
      width={size * ratio}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <rect x="0" y="0" width="118" height="52" rx="26" fill="#0f172a" />
      <text
        x="59"
        y="30"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="24"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        JOB
      </text>
      <rect x="122" y="0" width="78" height="52" rx="26" fill="#06b6d4" />
      <text
        x="161"
        y="30"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="24"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
    </svg>
  );
};
