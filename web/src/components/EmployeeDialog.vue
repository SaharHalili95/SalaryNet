<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import type { Department, Employee, EmploymentType, SaveEmployeeRequest } from '@/api/types'
import { useApiError } from '@/utils/useApiError'

const props = defineProps<{ employee: Employee | null; departments: Department[] }>()
const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ saved: [employee: Employee] }>()

const handleError = useApiError()
const { t } = useI18n()
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const form = reactive<SaveEmployeeRequest>({ firstName: '', lastName: '', email: '', departmentId: '', baseSalary: 0, employmentType: 'FullTime' })
const types = computed(() => (['FullTime', 'PartTime', 'Contractor'] as EmploymentType[]).map((value) => ({ value, label: t(`employmentType.${value}`) })))

watch(visible, (open) => {
  if (!open) return
  errors.value = {}
  const e = props.employee
  Object.assign(form, e
    ? { firstName: e.firstName, lastName: e.lastName, email: e.email, departmentId: e.departmentId, baseSalary: e.baseSalary, employmentType: e.employmentType }
    : { firstName: '', lastName: '', email: '', departmentId: props.departments[0]?.id ?? '', baseSalary: 12_000, employmentType: 'FullTime' })
})

async function save() {
  saving.value = true
  errors.value = {}
  try {
    const saved = props.employee
      ? await api().employees.update(props.employee.id, { ...form })
      : await api().employees.create({ ...form })
    emit('saved', saved)
    visible.value = false
  } catch (e) {
    errors.value = handleError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="employee ? t('employees.dialogEdit') : t('employees.dialogNew')" :style="{ width: '36rem' }"
    :breakpoints="{ '640px': '95vw' }">
    <form id="employee-form" class="form-grid" @submit.prevent="save">
      <div class="field">
        <label for="firstName">{{ t('employees.firstName') }}</label>
        <InputText id="firstName" v-model="form.firstName" :invalid="!!errors.firstName" />
        <small v-if="errors.firstName" class="error">{{ errors.firstName }}</small>
      </div>
      <div class="field">
        <label for="lastName">{{ t('employees.lastName') }}</label>
        <InputText id="lastName" v-model="form.lastName" :invalid="!!errors.lastName" />
        <small v-if="errors.lastName" class="error">{{ errors.lastName }}</small>
      </div>
      <div class="field full">
        <label for="email">{{ t('employees.workEmail') }}</label>
        <InputText id="email" v-model="form.email" type="email" :invalid="!!errors.email" />
        <small v-if="errors.email" class="error">{{ errors.email }}</small>
      </div>
      <div class="field">
        <label for="department">{{ t('common.department') }}</label>
        <Select input-id="department" v-model="form.departmentId" :options="departments" option-label="name" option-value="id"
          :invalid="!!errors.departmentId" />
        <small v-if="errors.departmentId" class="error">{{ errors.departmentId }}</small>
      </div>
      <div class="field">
        <label for="type">{{ t('employees.employmentType') }}</label>
        <Select input-id="type" v-model="form.employmentType" :options="types" option-label="label" option-value="value" />
      </div>
      <div class="field full">
        <label for="salary">{{ t('employees.monthlySalary') }}</label>
        <InputNumber input-id="salary" v-model="form.baseSalary" mode="currency" currency="ILS" locale="en-IL"
          :min="0" :max-fraction-digits="2" :invalid="!!errors.baseSalary" fluid />
        <small v-if="errors.baseSalary" class="error">{{ errors.baseSalary }}</small>
      </div>
    </form>
    <template #footer>
      <Button :label="t('common.cancel')" text @click="visible = false" />
      <Button type="submit" form="employee-form" :label="employee ? t('common.saveChanges') : t('employees.createButton')" icon="pi pi-check" :loading="saving" />
    </template>
  </Dialog>
</template>
