<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, ref } from 'vue'
import { api } from '@/api'
import type { Department } from '@/api/types'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/utils/useApiError'

const auth = useAuthStore()
const handleError = useApiError()
const confirm = useConfirm()
const toast = useToast()

const departments = ref<Department[]>([])
const dialogOpen = ref(false)
const editing = ref<Department | null>(null)
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const form = reactive({ name: '', description: '' })

async function load() {
  try {
    departments.value = await api().departments.list()
  } catch (e) {
    handleError(e)
  }
}

function open(department: Department | null) {
  editing.value = department
  form.name = department?.name ?? ''
  form.description = department?.description ?? ''
  errors.value = {}
  dialogOpen.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) await api().departments.update(editing.value.id, { ...form })
    else await api().departments.create({ ...form })
    dialogOpen.value = false
    toast.add({ severity: 'success', summary: editing.value ? 'Department updated' : 'Department created', life: 3000 })
    load()
  } catch (e) {
    errors.value = handleError(e)
  } finally {
    saving.value = false
  }
}

function remove(department: Department) {
  confirm.require({
    header: 'Delete department',
    message: `Delete "${department.name}"? Only empty departments can be deleted.`,
    icon: 'pi pi-trash',
    acceptProps: { label: 'Delete', severity: 'danger' },
    rejectProps: { label: 'Cancel', text: true },
    accept: async () => {
      try {
        await api().departments.remove(department.id)
        toast.add({ severity: 'success', summary: 'Department deleted', life: 3000 })
        load()
      } catch (e) {
        handleError(e)
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Departments</h1>
        <p v-if="auth.isAdmin">Only administrators can create, rename or delete departments.</p>
        <p v-else>Read-only for HR. Ask an administrator to change the structure.</p>
      </div>
      <Button v-if="auth.isAdmin" label="New department" icon="pi pi-plus" @click="open(null)" />
    </div>

    <div class="cards">
      <article v-for="d in departments" :key="d.id" class="panel card">
        <div class="card-head">
          <h2>{{ d.name }}</h2>
          <div v-if="auth.isAdmin" class="actions">
            <Button icon="pi pi-pencil" text rounded size="small" aria-label="Edit" @click="open(d)" />
            <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Delete" @click="remove(d)" />
          </div>
        </div>
        <p class="muted">{{ d.description || 'No description' }}</p>
        <div class="stats">
          <div><strong>{{ d.activeEmployeeCount }}</strong><span class="muted">active</span></div>
          <div><strong>{{ d.employeeCount }}</strong><span class="muted">total</span></div>
        </div>
      </article>
    </div>

    <Dialog v-model:visible="dialogOpen" modal :header="editing ? 'Edit department' : 'New department'" :style="{ width: '30rem' }"
      :breakpoints="{ '640px': '95vw' }">
      <form id="department-form" class="form-grid" @submit.prevent="save">
        <div class="field full">
          <label for="dept-name">Name</label>
          <InputText id="dept-name" v-model="form.name" :invalid="!!errors.name" />
          <small v-if="errors.name" class="error">{{ errors.name }}</small>
        </div>
        <div class="field full">
          <label for="dept-description">Description</label>
          <Textarea id="dept-description" v-model="form.description" rows="3" auto-resize />
        </div>
      </form>
      <template #footer>
        <Button label="Cancel" text @click="dialogOpen = false" />
        <Button type="submit" form="department-form" label="Save" icon="pi pi-check" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.card { display: flex; flex-direction: column; gap: 0.5rem; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.card-head h2 { margin: 0; }
.card p { margin: 0; min-height: 2.5em; }
.actions { display: flex; }
.stats { display: flex; gap: 1.5rem; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--app-border); }
.stats div { display: flex; align-items: baseline; gap: 0.375rem; }
.stats strong { font-size: 1.25rem; }
</style>
