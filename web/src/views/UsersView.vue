<script setup lang="ts">
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import type { MenuItem } from 'primevue/menuitem'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import type { Employee, PagedResult, UserAccount, UserQuery, UserRole } from '@/api/types'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { useAuthStore } from '@/stores/auth'
import { formatDate, formatTime } from '@/utils/format'
import { useApiError } from '@/utils/useApiError'

const auth = useAuthStore()
const handleError = useApiError()
const confirm = useConfirm()
const toast = useToast()
const { t } = useI18n()
const { term, person } = useLocalizedData()

const roles = computed(() => (['Admin', 'HR', 'Employee'] as UserRole[]).map((value) => ({ value, label: t(`roles.${value}`) })))
const statusOptions = computed(() => [{ label: t('common.active'), value: true }, { label: t('common.inactive'), value: false }])

const result = ref<PagedResult<UserAccount>>({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 })
const loading = ref(false)
const query = reactive<UserQuery>({ page: 1, pageSize: 10, search: '' })
const employees = ref<Employee[]>([])
const employeeOptions = computed(() =>
  employees.value.map((e) => ({ id: e.id, label: `${person(`${e.firstName} ${e.lastName}`)} · ${term(e.departmentName)}` })))

async function load() {
  loading.value = true
  try {
    result.value = await api().users.search({ ...query, search: query.search || undefined })
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
watch(() => [query.role, query.isActive], () => { query.page = 1; load() })

function onPage(e: DataTablePageEvent) {
  query.page = e.page + 1
  query.pageSize = e.rows
  load()
}

async function ensureEmployees() {
  if (employees.value.length) return
  try {
    employees.value = (await api().employees.search({ isActive: true, pageSize: 100 })).items
  } catch (e) {
    handleError(e)
  }
}

function statusOf(u: UserAccount): { label: string; severity: 'success' | 'warn' | 'secondary' } {
  if (!u.isActive) return { label: t('common.inactive'), severity: 'secondary' }
  if (u.isLockedOut) return { label: t('users.locked'), severity: 'warn' }
  return { label: t('common.active'), severity: 'success' }
}

const isSelf = (u: UserAccount) => u.id === auth.user?.id

async function run(action: () => Promise<UserAccount>, message: string) {
  try {
    await action()
    toast.add({ severity: 'success', summary: message, life: 3000 })
    load()
  } catch (e) {
    handleError(e)
  }
}

/* Create */
const createOpen = ref(false)
const creating = ref(false)
const createErrors = ref<Record<string, string>>({})
const createForm = reactive({ email: '', displayName: '', password: '', role: 'HR' as UserRole, employeeId: null as string | null })

async function openCreate() {
  Object.assign(createForm, { email: '', displayName: '', password: '', role: 'HR', employeeId: null })
  createErrors.value = {}
  createOpen.value = true
  await ensureEmployees()
}

async function create() {
  creating.value = true
  createErrors.value = {}
  try {
    const u = await api().users.create({
      ...createForm,
      employeeId: createForm.role === 'Employee' ? createForm.employeeId : null,
      displayName: createForm.role === 'Employee' ? null : createForm.displayName,
    })
    toast.add({ severity: 'success', summary: t('users.createdToast'), detail: u.email, life: 3000 })
    createOpen.value = false
    load()
  } catch (e) {
    createErrors.value = handleError(e)
  } finally {
    creating.value = false
  }
}

/* Change role */
const roleOpen = ref(false)
const roleTarget = ref<UserAccount | null>(null)
const roleForm = reactive({ role: 'HR' as UserRole, employeeId: null as string | null })

async function openRole(u: UserAccount) {
  roleTarget.value = u
  Object.assign(roleForm, { role: u.role, employeeId: u.employeeId })
  roleOpen.value = true
  await ensureEmployees()
}

async function saveRole() {
  const target = roleTarget.value!
  await run(
    () => api().users.changeRole(target.id, roleForm.role, roleForm.role === 'Employee' ? roleForm.employeeId : null),
    t('users.roleUpdated'),
  )
  roleOpen.value = false
}

/* Reset password */
const resetOpen = ref(false)
const resetTarget = ref<UserAccount | null>(null)
const resetPassword = ref('')
const resetErrors = ref<Record<string, string>>({})

function openReset(u: UserAccount) {
  resetTarget.value = u
  resetPassword.value = ''
  resetErrors.value = {}
  resetOpen.value = true
}

async function saveReset() {
  resetErrors.value = {}
  try {
    await api().users.resetPassword(resetTarget.value!.id, resetPassword.value)
    toast.add({ severity: 'success', summary: t('users.resetDone'), detail: t('users.resetDetail'), life: 4000 })
    resetOpen.value = false
    load()
  } catch (e) {
    resetErrors.value = handleError(e)
  }
}

/* Row actions */
const menu = ref<InstanceType<typeof Menu>>()
const menuItems = ref<MenuItem[]>([])

function openMenu(event: Event, u: UserAccount) {
  menuItems.value = [
    ...(u.isLockedOut ? [{ label: t('users.unlock'), icon: 'pi pi-lock-open', command: () => run(() => api().users.unlock(u.id), t('users.unlocked')) }] : []),
    { label: t('users.changeRole'), icon: 'pi pi-id-card', disabled: isSelf(u), command: () => openRole(u) },
    { label: t('users.resetPassword'), icon: 'pi pi-key', command: () => openReset(u) },
    u.isActive
      ? { label: t('users.deactivate'), icon: 'pi pi-ban', disabled: isSelf(u), command: () => confirmDeactivate(u) }
      : { label: t('users.reactivate'), icon: 'pi pi-check-circle', command: () => run(() => api().users.setActive(u.id, true), t('users.reactivated')) },
  ]
  menu.value?.toggle(event)
}

function confirmDeactivate(u: UserAccount) {
  confirm.require({
    header: t('users.deactivateHeader'),
    message: t('users.deactivateMessage', { email: u.email }),
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: t('users.deactivate'), severity: 'danger' },
    rejectProps: { label: t('common.cancel'), text: true },
    accept: () => run(() => api().users.setActive(u.id, false), t('users.deactivated')),
  })
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('users.title') }}</h1>
        <p>{{ t('users.subtitle') }}</p>
      </div>
      <Button :label="t('users.new')" icon="pi pi-user-plus" @click="openCreate" />
    </div>

    <section class="panel">
      <div class="toolbar">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="query.search" :placeholder="t('users.search')" :aria-label="t('users.search')" />
        </IconField>
        <Select v-model="query.role" :options="roles" option-label="label" option-value="value" :placeholder="t('users.allRoles')" show-clear :aria-label="t('users.role')" />
        <Select v-model="query.isActive" :options="statusOptions" option-label="label" option-value="value" :placeholder="t('common.anyStatus')" show-clear :aria-label="t('common.status')" />
      </div>

      <DataTable :value="result.items" lazy paginator :rows="query.pageSize" :total-records="result.totalCount"
        :first="((query.page ?? 1) - 1) * (query.pageSize ?? 10)" :rows-per-page-options="[10, 20, 50]" :loading="loading"
        data-key="id" striped-rows scrollable @page="onPage">
        <template #empty><div class="muted">{{ t('users.empty') }}</div></template>
        <Column :header="t('users.account')">
          <template #body="{ data }">
            <div class="name">
              <strong>{{ data.email }} <span v-if="isSelf(data)" class="muted">{{ t('users.you') }}</span></strong>
              <span class="muted">{{ person(data.employeeName ?? data.displayName) || t('users.staffAccount') }}</span>
            </div>
          </template>
        </Column>
        <Column :header="t('users.role')">
          <template #body="{ data }">{{ t(`roles.${data.role}`) }}</template>
        </Column>
        <Column :header="t('common.status')">
          <template #body="{ data }">
            <div class="status">
              <Tag :value="statusOf(data).label" :severity="statusOf(data).severity" />
              <small v-if="data.isLockedOut && data.lockoutEndsAt" class="muted">{{ t('users.until', { time: formatTime(data.lockoutEndsAt) }) }}</small>
              <small v-else-if="data.isActive && data.failedLoginCount > 0" class="muted">{{ t('users.failedAttempts', { count: data.failedLoginCount }) }}</small>
            </div>
          </template>
        </Column>
        <Column :header="t('users.created')">
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column header="" :style="{ width: '4rem' }">
          <template #body="{ data }">
            <Button icon="pi pi-ellipsis-v" text rounded :aria-label="t('users.actions')" aria-haspopup="true" @click="openMenu($event, data)" />
          </template>
        </Column>
      </DataTable>
      <Menu ref="menu" :model="menuItems" popup />
    </section>

    <Dialog v-model:visible="createOpen" modal :header="t('users.new')" :style="{ width: '30rem' }" :breakpoints="{ '640px': '95vw' }">
      <form id="create-user-form" class="form-grid" @submit.prevent="create">
        <div class="field full">
          <label for="user-email">{{ t('common.email') }}</label>
          <InputText id="user-email" v-model="createForm.email" type="email" :invalid="!!createErrors.email" />
          <small v-if="createErrors.email" class="error">{{ createErrors.email }}</small>
        </div>
        <div class="field full">
          <label for="user-password">{{ t('users.initialPassword') }}</label>
          <Password v-model="createForm.password" input-id="user-password" :feedback="false" toggle-mask
            autocomplete="new-password" :invalid="!!createErrors.password" fluid />
          <small v-if="createErrors.password" class="error">{{ createErrors.password }}</small>
          <small v-else class="muted">{{ t('common.passwordPolicy') }}</small>
        </div>
        <div class="field full">
          <label for="user-role">{{ t('users.role') }}</label>
          <Select input-id="user-role" v-model="createForm.role" :options="roles" option-label="label" option-value="value" />
        </div>
        <div v-if="createForm.role !== 'Employee'" class="field full">
          <label for="user-name">{{ t('users.fullName') }}</label>
          <InputText id="user-name" v-model="createForm.displayName" :invalid="!!createErrors.displayName" />
          <small v-if="createErrors.displayName" class="error">{{ createErrors.displayName }}</small>
        </div>
        <div v-if="createForm.role === 'Employee'" class="field full">
          <label for="user-employee">{{ t('common.employee') }}</label>
          <Select input-id="user-employee" v-model="createForm.employeeId" :options="employeeOptions" option-label="label"
            option-value="id" filter :placeholder="t('payroll.chooseEmployee')" :invalid="!!createErrors.employeeId" />
          <small v-if="createErrors.employeeId" class="error">{{ createErrors.employeeId }}</small>
        </div>
      </form>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createOpen = false" />
        <Button type="submit" form="create-user-form" :label="t('users.createButton')" icon="pi pi-check" :loading="creating" />
      </template>
    </Dialog>

    <Dialog v-model:visible="roleOpen" modal :header="t('users.changeRole')" :style="{ width: '28rem' }" :breakpoints="{ '640px': '95vw' }">
      <div class="form-grid">
        <p class="full muted intro">{{ roleTarget?.email }}</p>
        <div class="field full">
          <label for="change-role">{{ t('users.role') }}</label>
          <Select input-id="change-role" v-model="roleForm.role" :options="roles" option-label="label" option-value="value" />
        </div>
        <div v-if="roleForm.role === 'Employee'" class="field full">
          <label for="change-employee">{{ t('common.employee') }}</label>
          <Select input-id="change-employee" v-model="roleForm.employeeId" :options="employeeOptions" option-label="label"
            option-value="id" filter :placeholder="t('payroll.chooseEmployee')" />
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="roleOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="saveRole" />
      </template>
    </Dialog>

    <Dialog v-model:visible="resetOpen" modal :header="t('users.resetPassword')" :style="{ width: '28rem' }" :breakpoints="{ '640px': '95vw' }">
      <form id="reset-password-form" class="form-grid" @submit.prevent="saveReset">
        <p class="full muted intro">{{ t('users.resetIntro', { email: resetTarget?.email }) }}</p>
        <div class="field full">
          <label for="reset-password">{{ t('users.newPassword') }}</label>
          <Password v-model="resetPassword" input-id="reset-password" :feedback="false" toggle-mask
            autocomplete="new-password" :invalid="!!resetErrors.newPassword" fluid />
          <small v-if="resetErrors.newPassword" class="error">{{ resetErrors.newPassword }}</small>
        </div>
      </form>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="resetOpen = false" />
        <Button type="submit" form="reset-password-form" :label="t('users.resetPassword')" icon="pi pi-key" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.name { display: flex; flex-direction: column; gap: 0.125rem; }
.name span { font-size: 0.8125rem; }
.status { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
.intro { margin: 0; }
</style>
