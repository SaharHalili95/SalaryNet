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
import { onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/api'
import type { Department, Employee, EmployeeQuery, EmployeeSortField, EmploymentType, PagedResult } from '@/api/types'
import EmployeeDialog from '@/components/EmployeeDialog.vue'
import { employmentTypeLabel, formatDate, formatMoney } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const handleError = useApiError()
const confirm = useConfirm()
const toast = useToast()

const departments = ref<Department[]>([])
const result = ref<PagedResult<Employee>>({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 })
const loading = ref(false)
const dialogOpen = ref(false)
const editing = ref<Employee | null>(null)

const query = reactive<EmployeeQuery>({ page: 1, pageSize: 10, search: '', sortBy: 'LastName', sortDirection: 'Asc', isActive: true })
const typeOptions = (Object.keys(employmentTypeLabel) as EmploymentType[]).map((value) => ({ value, label: employmentTypeLabel[value] }))
const statusOptions = [{ label: 'Active', value: true }, { label: 'Inactive', value: false }]
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
  toast.add({ severity: 'success', summary: editing.value ? 'Employee updated' : 'Employee created', detail: `${employee.firstName} ${employee.lastName}`, life: 3000 })
  load()
}

function toggleActive(employee: Employee) {
  const activate = !employee.isActive
  confirm.require({
    header: activate ? 'Reactivate employee' : 'Deactivate employee',
    message: activate
      ? `Reactivate ${employee.firstName} ${employee.lastName}?`
      : `Deactivate ${employee.firstName} ${employee.lastName}? They will be excluded from future payroll runs.`,
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: activate ? 'Reactivate' : 'Deactivate', severity: activate ? 'primary' : 'danger' },
    rejectProps: { label: 'Cancel', text: true },
    accept: async () => {
      try {
        await api().employees.setActive(employee.id, activate)
        toast.add({ severity: 'success', summary: activate ? 'Reactivated' : 'Deactivated', life: 3000 })
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
        <h1>Employees</h1>
        <p>{{ result.totalCount }} matching employees. Search, filter and sort run on the server.</p>
      </div>
      <Button label="New employee" icon="pi pi-plus" @click="openDialog(null)" />
    </div>

    <section class="panel">
      <div class="toolbar">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="query.search" placeholder="Search name or email" aria-label="Search employees" />
        </IconField>
        <Select v-model="query.departmentId" :options="departments" option-label="name" option-value="id"
          placeholder="All departments" show-clear aria-label="Department" />
        <Select v-model="query.employmentType" :options="typeOptions" option-label="label" option-value="value"
          placeholder="All contracts" show-clear aria-label="Employment type" />
        <Select v-model="query.isActive" :options="statusOptions" option-label="label" option-value="value"
          placeholder="Any status" show-clear aria-label="Status" />
      </div>

      <DataTable :value="result.items" lazy paginator :rows="query.pageSize" :total-records="result.totalCount"
        :first="((query.page ?? 1) - 1) * (query.pageSize ?? 10)" :rows-per-page-options="[10, 20, 50]" :loading="loading"
        data-key="id" removable-sort striped-rows scrollable @page="onPage" @sort="onSort">
        <template #empty><div class="muted">No employees match these filters.</div></template>
        <Column field="lastName" header="Name" sortable>
          <template #body="{ data }">
            <div class="name">
              <strong>{{ data.firstName }} {{ data.lastName }}</strong>
              <span class="muted">{{ data.email }}</span>
            </div>
          </template>
        </Column>
        <Column field="departmentName" header="Department" />
        <Column field="employmentType" header="Contract">
          <template #body="{ data }">{{ employmentTypeLabel[data.employmentType as EmploymentType] }}</template>
        </Column>
        <Column field="baseSalary" header="Base salary" sortable>
          <template #body="{ data }"><span class="money">{{ formatMoney(data.baseSalary) }}</span></template>
        </Column>
        <Column field="createdAt" header="Joined" sortable>
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column header="Status">
          <template #body="{ data }">
            <Tag :value="data.isActive ? 'Active' : 'Inactive'" :severity="data.isActive ? 'success' : 'secondary'" />
          </template>
        </Column>
        <Column header="" :style="{ width: '6rem' }">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="pi pi-pencil" text rounded aria-label="Edit" v-tooltip.top="'Edit'" @click="openDialog(data)" />
              <Button :icon="data.isActive ? 'pi pi-user-minus' : 'pi pi-user-plus'" text rounded
                :severity="data.isActive ? 'danger' : 'success'" :aria-label="data.isActive ? 'Deactivate' : 'Reactivate'"
                v-tooltip.top="data.isActive ? 'Deactivate' : 'Reactivate'" @click="toggleActive(data)" />
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
