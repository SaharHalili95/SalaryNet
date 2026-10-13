<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import type { DashboardSummary } from '@/api/types'
import ChartCanvas, { type ChartTokens } from '@/components/ChartCanvas.vue'
import AdminFocusPanel from '@/components/AdminFocusPanel.vue'
import HrFocusPanel from '@/components/HrFocusPanel.vue'
import StatTile from '@/components/StatTile.vue'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, formatMoneyCompact, formatMonthShort, formatPeriod } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const summary = ref<DashboardSummary | null>(null)
const showTrendTable = ref(false)
const showDeptTable = ref(false)
const handleError = useApiError()
const { t, locale } = useI18n()
const rtl = computed(() => locale.value === 'he')
const { term } = useLocalizedData()
const auth = useAuthStore()

onMounted(async () => {
  try {
    summary.value = await api().dashboard()
  } catch (e) {
    handleError(e)
  }
})

const axisDefaults = (tk: ChartTokens) => ({
  grid: { color: tk.grid, drawTicks: false },
  border: { display: false },
  ticks: { color: tk.text, padding: 8, font: { size: 12 } },
})

const tooltip = (tk: ChartTokens, isRtl: boolean) => ({
  backgroundColor: tk.surface, titleColor: tk.text, bodyColor: tk.text, borderColor: tk.grid, borderWidth: 1,
  padding: 10, boxPadding: 4, usePointStyle: true, rtl: isRtl,
  callbacks: { label: (c: { dataset: { label?: string }; parsed: { x: number; y: number } }) =>
    ` ${c.dataset.label}: ${formatMoney(c.parsed.y ?? c.parsed.x)}` },
})

// Data and locale are read in the computed itself so the chart rebuilds when either changes.
const trendChart = computed(() => {
  const trend = summary.value?.monthlyTrend ?? []
  const isRtl = rtl.value
  const labels = { gross: t('dashboard.gross'), net: t('dashboard.net') }
  return (tk: ChartTokens): ChartConfiguration<'line'> => {
    const series = (label: string, color: string, data: number[]) => ({
      label, data, borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.3,
      pointRadius: 4, pointHoverRadius: 6, pointBorderColor: tk.surface, pointBorderWidth: 2,
    })
    return {
      type: 'line',
      data: {
        labels: trend.map((p) => formatMonthShort(p.year, p.month)),
        datasets: [
          series(labels.gross, tk.series1, trend.map((p) => p.grossTotal)),
          series(labels.net, tk.series2, trend.map((p) => p.netTotal)),
        ],
      },
      options: {
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end', rtl: isRtl, labels: { color: tk.text, usePointStyle: true, boxWidth: 8, boxHeight: 8 } },
          tooltip: tooltip(tk, isRtl),
        },
        scales: {
          x: { ...axisDefaults(tk), grid: { display: false } },
          // Totals move by a few percent month to month; a zero baseline would flatten that into straight lines.
          y: { ...axisDefaults(tk), position: isRtl ? 'right' : 'left', grace: '10%',
            ticks: { ...axisDefaults(tk).ticks, callback: (v) => formatMoneyCompact(Number(v)) } },
        },
      },
    }
  }
})

const departmentChart = computed(() => {
  const rows = summary.value?.payrollByDepartment ?? []
  const isRtl = rtl.value
  const grossLabel = t('dashboard.gross')
  const payslips = (count: number) => t('dashboard.payslipsTooltip', { count })
  return (tk: ChartTokens): ChartConfiguration<'bar'> => ({
    type: 'bar',
    data: {
      labels: rows.map((d) => term(d.departmentName)),
      datasets: [{
        label: grossLabel, data: rows.map((d) => d.grossTotal), backgroundColor: tk.series1,
        borderRadius: 4, borderSkipped: 'start', barThickness: 18, borderColor: tk.surface, borderWidth: 0,
      }],
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...tooltip(tk, isRtl), callbacks: {
        label: (c) => ` ${formatMoney(c.parsed.x)} · ${payslips(rows[c.dataIndex]?.headcount ?? 0)}` } } },
      scales: {
        x: { ...axisDefaults(tk), reverse: isRtl, beginAtZero: true, ticks: { ...axisDefaults(tk).ticks, callback: (v) => formatMoneyCompact(Number(v)) } },
        y: { ...axisDefaults(tk), position: isRtl ? 'right' : 'left', grid: { display: false } },
      },
    },
  })
})

