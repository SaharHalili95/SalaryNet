<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import { useToast } from 'primevue/usetoast'
import { reactive, ref, watch } from 'vue'
import { api } from '@/api'
import { useApiError } from '@/utils/useApiError'

const visible = defineModel<boolean>('visible', { required: true })
const handleError = useApiError()
const toast = useToast()
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const form = reactive({ currentPassword: '', newPassword: '', confirm: '' })

watch(visible, (open) => {
  if (!open) return
  Object.assign(form, { currentPassword: '', newPassword: '', confirm: '' })
  errors.value = {}
})

async function save() {
  errors.value = {}
  if (form.newPassword !== form.confirm) {
    errors.value = { confirm: 'The passwords do not match.' }
    return
  }
  saving.value = true
  try {
    await api().changePassword(form.currentPassword, form.newPassword)
    toast.add({ severity: 'success', summary: 'Password changed', life: 3000 })
    visible.value = false
  } catch (e) {
    errors.value = handleError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Change password" :style="{ width: '26rem' }" :breakpoints="{ '640px': '95vw' }">
    <form id="change-password-form" class="form-grid" @submit.prevent="save">
      <div class="field full">
        <label for="current-password">Current password</label>
        <Password v-model="form.currentPassword" input-id="current-password" :feedback="false" toggle-mask
          autocomplete="current-password" :invalid="!!errors.currentPassword" fluid />
        <small v-if="errors.currentPassword" class="error">{{ errors.currentPassword }}</small>
      </div>
      <div class="field full">
        <label for="new-password">New password</label>
        <Password v-model="form.newPassword" input-id="new-password" :feedback="false" toggle-mask
          autocomplete="new-password" :invalid="!!errors.newPassword" fluid />
        <small v-if="errors.newPassword" class="error">{{ errors.newPassword }}</small>
        <small v-else class="muted">At least 8 characters, with an uppercase letter, a lowercase letter and a digit.</small>
      </div>
      <div class="field full">
        <label for="confirm-password">Confirm new password</label>
        <Password v-model="form.confirm" input-id="confirm-password" :feedback="false" toggle-mask
          autocomplete="new-password" :invalid="!!errors.confirm" fluid />
        <small v-if="errors.confirm" class="error">{{ errors.confirm }}</small>
      </div>
    </form>
    <template #footer>
      <Button label="Cancel" text @click="visible = false" />
      <Button type="submit" form="change-password-form" label="Change password" icon="pi pi-check" :loading="saving" />
    </template>
  </Dialog>
</template>
