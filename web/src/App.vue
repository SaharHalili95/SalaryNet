<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { onBeforeUnmount } from 'vue'
import { startDemoSimulation } from '@/api'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const auth = useAuthStore()

const stop = startDemoSimulation((change) => {
  if (!auth.isStaff) return
  toast.add({
    severity: change.kind === 'hire' ? 'info' : 'secondary',
    summary: change.kind === 'hire' ? 'New hire' : 'Employee left',
    detail: change.kind === 'hire'
      ? `${change.name} joined ${change.department}.`
      : `${change.name} left ${change.department}.`,
    life: 6000,
  })
})
onBeforeUnmount(stop)
</script>

<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <RouterView />
</template>
