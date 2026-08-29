"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastYear } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ForecastChartProps {
  data: ForecastYear[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Replacement Need by Year</CardTitle>
        <CardDescription>5-year forecast of projected replacement costs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(value)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                formatter={(value: number) => [formatCompactCurrency(value), "Forecast"]}
                labelFormatter={(year) => `FY${year}`}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Bar
                dataKey="amount"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
