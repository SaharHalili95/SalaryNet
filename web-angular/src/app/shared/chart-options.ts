import type { ChartTokens } from './chart-canvas';

/** Axis and tooltip styling shared by every chart, as in the Vue dashboard. */
export const axisDefaults = (tk: ChartTokens) => ({
  grid: { color: tk.grid, drawTicks: false },
  border: { display: false },
  ticks: { color: tk.text, padding: 8, font: { size: 12 } },
});

export const tooltipDefaults = (tk: ChartTokens, rtl: boolean) => ({
  backgroundColor: tk.surface, titleColor: tk.text, bodyColor: tk.text, borderColor: tk.grid, borderWidth: 1,
  padding: 10, boxPadding: 4, usePointStyle: true, rtl,
});
