interface MetricCardProps {
  label: string;
  value: string | number;
  helper: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <h3>{value}</h3>
      <p className="metric-helper">{helper}</p>
    </article>
  );
}
