<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useI18n } from 'vue-i18n'
import type { PayrollRecord } from '@shared/api/types'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { formatDate, formatMoney, formatPeriod } from '@/utils/format'

defineProps<{ record: PayrollRecord | null }>()
const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
const { term, person } = useLocalizedData()
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="t('payslip.title')" :style="{ width: '30rem' }" :breakpoints="{ '640px': '95vw' }">
    <div v-if="record" class="slip">
      <div class="slip-head">
        <div>
          <strong>{{ person(record.employeeName) }}</strong>
          <div class="muted">{{ term(record.departmentName) }}</div>
        </div>
        <div class="period">
          <strong>{{ formatPeriod(record.year, record.month) }}</strong>
          <div class="muted">{{ t('payslip.issued', { date: formatDate(record.generatedAt) }) }}</div>
        </div>
      </div>

      <dl>
        <div><dt>{{ t('payslip.baseSalary') }}</dt><dd class="money">{{ formatMoney(record.baseSalary) }}</dd></div>
        <div><dt>{{ t('payslip.bonus') }}</dt><dd class="money">{{ formatMoney(record.bonus) }}</dd></div>
        <div class="total"><dt>{{ t('payslip.gross') }}</dt><dd class="money">{{ formatMoney(record.grossSalary) }}</dd></div>
        <div><dt>{{ t('payslip.incomeTax') }} <span class="muted">{{ t('payslip.tiered') }}</span></dt><dd class="money neg">-{{ formatMoney(record.incomeTax) }}</dd></div>
        <div><dt>{{ t('payslip.socialSecurity') }}</dt><dd class="money neg">-{{ formatMoney(record.socialSecurity) }}</dd></div>
        <div class="total"><dt>{{ t('payslip.totalDeductions') }}</dt><dd class="money neg">-{{ formatMoney(record.deductions) }}</dd></div>
      </dl>

      <div class="net">
        <span>{{ t('payslip.net') }}</span>
        <strong class="money">{{ formatMoney(record.netSalary) }}</strong>
      </div>
      <p class="muted note">{{ t('payslip.note') }}</p>
    </div>
  </Dialog>
</template>

<style scoped>
.slip-head { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--app-border); }
.period { text-align: end; }
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
