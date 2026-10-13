<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import type { AttendanceLog, AttendanceQuery, PagedResult } from '@/api/types'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatHours, formatTime } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const auth = useAuthStore()
const handleError = useApiError()
const toast = useToast()
const { t } = useI18n()

const result = ref<PagedResult<AttendanceLog>>({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 })
const query = reactive<AttendanceQuery>({ page: 1, pageSize: 10 })
const loading = ref(false)
const openShift = ref<AttendanceLog | null>(null)
const busy = ref(false)
const tick = ref(Date.now())
const timer = setInterval(() => (tick.value = Date.now()), 30_000)
onBeforeUnmount(() => clearInterval(timer))

const elapsed = computed(() =>
  openShift.value ? formatHours((tick.value - new Date(openShift.value.checkIn).getTime()) / 3_600_000) : '')

async function load() {
  loading.value = true
  try {
    result.value = await api().attendance.search({ ...query })
    if (!auth.isStaff) openShift.value = await api().attendance.current()
  } catch (e) {
    handleError(e)
  } finally {
    loading.value = false
  }
}

function onPage(e: DataTablePageEvent) {
  query.page = e.page + 1
  query.pageSize = e.rows
  load()
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
    tick.value = Date.now()
    query.page = 1
    await load()
  } catch (e) {
    handleError(e)
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('attendance.title') }}</h1>
        <p>{{ auth.isStaff ? t('attendance.subtitleStaff') : t('attendance.subtitleEmployee') }}</p>
      </div>
    </div>

    <section v-if="!auth.isStaff" class="panel clock">
      <div class="clock-state">
        <span class="dot" :class="{ on: openShift }" />
        <div>
          <strong>{{ openShift ? t('attendance.checkedIn') : t('attendance.checkedOut') }}</strong>
          <div class="muted">
            {{ openShift ? t('attendance.since', { time: formatTime(openShift.checkIn), elapsed }) : t('attendance.startHint') }}
          </div>
        </div>
      </div>
      <Button :label="openShift ? t('attendance.checkOut') : t('attendance.checkIn')" :icon="openShift ? 'pi pi-sign-out' : 'pi pi-sign-in'"
        :severity="openShift ? 'danger' : 'success'" size="large" :loading="busy" @click="toggleShift" />
    </section>

    <section class="panel">
      <DataTable :value="result.items" lazy paginator :rows="query.pageSize" :total-records="result.totalCount"
        :first="((query.page ?? 1) - 1) * (query.pageSize ?? 10)" :rows-per-page-options="[10, 20, 50]" :loading="loading"
        data-key="id" striped-rows scrollable @page="onPage">
        <template #empty><div class="muted">{{ t('attendance.empty') }}</div></template>
        <Column :header="t('attendance.date')">
          <template #body="{ data }"><strong>{{ formatDate(data.checkIn) }}</strong></template>
        </Column>
        <Column v-if="auth.isStaff" field="employeeName" :header="t('common.employee')" />
        <Column :header="t('attendance.checkIn')">
          <template #body="{ data }">{{ formatTime(data.checkIn) }}</template>
        </Column>
        <Column :header="t('attendance.checkOut')">
          <template #body="{ data }">
            <Tag v-if="data.isOpen" :value="t('attendance.onShift')" severity="success" />
            <span v-else>{{ formatTime(data.checkOut) }}</span>
          </template>
        </Column>
        <Column :header="t('attendance.hours')">
          <template #body="{ data }"><span class="money">{{ data.isOpen ? '-' : formatHours(data.totalHours) }}</span></template>
        </Column>
      </DataTable>
    </section>
  </div>
</template>

<style scoped>
.clock { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.clock-state { display: flex; gap: 0.875rem; align-items: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: var(--app-text-muted); flex-shrink: 0; }
.dot.on { background: #16a34a; box-shadow: 0 0 0 4px rgb(22 163 74 / 0.2); }
</style>
