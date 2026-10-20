import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, ElementRef, inject, InjectionToken, input, signal, viewChild } from '@angular/core';
import {
  BarController, BarElement, CategoryScale, Chart, Filler, Legend, LinearScale, LineController, LineElement, PointElement,
  Tooltip, type ChartConfiguration,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip);

/** Colors read from the theme's CSS variables, so light and dark each get their own validated palette. */
export interface ChartTokens {
  series1: string;
  series2: string;
  grid: string;
  text: string;
  surface: string;
}

export type ChartFactory = (canvas: HTMLCanvasElement, config: ChartConfiguration) => { destroy(): void };

/** How charts are created. Tests replace it, since jsdom has no canvas. */
export const CHART_FACTORY = new InjectionToken<ChartFactory>('ChartFactory', {
  providedIn: 'root',
  factory: () => (canvas, config) => new Chart(canvas, config),
});

@Component({
  selector: 'app-chart-canvas',
  template: `<div class="chart" [style.height.px]="height()"><canvas #canvas role="img" [attr.aria-label]="label()"></canvas></div>`,
  styles: `
    .chart { position: relative; width: 100%; min-width: 0; }
    .chart canvas { max-width: 100%; }
  `,
})
export class ChartCanvas {
  readonly build = input.required<(tokens: ChartTokens) => ChartConfiguration>();
  readonly label = input.required<string>();
  readonly height = input(280);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly create = inject(CHART_FACTORY);
  private readonly document = inject(DOCUMENT);
  private readonly dark = signal(false);
  private chart: { destroy(): void } | undefined;

  constructor() {
    const media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (media) {
      this.dark.set(media.matches);
      const listener = (event: MediaQueryListEvent) => this.dark.set(event.matches);
      media.addEventListener('change', listener);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', listener));
    }
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());

    // Rebuild when the config or the color scheme changes.
    effect(() => {
      const build = this.build();
      this.dark();
      this.chart?.destroy();
      this.chart = this.create(this.canvas().nativeElement, build(this.tokens()));
    });
  }

  private tokens(): ChartTokens {
    const css = getComputedStyle(this.document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    return {
      series1: v('--chart-series-1'), series2: v('--chart-series-2'), grid: v('--chart-grid'),
      text: v('--chart-text'), surface: v('--chart-surface'),
    };
  }
}
