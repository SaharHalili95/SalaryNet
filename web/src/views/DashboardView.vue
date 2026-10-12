<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import { computed, onMounted, ref } from 'vue'
import { api } from '@/api'
import type { DashboardSummary } from '@/api/types'
import ChartCanvas, { type ChartTokens } from '@/components/ChartCanvas.vue'
import StatTile from '@/components/StatTile.vue'
import { employmentTypeLabel, formatMoney, formatMoneyCompact, formatMonthShort, formatPeriod } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const summary = ref<DashboardSummary | null>(null)
const showTrendTable = ref(false)
const showDeptTable = ref(false)
const handleError = useApiError()

onMounted(async () => {
  try {
    summary.value = await api().dashboard()
  } catch (e) {
    handleError(e)
  }
})

const axisDefaults = (t: ChartTokens) => ({
  grid: { color: t.grid, drawTicks: false },
  border: { display: false },
  ticks: { color: t.text, padding: 8, font: { size: 12 } },
})

const tooltip = (t: ChartTokens) => ({
  backgroundColor: t.surface, titleColor: t.text, bodyColor: t.text, borderColor: t.grid, borderWidth: 1,
  padding: 10, boxPadding: 4, usePointStyle: true,
  callbacks: { label: (c: { dataset: { label?: string }; parsed: { x: number; y: number } }) =>
    ` ${c.dataset.label}: ${formatMoney(c.parsed.y ?? c.parsed.x)}` },
})

const trendChart = computed(() => (t: ChartTokens): ChartConfiguration<'line'> => {
  const trend = summary.value?.monthlyTrend ?? []
  const series = (label: string, color: string, data: number[]) => ({
    label, data, borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.3,
    pointRadius: 4, pointHoverRadius: 6, pointBorderColor: t.surface, pointBorderWidth: 2,
  })
  return {
    type: 'line',
    data: {
      labels: trend.map((p) => formatMonthShort(p.year, p.month)),
      datasets: [
        series('Gross', t.series1, trend.map((p) => p.grossTotal)),
        series('Net', t.series2, trend.map((p) => p.netTotal)),
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { color: t.text, usePointStyle: true, boxWidth: 8, boxHeight: 8 } },
        tooltip: tooltip(t),
      },
      scales: {
        x: { ...axisDefaults(t), grid: { display: false } },
        y: { ...axisDefaults(t), beginAtZero: true, ticks: { ...axisDefaults(t).ticks, callback: (v) => formatMoneyCompact(Number(v)) } },
      },
    },
  }
})

const departmentChart = computed(() => (t: ChartTokens): ChartConfiguration<'bar'> => {
  const rows = summary.value?.payrollByDepartment ?? []
  return {
    type: 'bar',
    data: {
      labels: rows.map((d) => d.departmentName),
      datasets: [{
        label: 'Gross payroll', data: rows.map((d) => d.grossTotal), backgroundColor: t.series1,
        borderRadius: 4, borderSkipped: 'start', barThickness: 18, borderColor: t.surface, borderWidth: 0,
      }],
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...tooltip(t), callbacks: {
        label: (c) => ` ${formatMoney(c.parsed.x)} · ${rows[c.dataIndex]?.headcount} payslips` } } },
      scales: {
        x: { ...axisDefaults(t), beginAtZero: true, ticks: { ...axisDefaults(t).ticks, callback: (v) => formatMoneyCompact(Number(v)) } },
        y: { ...axisDefaults(t), grid: { display: false } },
      },
    },
  }
})

const typeTotal = computed(() => summary.value?.employmentTypes.reduce((s, t) => s + t.count, 0) ?? 0)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Company-wide headcount and payroll at a glance.</p>
      </div>
    </div>

    <div v-if="!summary" class="tiles">
      <Skeleton v-for="i in 4" :key="i" height="92px" border-radius="12px" />
    </div>

    <template v-else>
      <div class="tiles">
        <StatTile icon="pi pi-users" label="Active employees" :value="String(summary.activeEmployees)"
          :caption="`${summary.totalEmployees} total · ${summary.departmentCount} departments`" />
        <StatTile icon="pi pi-wallet" label="Latest gross payroll"
          :value="summary.latestPeriod ? formatMoneyCompact(summary.latestPeriod.grossTotal) : '-'"
          :caption="summary.latestPeriod ? `${formatPeriod(summary.latestPeriod.year, summary.latestPeriod.month)} · ${summary.latestPeriod.payslips} payslips` : 'No payroll yet'" />
        <StatTile icon="pi pi-percentage" label="Latest deductions"
          :value="summary.latestPeriod ? formatMoneyCompact(summary.latestPeriod.deductionsTotal) : '-'"
          :caption="summary.latestPeriod ? `${((summary.latestPeriod.deductionsTotal / summary.latestPeriod.grossTotal) * 100).toFixed(1)}% of gross` : undefined" />
        <StatTile icon="pi pi-clock" label="Checked in now" :value="String(summary.currentlyCheckedIn)"
          :caption="`Avg. base salary ${formatMoneyCompact(summary.averageBaseSalary)}`" />
      </div>

      <div class="grid">
        <section class="panel wide">
          <div class="panel-head">
            <h2>Payroll trend, last {{ summary.monthlyTrend.length }} months</h2>
            <Button :label="showTrendTable ? 'Chart' : 'Table'" :icon="showTrendTable ? 'pi pi-chart-line' : 'pi pi-table'"
              text size="small" @click="showTrendTable = !showTrendTable" />
          </div>
          <ChartCanvas v-if="!showTrendTable" :build="trendChart" label="Line chart of monthly gross and net payroll" />
          <table v-else class="data-table">
            <thead><tr><th>Period</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Payslips</th></tr></thead>
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
          <h2>Workforce by contract</h2>
          <ul class="meters">
            <li v-for="t in summary.employmentTypes" :key="t.employmentType">
              <div class="meter-label"><span>{{ employmentTypeLabel[t.employmentType] }}</span><strong>{{ t.count }}</strong></div>
              <div class="meter"><div :style="{ width: `${(t.count / typeTotal) * 100}%` }" /></div>
            </li>
          </ul>
        </section>

        <section class="panel full">
          <div class="panel-head">
            <h2>Gross payroll by department{{ summary.latestPeriod ? `, ${formatPeriod(summary.latestPeriod.year, summary.latestPeriod.month)}` : '' }}</h2>
            <Button :label="showDeptTable ? 'Chart' : 'Table'" :icon="showDeptTable ? 'pi pi-chart-bar' : 'pi pi-table'"
              text size="small" @click="showDeptTable = !showDeptTable" />
          </div>
          <ChartCanvas v-if="!showDeptTable" :build="departmentChart" label="Bar chart of gross payroll per department"
            :height="Math.max(200, summary.payrollByDepartment.length * 44)" />
          <table v-else class="data-table">
            <thead><tr><th>Department</th><th>Payslips</th><th>Gross</th><th>Net</th></tr></thead>
            <tbody>
              <tr v-for="d in summary.payrollByDepartment" :key="d.departmentName">
                <td>{{ d.departmentName }}</td>
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
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
.full { grid-column: 1 / -1; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.panel-head h2 { margin: 0; }
.meters { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.125rem; }
.meter-label { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
.meter { height: 8px; border-radius: 4px; background: var(--chart-grid); overflow: hidden; }
.meter div { height: 100%; background: var(--chart-series-1); border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { text-align: left; padding: 0.5rem 0.625rem; border-bottom: 1px solid var(--app-border); }
.data-table th { color: var(--app-text-muted); font-weight: 550; font-size: 0.8125rem; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>
