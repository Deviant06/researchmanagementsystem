import type { AnalyticsPoint } from "@/lib/types";

interface AnalyticsChartProps {
  title: string;
  caption: string;
  data: AnalyticsPoint[];
}

export function AnalyticsChart({ title, caption, data }: AnalyticsChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <article className="surface-card">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p>{caption}</p>
        </div>
      </div>

      <div className="chart-list">
        {data.length === 0 ? (
          <p className="muted-copy">No records available yet.</p>
        ) : (
          data.map((point) => (
            <div className="chart-row" key={point.label}>
              <div className="chart-meta">
                <span>{point.label}</span>
                <strong>{point.value}</strong>
              </div>
              <div className="chart-track">
                <span
                  className="chart-bar"
                  style={{
                    width: `${(point.value / max) * 100}%`,
                    background: point.color ?? "#2563eb"
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
