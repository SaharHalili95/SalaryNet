<script setup lang="ts">
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import type { Employee } from '@shared/api/types'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { formatDate, formatPeriod } from '@/utils/format'

const props = defineProps<{ activeEmployees: number }>()
const { t } = useI18n()
const router = useRouter()
const { term, person } = useLocalizedData()

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1
const paid = ref<number | null>(null)
const hires = ref<Employee[]>([])
const percent = computed(() => (paid.value === null || props.activeEmployees === 0 ? 0 : Math.round((paid.value / props.activeEmployees) * 100)))

onMounted(async () => {
  const [payroll, recent] = await Promise.all([
    api().payroll.search({ year, month, pageSize: 1 }),
    api().employees.search({ isActive: true, sortBy: 'CreatedAt', sortDirection: 'Desc', pageSize: 5 }),
  ])
  paid.value = payroll.totalCount
  hires.value = recent.items
})
</script>

<template>
  <div class="focus">
    <section class="panel">
      <h2>{{ t('focus.payrollThisMonth', { period: formatPeriod(year, month) }) }}</h2>
      <template v-if="paid !== null">
        <ProgressBar :value="percent" :show-value="false" style="height: 8px" />
        <p class="muted">{{ paid >= activeEmployees ? t('focus.allDone') : t('focus.generatedOf', { done: paid, total: activeEmployees }) }}</p>
        <Button v-if="paid < activeEmployees" :label="t('focus.runPayroll')" icon="pi pi-play" size="small"
          @click="router.push({ name: 'payroll' })" />
      </template>
    </section>
    <section class="panel">
      <h2>{{ t('focus.recentHires') }}</h2>
      <ul class="list">
        <li v-for="e in hires" :key="e.id">
          <span><strong>{{ person(`${e.firstName} ${e.lastName}`) }}</strong> <span class="muted">· {{ term(e.departmentName) }}</span></span>
          <span class="muted">{{ t('focus.joinedOn', { date: formatDate(e.createdAt) }) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.focus { display: grid; grid-template-columns: 1fr 1.4fr; gap: 1rem; margin-bottom: 1rem; }
.focus p { margin: 0.75rem 0; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
.list li { display: flex; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding-bottom: 0.5rem; border-bottom: 1px solid var(--app-border); }
.list li:last-child { border-bottom: 0; padding-bottom: 0; }
@media (max-width: 900px) { .focus { grid-template-columns: minmax(0, 1fr); } }
</style>