const typeTotal = computed(() => summary.value?.employmentTypes.reduce((s, t) => s + t.count, 0) ?? 0)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('dashboard.title') }}</h1>
        <p>{{ auth.isAdmin ? t('dashboard.subtitleAdmin') : t('dashboard.subtitleHr') }}</p>
      </div>
    </div>

    <div v-if="!summary" class="tiles">
      <Skeleton v-for="i in 4" :key="i" height="92px" border-radius="12px" />
    </div>

    <template v-else>
      <AdminFocusPanel v-if="auth.isAdmin" />
      <HrFocusPanel v-else :active-employees="summary.activeEmployees" />
      <div class="tiles">
        <StatTile icon="pi pi-users" :label="t('dashboard.activeEmployees')" :value="String(summary.activeEmployees)"
          :caption="t('dashboard.totals', { total: summary.totalEmployees, departments: summary.departmentCount })" />
        <StatTile icon="pi pi-wallet" :label="t('dashboard.latestGross')"
          :value="summary.latestPeriod ? formatMoneyCompact(summary.latestPeriod.grossTotal) : '-'"
          :caption="summary.latestPeriod
            ? t('dashboard.periodPayslips', { period: formatPeriod(summary.latestPeriod.year, summary.latestPeriod.month), count: summary.latestPeriod.payslips })
            : t('dashboard.noPayroll')" />
        <StatTile icon="pi pi-percentage" :label="t('dashboard.latestDeductions')"
          :value="summary.latestPeriod ? formatMoneyCompact(summary.latestPeriod.deductionsTotal) : '-'"
          :caption="summary.latestPeriod
            ? t('dashboard.ofGross', { percent: ((summary.latestPeriod.deductionsTotal / summary.latestPeriod.grossTotal) * 100).toFixed(1) })
            : undefined" />
        <StatTile icon="pi pi-clock" :label="t('dashboard.checkedIn')" :value="String(summary.currentlyCheckedIn)"
          :caption="t('dashboard.averageSalary', { amount: formatMoneyCompact(summary.averageBaseSalary) })" />
      </div>

      <div class="grid">
        <section class="panel wide">
          <div class="panel-head">
            <h2>{{ t('dashboard.trendTitle', { count: summary.monthlyTrend.length }) }}</h2>
            <Button :label="showTrendTable ? t('common.chart') : t('common.table')" :icon="showTrendTable ? 'pi pi-chart-line' : 'pi pi-table'"
              text size="small" @click="showTrendTable = !showTrendTable" />
          </div>
          <ChartCanvas v-if="!showTrendTable" :build="trendChart" :label="t('dashboard.trendLabel')" />
          <table v-else class="data-table">
            <thead><tr><th>{{ t('dashboard.period') }}</th><th>{{ t('dashboard.gross') }}</th><th>{{ t('dashboard.deductions') }}</th><th>{{ t('dashboard.net') }}</th><th>{{ t('dashboard.payslips') }}</th></tr></thead>
            <tbody>
              <tr v-for="p in summary.monthlyTrend" :key="`${p.year}-${p.month}`">
                <td>{{ formatPeriod(p.year, p.month) }}</td>
                <td class="money">{{ formatMoney(p.grossTotal) }}</td>
                <td class="money">{{ formatMoney(p.deductionsTotal) }}</td>
                <td class="money">{{ formatMoney(p.netTotal) }}</td>
                <td>{{ p.payslips }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="panel">
          <h2>{{ t('dashboard.workforce') }}</h2>
          <ul class="meters">
            <li v-for="et in summary.employmentTypes" :key="et.employmentType">
              <div class="meter-label"><span>{{ t(`employmentType.${et.employmentType}`) }}</span><strong>{{ et.count }}</strong></div>
              <div class="meter"><div :style="{ width: `${(et.count / typeTotal) * 100}%` }" /></div>
            </li>
          </ul>
        </section>

        <section class="panel full">
          <div class="panel-head">
            <h2>{{ t('dashboard.byDepartment') }}{{ summary.latestPeriod ? `, ${formatPeriod(summary.latestPeriod.year, summary.latestPeriod.month)}` : '' }}</h2>
            <Button :label="showDeptTable ? t('common.chart') : t('common.table')" :icon="showDeptTable ? 'pi pi-chart-bar' : 'pi pi-table'"
              text size="small" @click="showDeptTable = !showDeptTable" />
          </div>
          <ChartCanvas v-if="!showDeptTable" :build="departmentChart" :label="t('dashboard.byDepartmentLabel')"
            :height="Math.max(200, summary.payrollByDepartment.length * 44)" />
          <table v-else class="data-table">
            <thead><tr><th>{{ t('common.department') }}</th><th>{{ t('dashboard.payslips') }}</th><th>{{ t('dashboard.gross') }}</th><th>{{ t('dashboard.net') }}</th></tr></thead>
            <tbody>
              <tr v-for="d in summary.payrollByDepartment" :key="d.departmentName">
                <td>{{ term(d.departmentName) }}</td>
                <td>{{ d.headcount }}</td>
                <td class="money">{{ formatMoney(d.grossTotal) }}</td>
                <td class="money">{{ formatMoney(d.netTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Fixed 4 / 2 / 1 columns so a lone tile never wraps onto its own row. */
.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1rem; }
@media (max-width: 1100px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .tiles { grid-template-columns: 1fr; } }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
.full { grid-column: 1 / -1; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.panel-head h2 { margin: 0; }
.meters { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.125rem; }
.meter-label { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
.meter { height: 8px; border-radius: 4px; background: var(--chart-grid); overflow: hidden; }
.meter div { height: 100%; background: var(--chart-series-1); border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { text-align: start; padding: 0.5rem 0.625rem; border-bottom: 1px solid var(--app-border); }
.data-table th { color: var(--app-text-muted); font-weight: 550; font-size: 0.8125rem; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>
