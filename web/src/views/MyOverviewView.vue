<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import type { AttendanceLog, Employee, PayrollRecord } from '@/api/types'
import ChartCanvas, { type ChartTokens } from '@/components/ChartCanvas.vue'
import StatTile from '@/components/StatTile.vue'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { formatDate, formatHours, formatMoney, formatMoneyCompact, formatMonthShort, formatPeriod, formatTime } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const { t, locale } = useI18n()
const { term, person } = useLocalizedData()
const router = useRouter()
const toast = useToast()
const handleError = useApiError()

const me = ref<Employee | null>(null)
const payslips = ref<PayrollRecord[]>([])
const shifts = ref<AttendanceLog[]>([])
const openShift = ref<AttendanceLog | null>(null)
const busy = ref(false)

const thisYear = new Date().getFullYear()
const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()

const latest = computed(() => payslips.value[0] ?? null)
const thisYearSlips = computed(() => payslips.value.filter((p) => p.year === thisYear))
const ytdGross = computed(() => thisYearSlips.value.reduce((s, p) => s + p.grossSalary, 0))
const ytdNet = computed(() => thisYearSlips.value.reduce((s, p) => s + p.netSalary, 0))
const monthShifts = computed(() => shifts.value.filter((s) => s.checkIn >= monthStart && !s.isOpen))
const monthHours = computed(() => monthShifts.value.reduce((s, l) => s + l.totalHours, 0))

async function load() {
  try {
    const [employee, payroll, attendance, current] = await Promise.all([
      api().employees.mine(),
      api().payroll.search({ pageSize: 100 }),
      api().attendance.search({ pageSize: 100 }),
      api().attendance.current(),
    ])
    me.value = employee
    payslips.value = payroll.items
    shifts.value = attendance.items
    openShift.value = current
  } catch (e) {
    handleError(e)
  }
}

async function toggleShift() {
  busy.value = true
  try {
    if (openShift.value) {
      const closed = await api().attendance.checkOut()
      toast.add({ severity: 'success', summary: t('attendance.checkedOutToast'), detail: t('attendance.shiftLength', { hours: formatHours(closed.totalHours) }), life: 4000 })
    } else {
      await api().attendance.checkIn()
      toast.add({ severity: 'success', summary: t('attendance.checkedInToast'), detail: t('attendance.checkedInDetail'), life: 3000 })
    }
    await load()
  } catch (e) {
    handleError(e)
  } finally {
    busy.value = false
  }
}

