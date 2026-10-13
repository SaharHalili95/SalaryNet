<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import type { Department, Employee, PagedResult, PayrollQuery, PayrollRecord } from '@/api/types'
import PayslipDialog from '@/components/PayslipDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { formatMoney, formatPeriod, monthOptions } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const auth = useAuthStore()
const handleError = useApiError()
const toast = useToast()
const { t } = useI18n()
const { term, person } = useLocalizedData()
// monthOptions reads the active locale, so this recomputes when the language changes.
const months = computed(() => monthOptions())

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
const employeeOptions = computed(() =>
  activeEmployees.value.map((e) => ({ id: e.id, label: `${person(`${e.firstName} ${e.lastName}`)} · ${term(e.departmentName)}` })))
const departmentOptions = computed(() => departments.value.map((d) => ({ id: d.id, name: term(d.name) })))

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
    toast.add({ severity: 'success', summary: t('payroll.runDone', { period: formatPeriod(r.year, r.month) }),
      detail: t('payroll.runDetail', { generated: r.generated, skipped: r.skipped }), life: 5000 })
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
        <h1>{{ auth.isStaff ? t('payroll.titleStaff') : t('payroll.titleEmployee') }}</h1>
        <p>{{ auth.isStaff ? t('payroll.subtitleStaff') : t('payroll.subtitleEmployee') }}</p>
      </div>
      <div v-if="auth.isStaff" class="header-actions">
        <Button :label="t('payroll.single')" icon="pi pi-file" outlined @click="openGenerate" />
        <Button :label="t('payroll.runMonthly')" icon="pi pi-play" @click="runOpen = true" />
      </div>
    </div>

    <section class="panel">
      <div class="toolbar">
        <Select v-model="query.year" :options="yearOptions" :placeholder="t('payroll.anyYear')" show-clear :aria-label="t('common.year')" />
        <Select v-model="query.month" :options="months" option-label="label" option-value="value"
          :placeholder="t('payroll.anyMonth')" show-clear :aria-label="t('common.month')" />
        <Select v-if="auth.isStaff" v-model="query.departmentId" :options="departmentOptions" option-label="name" option-value="id"
          :placeholder="t('common.allDepartments')" show-clear :aria-label="t('common.department')" />
      </div>

      <DataTable :value="result.items" lazy paginator :rows="query.pageSize" :total-records="result.totalCount"
        :first="((query.page ?? 1) - 1) * (query.pageSize ?? 10)" :rows-per-page-options="[10, 20, 50]" :loading="loading"
        data-key="id" striped-rows scrollable row-hover @page="onPage" @row-click="view($event.data)">
        <template #empty><div class="muted">{{ t('payroll.empty') }}</div></template>
        <Column :header="t('payroll.period')">
          <template #body="{ data }"><strong>{{ formatPeriod(data.year, data.month) }}</strong></template>
        </Column>
        <Column v-if="auth.isStaff" :header="t('common.employee')">
          <template #body="{ data }">{{ person(data.employeeName) }}</template>
        </Column>
        <Column v-if="auth.isStaff" :header="t('common.department')">
          <template #body="{ data }">{{ term(data.departmentName) }}</template>
        </Column>
        <Column :header="t('payroll.gross')">
          <template #body="{ data }"><span class="money">{{ formatMoney(data.grossSalary) }}</span></template>
        </Column>
        <Column :header="t('payroll.deductions')">
          <template #body="{ data }"><span class="money muted">{{ formatMoney(data.deductions) }}</span></template>
        </Column>
        <Column :header="t('payroll.netPay')">
          <template #body="{ data }"><strong class="money">{{ formatMoney(data.netSalary) }}</strong></template>
        </Column>
        <Column header="" :style="{ width: '4rem' }">
          <template #body="{ data }">
            <Button icon="pi pi-eye" text rounded :aria-label="t('payroll.view')" @click.stop="view(data)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <PayslipDialog v-model:visible="payslipOpen" :record="payslip" />

    <Dialog v-model:visible="runOpen" modal :header="t('payroll.runTitle')" :style="{ width: '26rem' }" :breakpoints="{ '640px': '95vw' }">
      <p class="muted intro">{{ t('payroll.runIntro') }}</p>
      <div class="form-grid">
        <div class="field"><label for="run-month">{{ t('common.month') }}</label>
          <Select input-id="run-month" v-model="period.month" :options="months" option-label="label" option-value="value" /></div>
        <div class="field"><label for="run-year">{{ t('common.year') }}</label>
          <Select input-id="run-year" v-model="period.year" :options="yearOptions" /></div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="runOpen = false" />
        <Button :label="t('payroll.runButton')" icon="pi pi-play" :loading="busy" @click="runMonth" />
      </template>
    </Dialog>

    <Dialog v-model:visible="generateOpen" modal :header="t('payroll.generateTitle')" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
      <div class="form-grid">
        <div class="field full"><label for="gen-employee">{{ t('common.employee') }}</label>
          <Select input-id="gen-employee" v-model="single.employeeId" :options="employeeOptions" option-label="label" option-value="id"
            filter :placeholder="t('payroll.chooseEmployee')" /></div>
        <div class="field"><label for="gen-month">{{ t('common.month') }}</label>
          <Select input-id="gen-month" v-model="period.month" :options="months" option-label="label" option-value="value" /></div>
        <div class="field"><label for="gen-year">{{ t('common.year') }}</label>
          <Select input-id="gen-year" v-model="period.year" :options="yearOptions" /></div>
        <div class="field full"><label for="gen-bonus">{{ t('payroll.bonus') }}</label>
          <InputNumber input-id="gen-bonus" v-model="single.bonus" mode="currency" currency="ILS" locale="en-IL" :min="0" fluid /></div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="generateOpen = false" />
        <Button :label="t('payroll.generate')" icon="pi pi-check" :disabled="!single.employeeId" :loading="busy" @click="generate" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.intro { margin-top: 0; line-height: 1.5; }
:deep(.p-datatable-tbody > tr) { cursor: pointer; }
</style>
