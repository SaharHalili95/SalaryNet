<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import type { UserAccount, UserRole } from '@/api/types'
import { formatTime } from '@/utils/format'

const { t } = useI18n()
const router = useRouter()
const accounts = ref<UserAccount[]>([])
const roles: UserRole[] = ['Admin', 'HR', 'Employee']
const locked = computed(() => accounts.value.filter((a) => a.isLockedOut))
const inactive = computed(() => accounts.value.filter((a) => !a.isActive).length)
const countFor = (role: UserRole) => accounts.value.filter((a) => a.role === role).length

onMounted(async () => {
  accounts.value = (await api().users.search({ pageSize: 100 })).items
})
</script>

<template>
  <div class="focus">
    <section class="panel">
      <h2>{{ t('focus.accounts') }}</h2>
      <div class="counts">
        <div v-for="role in roles" :key="role"><strong>{{ countFor(role) }}</strong><span class="muted">{{ t(`roles.${role}`) }}</span></div>
        <div><strong>{{ inactive }}</strong><span class="muted">{{ t('focus.inactiveAccounts') }}</span></div>
      </div>
    </section>
    <section class="panel">
      <div class="head">
        <h2>{{ t('focus.lockedAccounts') }}</h2>
        <Button :label="t('focus.manageUsers')" icon="pi pi-shield" size="small" text @click="router.push({ name: 'users' })" />
      </div>
      <p v-if="locked.length === 0" class="muted"><i class="pi pi-check-circle" /> {{ t('focus.noLocked') }}</p>
      <ul v-else class="list">
        <li v-for="a in locked" :key="a.id">
          <span class="ltr">{{ a.email }}</span>
          <Tag severity="warn" :value="t('users.until', { time: a.lockoutEndsAt ? formatTime(a.lockoutEndsAt) : '' })" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.focus { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.counts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.counts div { display: flex; flex-direction: column; }
.counts strong { font-size: 1.5rem; }
.head { display: flex; justify-content: space-between; align-items: center; }
.head h2 { margin: 0; }
.list { list-style: none; margin: 0.75rem 0 0; padding: 0; display: grid; gap: 0.5rem; }
.list li { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
p { margin: 0.75rem 0 0; }
@media (max-width: 900px) { .focus { grid-template-columns: 1fr; } .counts { grid-template-columns: repeat(2, 1fr); } }
</style>
