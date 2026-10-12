<script setup lang="ts">
import Dialog from 'primevue/dialog'
import type { PayrollRecord } from '@/api/types'
import { formatDate, formatMoney, formatPeriod } from '@/utils/format'

defineProps<{ record: PayrollRecord | null }>()
const visible = defineModel<boolean>('visible', { required: true })
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Payslip" :style="{ width: '30rem' }" :breakpoints="{ '640px': '95vw' }">
    <div v-if="record" class="slip">
      <div class="slip-head">
        <div>
          <strong>{{ record.employeeName }}</strong>
          <div class="muted">{{ record.departmentName }}</div>
        </div>
        <div class="period">
          <strong>{{ formatPeriod(record.year, record.month) }}</strong>
          <div class="muted">Issued {{ formatDate(record.generatedAt) }}</div>
        </div>
      </div>

      <dl>
        <div><dt>Base salary</dt><dd class="money">{{ formatMoney(record.baseSalary) }}</dd></div>
        <div><dt>Bonus</dt><dd class="money">{{ formatMoney(record.bonus) }}</dd></div>
        <div class="total"><dt>Gross salary</dt><dd class="money">{{ formatMoney(record.grossSalary) }}</dd></div>
        <div><dt>Income tax <span class="muted">(tiered)</span></dt><dd class="money neg">-{{ formatMoney(record.incomeTax) }}</dd></div>
        <div><dt>Social security</dt><dd class="money neg">-{{ formatMoney(record.socialSecurity) }}</dd></div>
        <div class="total"><dt>Total deductions</dt><dd class="money neg">-{{ formatMoney(record.deductions) }}</dd></div>
      </dl>

      <div class="net">
        <span>Net pay</span>
        <strong class="money">{{ formatMoney(record.netSalary) }}</strong>
      </div>
      <p class="muted note">Illustrative rates only, not official tax figures.</p>
    </div>
  </Dialog>
</template>

<style scoped>
.slip-head { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--app-border); }
.period { text-align: right; }
dl { margin: 0; }
dl div { display: flex; justify-content: space-between; padding: 0.5rem 0; }
dl .total { border-top: 1px dashed var(--app-border); font-weight: 600; }
dt, dd { margin: 0; }
.neg { color: #b42318; }
.net {
  display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding: 0.875rem 1rem;
  border-radius: 10px; background: color-mix(in srgb, var(--app-accent) 10%, transparent);
}
.net strong { font-size: 1.375rem; }
.note { font-size: 0.75rem; margin: 0.75rem 0 0; }
@media (prefers-color-scheme: dark) { .neg { color: #fda29b; } }
</style>
