<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import type { Department, Employee, EmployeeQuery, EmployeeSortField, EmploymentType, PagedResult } from '@/api/types'
import EmployeeDialog from '@/components/EmployeeDialog.vue'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { formatDate, formatMoney } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const handleError = useApiError()
const confirm = useConfirm()
const toast = useToast()
const { t } = useI18n()
const { term, person } = useLocalizedData()

const departments = ref<Department[]>([])
const result = ref<PagedResult<Employee>>({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 })
const loading = ref(false)
const dialogOpen = ref(false)
const editing = ref<Employee | null>(null)

const query = reactive<EmployeeQuery>({ page: 1, pageSize: 10, search: '', sortBy: 'LastName', sortDirection: 'Asc', isActive: true })
const typeOptions = computed(() =>
  (['FullTime', 'PartTime', 'Contractor'] as EmploymentType[]).map((value) => ({ value, label: t(`employmentType.${value}`) })))
const departmentOptions = computed(() => departments.value.map((d) => ({ id: d.id, name: term(d.name) })))
const statusOptions = computed(() => [{ label: t('common.active'), value: true }, { label: t('common.inactive'), value: false }])
const sortFields: Record<string, EmployeeSortField> = { lastName: 'LastName', baseSalary: 'BaseSalary', createdAt: 'CreatedAt' }

async function load() {
  loading.value = true
  try {
    result.value = await api().employees.search({ ...query, search: query.search || undefined })
  } catch (e) {
    handleError(e)
  } finally {
    loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(() => query.search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { query.page = 1; load() }, 300)
})
watch(() => [query.departmentId, query.employmentType, query.isActive], () => { query.page = 1; load() })

function onPage(e: DataTablePageEvent) {
  query.page = e.page + 1
  query.pageSize = e.rows
  load()
}

function onSort(e: DataTableSortEvent) {
  query.sortBy = sortFields[String(e.sortField)] ?? 'LastName'
  query.sortDirection = e.sortOrder === -1 ? 'Desc' : 'Asc'
  load()
}

function openDialog(employee: Employee | null) {
  editing.value = employee
  dialogOpen.value = true
}

function onSaved(employee: Employee) {
  toast.add({ severity: 'success', summary: editing.value ? t('employees.updated') : t('employees.created'), detail: `${employee.firstName} ${employee.lastName}`, life: 3000 })
  load()
}

function toggleActive(employee: Employee) {
  const activate = !employee.isActive
  confirm.require({
    header: activate ? t('employees.reactivateHeader') : t('employees.deactivateHeader'),
    message: t(activate ? 'employees.reactivateMessage' : 'employees.deactivateMessage', { name: `${employee.firstName} ${employee.lastName}` }),
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: activate ? t('employees.reactivate') : t('employees.deactivate'), severity: activate ? 'primary' : 'danger' },
    rejectProps: { label: t('common.cancel'), text: true },
    accept: async () => {
      try {
        await api().employees.setActive(employee.id, activate)
        toast.add({ severity: 'success', summary: activate ? t('employees.reactivated') : t('employees.deactivated'), life: 3000 })
        load()
      } catch (e) {
        handleError(e)
      }
    },
  })
}

onMounted(async () => {
  try {
    departments.value = await api().departments.list()
  } catch (e) {
    handleError(e)
  }
  load()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('employees.title') }}</h1>
        <p>{{ t('employees.subtitle', { count: result.totalCount }) }}</p>
      </div>
      <Button :label="t('employees.new')" icon="pi pi-plus" @click="openDialog(null)" />
    </div>

    <section class="panel">
      <div class="toolbar">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="query.search" :placeholder="t('employees.search')" :aria-label="t('employees.search')" />
        </IconField>
        <Select v-model="query.departmentId" :options="departmentOptions" option-label="name" option-value="id"
          :placeholder="t('common.allDepartments')" show-clear :aria-label="t('common.department')" />
        <Select v-model="query.employmentType" :options="typeOptions" option-label="label" option-value="value"
          :placeholder="t('employees.allContracts')" show-clear :aria-label="t('employees.employmentType')" />
        <Select v-model="query.isActive" :options="statusOptions" option-label="label" option-value="value"
          :placeholder="t('common.anyStatus')" show-clear :aria-label="t('common.status')" />
      </div>

      <DataTable :value="result.items" lazy paginator :rows="query.pageSize" :total-records="result.totalCount"
        :first="((query.page ?? 1) - 1) * (query.pageSize ?? 10)" :rows-per-page-options="[10, 20, 50]" :loading="loading"
        data-key="id" removable-sort striped-rows scrollable @page="onPage" @sort="onSort">
        <template #empty><div class="muted">{{ t('employees.empty') }}</div></template>
        <Column field="lastName" :header="t('employees.name')" sortable>
          <template #body="{ data }">
            <div class="name">
              <strong>{{ person(`${data.firstName} ${data.lastName}`) }}</strong>
              <span class="muted">{{ data.email }}</span>
            </div>
          </template>
        </Column>
        <Column field="departmentName" :header="t('common.department')">
          <template #body="{ data }">{{ term(data.departmentName) }}</template>
        </Column>
        <Column field="employmentType" :header="t('employees.contract')">
          <template #body="{ data }">{{ t(`employmentType.${data.employmentType}`) }}</template>
        </Column>
        <Column field="baseSalary" :header="t('employees.baseSalary')" sortable>
          <template #body="{ data }"><span class="money">{{ formatMoney(data.baseSalary) }}</span></template>
        </Column>
        <Column field="createdAt" :header="t('employees.joined')" sortable>
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column :header="t('common.status')">
          <template #body="{ data }">
            <Tag :value="data.isActive ? t('common.active') : t('common.inactive')" :severity="data.isActive ? 'success' : 'secondary'" />
          </template>
        </Column>
        <Column header="" :style="{ width: '6rem' }">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="pi pi-pencil" text rounded :aria-label="t('common.edit')" v-tooltip.top="t('common.edit')" @click="openDialog(data)" />
              <Button :icon="data.isActive ? 'pi pi-user-minus' : 'pi pi-user-plus'" text rounded
                :severity="data.isActive ? 'danger' : 'success'" :aria-label="data.isActive ? t('employees.deactivate') : t('employees.reactivate')"
                v-tooltip.top="data.isActive ? t('employees.deactivate') : t('employees.reactivate')" @click="toggleActive(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <EmployeeDialog v-model:visible="dialogOpen" :employee="editing" :departments="departments" @saved="onSaved" />
  </div>
</template>

<style scoped>
.name { display: flex; flex-direction: column; gap: 0.125rem; }
.name span { font-size: 0.8125rem; }
.actions { display: flex; gap: 0.125rem; justify-content: flex-end; }
</style>
