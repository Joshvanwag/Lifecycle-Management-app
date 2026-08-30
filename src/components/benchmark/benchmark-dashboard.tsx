import {
  BENCHMARK_UNAVAILABLE_MESSAGE,
  INDUSTRY_TYPE_LABELS,
  type IndustryTypeCode,
} from "@/lib/benchmark/constants";
import type { OwnBenchmarkMetric } from "@/lib/benchmark/own-metrics";
import type { BenchmarkMetricPublic } from "@/lib/benchmark/constants";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BenchmarkDashboardProps {
  industryType: string;
  participating: boolean;
  ownMetrics: OwnBenchmarkMetric[];
  peerMetrics: BenchmarkMetricPublic[];
}

const DOMAIN_LABELS = {
  lifecycle_health: "Lifecycle health",
  financial: "Financial",
  planning_maturity: "Planning maturity",
} as const;

function formatOwn(metric: OwnBenchmarkMetric): string {
  if (metric.value == null || !Number.isFinite(metric.value)) return "—";
  if (metric.kind === "percentage") return `${metric.value.toFixed(1)}%`;
  if (metric.kind === "years") return `${metric.value.toFixed(1)} yrs`;
  return formatCurrency(metric.value);
}

function formatPeer(value: number | null, kind: OwnBenchmarkMetric["kind"]): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (kind === "percentage") return `${Number(value).toFixed(1)}%`;
  if (kind === "years") return `${Number(value).toFixed(1)} yrs`;
  return formatCurrency(Number(value));
}

export function BenchmarkDashboard({
  industryType,
  participating,
  ownMetrics,
  peerMetrics,
}: BenchmarkDashboardProps) {
  const industryLabel =
    INDUSTRY_TYPE_LABELS[industryType as IndustryTypeCode] ?? industryType.replace("_", " ");
  const peersByCode = new Map(peerMetrics.map((metric) => [metric.metric_code, metric]));
  const domains = ["lifecycle_health", "financial", "planning_maturity"] as const;

  if (!participating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benchmark access is off</CardTitle>
          <CardDescription>
            This organization opted out of industry benchmarking. Participation is reciprocal — turn
            it back on in Settings to see anonymized {industryLabel.toLowerCase()} results.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Your numbers are from this organization. Peer columns are anonymized {industryLabel}{" "}
        aggregates. Contributor counts are never shown.
      </p>
      {peerMetrics.length === 0 && (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">{BENCHMARK_UNAVAILABLE_MESSAGE}</p>
      )}
      {domains.map((domain) => {
        const rows = ownMetrics.filter((metric) => metric.domain === domain);
        return (
          <Card key={domain}>
            <CardHeader>
              <CardTitle>{DOMAIN_LABELS[domain]}</CardTitle>
              <CardDescription>
                Compared to the {industryLabel.toLowerCase()} industry cohort
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Yours</TableHead>
                    <TableHead className="text-right">Peer median</TableHead>
                    <TableHead className="text-right">Peer average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((metric) => {
                    const peer = peersByCode.get(metric.code);
                    return (
                      <TableRow key={metric.code}>
                        <TableCell>{metric.name}</TableCell>
                        <TableCell className="text-right">{formatOwn(metric)}</TableCell>
                        <TableCell className="text-right">
                          {peer ? formatPeer(peer.median, metric.kind) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {peer ? formatPeer(peer.average, metric.kind) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
