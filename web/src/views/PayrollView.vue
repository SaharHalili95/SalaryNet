<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/api'
import type { Department, Employee, PagedResult, PayrollQuery, PayrollRecord } from '@/api/types'
import PayslipDialog from '@/components/PayslipDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, formatPeriod, monthOptions } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const auth = useAuthStore()
const handleError = useApiError()
const toast = useToast()

const now = new Date()
const yearOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

const result = ref<PagedResult<PayrollRecord>>({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 })
const loading = ref(false)
const departments = ref<Department[]>([])
const query = reactive<PayrollQuery>({ page: 1, pageSize: 10 })

const payslip = ref<PayrollRecord | null>(null)
const payslipOpen = ref(false)

const runOpen = ref(false)
const generateOpen = ref(false)
const busy = ref(false)
const period = reactive({ year: now.getFullYear(), month: now.getMonth() + 1 })
const single = reactive({ employeeId: '', bonus: 0 })
const activeEmployees = ref<Employee[]>([])
const employeeOptions = computed(() => activeEmployees.value.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName} · ${e.departmentName}` })))

async function load() {
  loading.value = true
  try {
    result.value = await api().payroll.search({ ...query })
  } catch (e) {
    handleError(e)
  } finally {
    loading.value = false
  }
}

watch(() => [query.year, query.month, query.departmentId], () => { query.page = 1; load() })

function onPage(e: DataTablePageEvent) {
  query.page = e.page + 1
  query.pageSize = e.rows
  load()
}

function view(record: PayrollRecord) {
  payslip.value = record
  payslipOpen.value = true
}

async function openGenerate() {
  single.employeeId = ''
  single.bonus = 0
  generateOpen.value = true
  if (activeEmployees.value.length === 0) {
    try {
      activeEmployees.value = (await api().employees.search({ isActive: true, pageSize: 100 })).items
    } catch (e) {
      handleError(e)
    }
  }
}

async function runMonth() {
  busy.value = true
  try {
    const r = await api().payroll.runMonth(period.year, period.month)
    toast.add({ severity: 'success', summary: `Payroll run for ${formatPeriod(r.year, r.month)}`,
      detail: `${r.generated} payslips generated, ${r.skipped} already existed.`, life: 5000 })
    runOpen.value = false
    load()
  } catch (e) {
    handleError(e)
  } finally {
    busy.value = false
  }
}

async function generate() {
  busy.value = true
  try {
    const record = await api().payroll.generate({ employeeId: single.employeeId, year: period.year, month: period.month, bonus: single.bonus })
    generateOpen.value = false
    load()
    view(record)
  } catch (e) {
    handleError(e)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  if (auth.isStaff) {
    try {
      departments.value = await api().departments.list()
    } catch (e) {
      handleError(e)
    }
  }
  load()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ auth.isStaff ? 'Payroll' : 'My payslips' }}</h1>
        <p v-if="auth.isStaff">Generate payslips and review every employee's pay history.</p>
        <p v-else>Your payslips. Other employees' records are never visible to your account.</p>
      </div>
      <div v-if="auth.isStaff" class="header-actions">
        <Button label="Single payslip" icon="pi pi-file" outlined @click="openGenerate" />
        <Button label="Run monthly payroll" icon="pi pi-play" @click="runOpen = true" />
      </div>
    </div>

    <section class="panel">
      <div class="toolbar">
        <Select v-model="query.year" :options="yearOptions" placeholder="Any year" show-clear aria-label="Year" />
        <Select v-model="query.month" :options="monthOptions" option-label="label" option-value="value"
          placeholder="Any month" show-clear aria-label="Month" />
        <Select v-if="auth.isStaff" v-model="query.departmentId" :options="departments" option-label="name" option-value="id"
          placeholder="All departments" show-clear aria-label="Department" />
      </div>

      <DataTable :value="result.items" lazy paginator :rows="query.pageSize" :total-records="result.totalCount"
        :first="((query.page ?? 1) - 1) * (query.pageSize ?? 10)" :rows-per-page-options="[10, 20, 50]" :loading="loading"
        data-key="id" striped-rows scrollable row-hover @page="onPage" @row-click="view($event.data)">
        <template #empty><div class="muted">No payslips for these filters.</div></template>
        <Column header="Period">
          <template #body="{ data }"><strong>{{ formatPeriod(data.year, data.month) }}</strong></template>
        </Column>
        <Column v-if="auth.isStaff" field="employeeName" header="Employee" />
        <Column v-if="auth.isStaff" field="departmentName" header="Department" />
        <Column header="Gross">
          <template #body="{ data }"><span class="money">{{ formatMoney(data.grossSalary) }}</span></template>
        </Column>
        <Column header="Deductions">
          <template #body="{ data }"><span class="money muted">{{ formatMoney(data.deductions) }}</span></template>
        </Column>
        <Column header="Net pay">
          <template #body="{ data }"><strong class="money">{{ formatMoney(data.netSalary) }}</strong></template>
        </Column>
        <Column header="" :style="{ width: '4rem' }">
          <template #body="{ data }">
            <Button icon="pi pi-eye" text rounded aria-label="View payslip" @click.stop="view(data)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <PayslipDialog v-model:visible="payslipOpen" :record="payslip" />

    <Dialog v-model:visible="runOpen" modal header="Run monthly payroll" :style="{ width: '26rem' }" :breakpoints="{ '640px': '95vw' }">
      <p class="muted intro">Generates a payslip for every active employee. Anyone already paid for the month is skipped, so the run is safe to repeat.</p>
      <div class="form-grid">
        <div class="field"><label for="run-month">Month</label>
          <Select input-id="run-month" v-model="period.month" :options="monthOptions" option-label="label" option-value="value" /></div>
        <div class="field"><label for="run-year">Year</label>
          <Select input-id="run-year" v-model="period.year" :options="yearOptions" /></div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="runOpen = false" />
        <Button label="Run payroll" icon="pi pi-play" :loading="busy" @click="runMonth" />
      </template>
    </Dialog>

    <Dialog v-model:visible="generateOpen" modal header="Generate a payslip" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
      <div class="form-grid">
        <div class="field full"><label for="gen-employee">Employee</label>
          <Select input-id="gen-employee" v-model="single.employeeId" :options="employeeOptions" option-label="label" option-value="id"
            filter placeholder="Choose an employee" /></div>
        <div class="field"><label for="gen-month">Month</label>
          <Select input-id="gen-month" v-model="period.month" :options="monthOptions" option-label="label" option-value="value" /></div>
        <div class="field"><label for="gen-year">Year</label>
          <Select input-id="gen-year" v-model="period.year" :options="yearOptions" /></div>
        <div class="field full"><label for="gen-bonus">Bonus</label>
          <InputNumber input-id="gen-bonus" v-model="single.bonus" mode="currency" currency="ILS" locale="en-IL" :min="0" fluid /></div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="generateOpen = false" />
        <Button label="Generate" icon="pi pi-check" :disabled="!single.employeeId" :loading="busy" @click="generate" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.intro { margin-top: 0; line-height: 1.5; }
:deep(.p-datatable-tbody > tr) { cursor: pointer; }
</style>
