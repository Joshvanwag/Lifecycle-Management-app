export interface ChartDisplaySettings {
  showNumbers: boolean;
  goalLine: number | null;
  showLegend: boolean;
}

export const defaultChartSettings: ChartDisplaySettings = {
  showNumbers: true,
  goalLine: null,
  showLegend: true,
};
