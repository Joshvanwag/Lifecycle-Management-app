import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ForecastPage() {
  return (
    <PlaceholderPage
      title="Forecast"
      description="Future replacement cost projections"
    >
      <p className="text-sm text-muted-foreground">
        The forecasting engine will aggregate asset-level and lump-sum cost components with
        compound inflation.
      </p>
    </PlaceholderPage>
  );
}