// Read data and locale in the computed itself so the chart rebuilds when either changes.
const netChart = computed(() => {
  const recent = [...payslips.value].slice(0, 6).reverse()
  const rtl = locale.value === 'he'
  const label = t('dashboard.net')
  return (tk: ChartTokens): ChartConfiguration<'bar'> => ({
    type: 'bar',
    data: {
      labels: recent.map((p) => formatMonthShort(p.year, p.month)),
      datasets: [{ label, data: recent.map((p) => p.netSalary), backgroundColor: tk.series1, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 36 }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { rtl, backgroundColor: tk.surface, titleColor: tk.text, bodyColor: tk.text, borderColor: tk.grid, borderWidth: 1,
          callbacks: { label: (c) => ` ${formatMoney(c.parsed.y)}` } },
      },
      scales: {
        x: { reverse: rtl, grid: { display: false }, border: { display: false }, ticks: { color: tk.text } },
        y: { position: rtl ? 'right' : 'left', beginAtZero: true, border: { display: false }, grid: { color: tk.grid },
          ticks: { color: tk.text, callback: (v) => formatMoneyCompact(Number(v)) } },
      },
    },
  })
})

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('me.greeting', { name: me ? person(me.firstName) : '' }) }}</h1>
        <p>{{ t('me.subtitle') }}</p>
      </div>
    </div>

    <div v-if="!me" class="tiles"><Skeleton v-for="i in 4" :key="i" height="92px" border-radius="12px" /></div>

    <template v-else>
      <section class="panel shift">
        <div class="shift-state">
          <span class="dot" :class="{ on: openShift }" />
          <div>
            <strong>{{ openShift ? t('attendance.checkedIn') : t('attendance.checkedOut') }}</strong>
            <div class="muted">{{ openShift ? formatTime(openShift.checkIn) : t('attendance.startHint') }}</div>
          </div>
        </div>
        <Button :label="openShift ? t('attendance.checkOut') : t('attendance.checkIn')" :icon="openShift ? 'pi pi-sign-out' : 'pi pi-sign-in'"
          :severity="openShift ? 'danger' : 'success'" :loading="busy" @click="toggleShift" />
      </section>

      <div class="tiles">
        <StatTile icon="pi pi-wallet" :label="t('me.lastNet')" :value="latest ? formatMoney(latest.netSalary) : '-'"
          :caption="latest ? formatPeriod(latest.year, latest.month) : t('me.noPayslips')" />
        <StatTile icon="pi pi-chart-line" :label="t('me.ytdGross')" :value="formatMoneyCompact(ytdGross)"
          :caption="t('me.payslipsCount', { count: thisYearSlips.length })" />
        <StatTile icon="pi pi-check-circle" :label="t('me.ytdNet')" :value="formatMoneyCompact(ytdNet)" />
        <StatTile icon="pi pi-clock" :label="t('me.hoursThisMonth')" :value="formatHours(monthHours)"
          :caption="t('me.shifts', { count: monthShifts.length })" />
      </div>

      <div class="grid">
        <section class="panel">
          <div class="panel-head">
            <h2>{{ t('me.netHistory') }}</h2>
            <Button :label="t('me.allPayslips')" text size="small" @click="router.push({ name: 'payroll' })" />
          </div>
          <ChartCanvas v-if="payslips.length" :build="netChart" :label="t('me.netHistoryLabel')" :height="240" />
          <p v-else class="muted">{{ t('me.noPayslips') }}</p>
        </section>

        <section class="panel">
          <h2>{{ t('me.profile') }}</h2>
          <dl class="profile">
            <dt>{{ t('common.department') }}</dt><dd>{{ term(me.departmentName) }}</dd>
            <dt>{{ t('employees.contract') }}</dt><dd>{{ t(`employmentType.${me.employmentType}`) }}</dd>
            <dt>{{ t('me.joined') }}</dt><dd>{{ formatDate(me.createdAt) }}</dd>
            <dt>{{ t('employees.baseSalary') }}</dt><dd class="money">{{ formatMoney(me.baseSalary) }}</dd>
            <dt>{{ t('common.email') }}</dt><dd class="ltr">{{ me.email }}</dd>
          </dl>
          <div class="panel-head recent-head">
            <h2>{{ t('me.recentShifts') }}</h2>
            <Button :label="t('me.allShifts')" text size="small" @click="router.push({ name: 'attendance' })" />
          </div>
          <ul class="shifts">
            <li v-for="s in shifts.slice(0, 4)" :key="s.id">
              <span>{{ formatDate(s.checkIn) }}</span>
              <span class="muted">{{ formatTime(s.checkIn) }}{{ s.checkOut ? ` - ${formatTime(s.checkOut)}` : '' }}</span>
              <strong class="money">{{ s.isOpen ? t('attendance.onShift') : formatHours(s.totalHours) }}</strong>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.shift { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.shift-state { display: flex; gap: 0.875rem; align-items: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: var(--app-text-muted); flex-shrink: 0; }
.dot.on { background: #16a34a; box-shadow: 0 0 0 4px rgb(22 163 74 / 0.2); }
.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.panel-head h2 { margin: 0; }
.recent-head { margin-top: 1.25rem; }
.profile { margin: 0; display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.5rem 1rem; }
.profile dt { color: var(--app-text-muted); }
.profile dd { margin: 0; overflow-wrap: anywhere; }
.shifts { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.375rem; }
.shifts li { display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem; align-items: center; }
@media (max-width: 1100px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 900px) { .grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 560px) { .tiles { grid-template-columns: 1fr; } }
</style>
