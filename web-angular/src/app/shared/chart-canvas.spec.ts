import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChartConfiguration } from 'chart.js';
import { CHART_FACTORY, ChartCanvas, type ChartTokens } from './chart-canvas';
import { fakeCharts } from './testing';

@Component({
  imports: [ChartCanvas],
  template: `@if (show()) { <app-chart-canvas [build]="build()" label="Trend" [height]="200" /> }`,
})
class Host {
  readonly show = signal(true);
  readonly build = signal<(tokens: ChartTokens) => ChartConfiguration>((tokens) => ({ type: 'bar', data: { labels: [tokens.series1], datasets: [] } }));
}

function setup() {
  const charts = fakeCharts();
  TestBed.configureTestingModule({ providers: [{ provide: CHART_FACTORY, useValue: charts.factory }] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { fixture, charts };
}

describe('ChartCanvas', () => {
  it('draws the chart with the theme tokens and an accessible label', () => {
    const { fixture, charts } = setup();
    expect(charts.created).toHaveLength(1);
    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas')!;
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Trend');
  });

  it('rebuilds when the config changes and destroys the old chart', () => {
    const { fixture, charts } = setup();
    fixture.componentInstance.build.set(() => ({ type: 'line', data: { datasets: [] } }));
    fixture.detectChanges();
    expect(charts.created).toHaveLength(2);
    expect(charts.created[0]!.destroyed).toBe(true);
  });

  it('destroys the chart when removed', () => {
    const { fixture, charts } = setup();
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    expect(charts.created[0]!.destroyed).toBe(true);
  });
});
