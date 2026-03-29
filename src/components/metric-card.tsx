interface MetricCardProps {
  label: string;
  value: string | number;
  helper: string;
  tone?: "sky" | "mint" | "sun" | "coral" | "violet" | "navy";
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "sky"
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <p className="metric-label">{label}</p>
      <h3>{value}</h3>
      <p className="metric-helper">{helper}</p>
    </article>
  );
}
