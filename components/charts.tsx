import type { DailyPoint, NamedCount } from "@/lib/analytics";

export function DailyChart({ points }: { points: DailyPoint[] }) {
  const width = 640;
  const height = 160;
  const gap = 8;
  const barWidth = (width - gap * (points.length + 1)) / points.length;
  const max = Math.max(1, ...points.map((point) => point.count));

  return (
    <svg className="daily-chart" viewBox={`0 0 ${width} ${height + 24}`} role="img" aria-label="Daily visits">
      {points.map((point, index) => {
        const barHeight = point.count === 0 ? 0 : Math.max(4, (point.count / max) * (height - 12));
        const x = gap + index * (barWidth + gap);
        const y = height - barHeight;
        return (
          <g key={point.day}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="3">
              <title>{`${formatDay(point.day)}: ${point.count}`}</title>
            </rect>
            {index % 2 === 0 ? (
              <text x={x + barWidth / 2} y={height + 16} textAnchor="middle">
                {formatDay(point.day)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function BarList({
  rows,
  empty,
  testIdPrefix,
}: {
  rows: NamedCount[];
  empty: string;
  testIdPrefix?: string;
}) {
  if (rows.length === 0) return <p className="muted">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.count));

  return (
    <ul className="bars">
      {rows.map((row) => (
        <li key={row.name} data-testid={testIdPrefix ? `${testIdPrefix}-${row.name}` : undefined}>
          <span>{row.name}</span>
          <span className="track" aria-hidden="true">
            <span className="fill" style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
          <span className="count">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}

function formatDay(isoDay: string): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
