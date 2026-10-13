<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import { usePrimeVue } from 'primevue/config'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { startDemoSimulation } from '@/api'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const { t, locale } = useI18n()
const primevue = usePrimeVue()

// PrimeVue's own built-in texts (empty dropdowns, filters) follow the app language.
watch(locale, (value) => {
  const hebrew = value === 'he'
  Object.assign(primevue.config.locale ?? {}, {
    emptyMessage: hebrew ? 'אין אפשרויות' : 'No available options',
    emptyFilterMessage: hebrew ? 'לא נמצאו תוצאות' : 'No results found',
    emptySearchMessage: hebrew ? 'לא נמצאו תוצאות' : 'No results found',
    accept: hebrew ? 'כן' : 'Yes',
    reject: hebrew ? 'לא' : 'No',
  })
}, { immediate: true })
const auth = useAuthStore()

const stop = startDemoSimulation((change) => {
  if (!auth.isStaff) return
  toast.add({
    severity: change.kind === 'hire' ? 'info' : 'secondary',
    summary: t(`simulation.${change.kind}`),
    detail: t(`simulation.${change.kind}Detail`, { name: change.name, department: change.department }),
    life: 6000,
  })
})
onBeforeUnmount(stop)
</script>

<template>
  <Toast :position="$i18n.locale === 'he' ? 'top-left' : 'top-right'" />
  <ConfirmDialog />
  <RouterView />
</template>
