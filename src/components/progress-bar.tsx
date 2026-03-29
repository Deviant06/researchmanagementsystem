import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  tone?: "green" | "blue" | "orange";
  label?: string;
}

export function ProgressBar({
  value,
  tone = "green",
  label
}: ProgressBarProps) {
  return (
    <div className="stack-sm">
      {label ? <div className="progress-label">{label}</div> : null}
      <div className="progress-track">
        <span
          className={cn("progress-fill", `progress-${tone}`)}
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <strong className="progress-value">{value}%</strong>
    </div>
  );
}
