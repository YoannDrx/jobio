import { cn } from "@/lib/utils";

function getScoreColor(score: number): string {
  if (score >= 80) return "text-status-success stroke-status-success";
  if (score >= 60) return "text-status-info stroke-status-info";
  if (score >= 40) return "text-status-warning stroke-status-warning";
  return "text-status-danger stroke-status-danger";
}

export function ScoreRing({
  score,
  size = 32,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = getScoreColor(score);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={colorClass}
          strokeWidth={2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "absolute font-mono text-[10px] font-bold",
          colorClass.split(" ")[0],
        )}
      >
        {score}
      </span>
    </div>
  );
}
