interface BenchmarkRangeProps {
  ownValue: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  format: (value: number) => string;
}

export function BenchmarkRange({ ownValue, p25, median, p75, format }: BenchmarkRangeProps) {
  const points = [p25, median, p75, ownValue].filter(
    (value): value is number => value != null && Number.isFinite(value),
  );
  if (points.length < 2 || median == null) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const place = (value: number) => `${((value - min) / span) * 100}%`;

  return (
    <div className="space-y-2">
      <div className="relative h-2 rounded-full bg-muted">
        {p25 != null && p75 != null && (
          <div
            className="absolute inset-y-0 rounded-full bg-primary/20"
            style={{ left: place(p25), width: `${((p75 - p25) / span) * 100}%` }}
          />
        )}
        {median != null && (
          <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground" style={{ left: place(median) }} />
        )}
        {ownValue != null && (
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background"
            style={{ left: place(ownValue) }}
            title={`Your organization ${format(ownValue)}`}
          />
        )}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{p25 != null ? `25th ${format(p25)}` : "25th"}</span>
        <span>{median != null ? `Median ${format(median)}` : "Median"}</span>
        <span>{p75 != null ? `75th ${format(p75)}` : "75th"}</span>
      </div>
    </div>
  );
}
