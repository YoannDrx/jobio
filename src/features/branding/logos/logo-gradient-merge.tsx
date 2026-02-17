import { useId, type ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"svg"> & { size?: number };

export const LogoGradientMerge = ({
  size = 32,
  className,
  ...props
}: LogoProps) => {
  const uid = useId();
  const gId = `gm-${uid}`;
  const ratio = 200 / 56;
  return (
    <svg
      role="img"
      aria-label="Jobio"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 56"
      width={size * ratio}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="38"
        fill="currentColor"
        fontSize="32"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        JOB
      </text>
      <text
        x="82"
        y="38"
        fill={`url(#${gId})`}
        fontSize="32"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        IO
      </text>
    </svg>
  );
};
