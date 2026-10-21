import { Component, computed, inject, PendingTasks, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { DashboardSummary } from '@shared/api/types';
import { formatMoney, formatMoneyCompact, formatMonthShort, formatPeriod } from '@shared/format/format';
import { localizeTerm } from '@shared/i18n/dataGlossary';
import type { ChartConfiguration } from 'chart.js';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { AuthService } from '../../core/auth.service';
import { MoneyPipe, PeriodPipe, TermPipe } from '../../core/format.pipes';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ChartCanvas, type ChartTokens } from '../../shared/chart-canvas';
import { axisDefaults, tooltipDefaults } from '../../shared/chart-options';
import { StatTile } from '../../shared/stat-tile';

@Component({
  selector: 'app-dashboard',
  imports: [MatButtonModule, MatIconModule, ChartCanvas, StatTile, TranslatePipe, MoneyPipe, PeriodPipe, TermPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly pending = inject(PendingTasks);
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(LocaleService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly showTrendTable = signal(false);
  protected readonly showDeptTable = signal(false);

  protected readonly deductionShare = computed(() => {
    const p = this.summary()?.latestPeriod;
    return p ? ((p.deductionsTotal / p.grossTotal) * 100).toFixed(1) : null;
  });

  protected readonly typeTotal = computed(() => this.summary()?.employmentTypes.reduce((sum, t) => sum + t.count, 0) || 1);

  /** Gross and net per month. Reads data and language here, so the chart rebuilds when either changes. */
  protected readonly trendChart = computed(() => {
    const trend = this.summary()?.monthlyTrend ?? [];
    const locale = this.i18n.locale();
    const rtl = this.i18n.isRtl();
    const gross = this.i18n.t('dashboard.gross');
    const net = this.i18n.t('dashboard.net');
    return (tk: ChartTokens): ChartConfiguration => {
      const series = (label: string, color: string, data: number[]) => ({
        label, data, borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.3,
        pointRadius: 4, pointHoverRadius: 6, pointBorderColor: tk.surface, pointBorderWidth: 2,
      });
      return {
        type: 'line',
        data: {
          labels: trend.map((p) => formatMonthShort(p.year, p.month, locale)),
          datasets: [series(gross, tk.series1, trend.map((p) => p.grossTotal)), series(net, tk.series2, trend.map((p) => p.netTotal))],
        },
        options: {
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', align: 'end', rtl, labels: { color: tk.text, usePointStyle: true, boxWidth: 8, boxHeight: 8 } },
            tooltip: { ...tooltipDefaults(tk, rtl), callbacks: { label: (c) => ` ${c.dataset.label}: ${formatMoney(c.parsed.y ?? 0, locale)}` } },
          },
          scales: {
            x: { ...axisDefaults(tk), grid: { display: false } },
            // Totals move by a few percent month to month; a zero baseline would flatten that into straight lines.
            y: {
              ...axisDefaults(tk), position: rtl ? 'right' : 'left', grace: '10%',
              ticks: { ...axisDefaults(tk).ticks, callback: (v) => formatMoneyCompact(Number(v), locale) },
            },
          },
        },
      };
    };
  });

  protected readonly departmentChart = computed(() => {
    const rows = this.summary()?.payrollByDepartment ?? [];
    const locale = this.i18n.locale();
    const rtl = this.i18n.isRtl();
    const gross = this.i18n.t('dashboard.gross');
    const payslips = (count: number) => this.i18n.t('dashboard.payslipsTooltip', { count });
    return (tk: ChartTokens): ChartConfiguration => ({
      type: 'bar',
      data: {
        labels: rows.map((d) => localizeTerm(d.departmentName, locale)),
        datasets: [{
          label: gross, data: rows.map((d) => d.grossTotal), backgroundColor: tk.series1,
          borderRadius: 4, borderSkipped: 'start', barThickness: 18, borderColor: tk.surface, borderWidth: 0,
        }],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipDefaults(tk, rtl),
            callbacks: { label: (c) => ` ${formatMoney(c.parsed.x ?? 0, locale)} · ${payslips(rows[c.dataIndex]?.headcount ?? 0)}` },
          },
        },
        scales: {
          x: {
            ...axisDefaults(tk), reverse: rtl, beginAtZero: true,
            ticks: { ...axisDefaults(tk).ticks, callback: (v) => formatMoneyCompact(Number(v), locale) },
          },
          y: { ...axisDefaults(tk), position: rtl ? 'right' : 'left', grid: { display: false } },
        },
      },
    });
  });

  constructor() {
    // Registered as pending work, so Angular (and tests) know the page is still loading.
    void this.pending.run(() => this.load());
  }

  protected compact(value: number): string {
    return formatMoneyCompact(value, this.i18n.locale());
  }

  protected period(year: number, month: number): string {
    return formatPeriod(year, month, this.i18n.locale());
  }

  private async load(): Promise<void> {
    try {
      this.summary.set(await this.api.dashboard());
    } catch (e) {
      this.errors.handle(e);
    }
  }
}
