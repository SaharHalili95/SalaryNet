<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isDemoMode } from '@/api'
import type { UserRole } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const mobileOpen = ref(false)

const nav: { to: string; label: string; icon: string; roles?: UserRole[] }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar', roles: ['Admin', 'HR'] },
  { to: '/employees', label: 'Employees', icon: 'pi pi-users', roles: ['Admin', 'HR'] },
  { to: '/departments', label: 'Departments', icon: 'pi pi-sitemap', roles: ['Admin', 'HR'] },
  { to: '/payroll', label: 'Payroll', icon: 'pi pi-wallet' },
  { to: '/attendance', label: 'Attendance', icon: 'pi pi-clock' },
]

const visibleNav = computed(() => nav.filter((item) => !item.roles || auth.hasRole(item.roles)))
const initials = computed(() =>
  (auth.user?.displayName ?? '?').split(/[\s@.]/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(''))
const roleSeverity = computed(() => ({ Admin: 'danger', HR: 'info', Employee: 'success' } as const)[auth.user?.role ?? 'Employee'])

watch(() => route.fullPath, () => (mobileOpen.value = false))

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="brand">
        <span class="logo">S</span>
        <span>SalaryNet</span>
      </div>
      <nav>
        <RouterLink v-for="item in visibleNav" :key="item.to" :to="item.to" class="nav-link">
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <span>.NET 8 · Vue 3 · SQL Server</span>
      </div>
    </aside>
    <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />

    <div class="main">
      <div v-if="isDemoMode" class="demo-banner">
        <i class="pi pi-info-circle" />
        Demo mode: fictional data running in your browser. Changes reset when you reload.
      </div>
      <header class="topbar">
        <Button class="menu-toggle" icon="pi pi-bars" text rounded aria-label="Open menu" @click="mobileOpen = true" />
        <div class="spacer" />
        <div class="user">
          <Avatar :label="initials" shape="circle" />
          <div class="user-text">
            <strong>{{ auth.user?.displayName }}</strong>
            <Tag :value="auth.user?.role" :severity="roleSeverity" />
          </div>
          <Button icon="pi pi-sign-out" text rounded aria-label="Sign out" v-tooltip.bottom="'Sign out'" @click="logout" />
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { display: flex; min-height: 100vh; }
.sidebar {
  width: 240px; flex-shrink: 0; background: var(--app-sidebar); color: var(--app-sidebar-text);
  display: flex; flex-direction: column; padding: 1.25rem 0.75rem; position: sticky; top: 0; height: 100vh;
}
.brand { display: flex; align-items: center; gap: 0.625rem; color: #fff; font-weight: 700; font-size: 1.125rem; padding: 0 0.5rem 1.5rem; }
.logo { width: 32px; height: 32px; border-radius: 8px; background: var(--app-accent); display: grid; place-items: center; }
nav { display: flex; flex-direction: column; gap: 0.25rem; }
.nav-link {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 8px;
  color: inherit; text-decoration: none; font-weight: 500;
}
.nav-link:hover { background: var(--app-sidebar-active); color: #fff; }
.nav-link.router-link-active { background: var(--app-sidebar-active); color: #fff; box-shadow: inset 3px 0 0 var(--app-accent); }
.sidebar-footer { margin-top: auto; padding: 0 0.5rem; font-size: 0.75rem; opacity: 0.6; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.demo-banner { background: #fff7e6; color: #8a5300; padding: 0.5rem 1.5rem; font-size: 0.8125rem; display: flex; gap: 0.5rem; align-items: center; }
.topbar { display: flex; align-items: center; padding: 0.75rem 1.5rem; background: var(--app-surface); border-bottom: 1px solid var(--app-border); }
.spacer { flex: 1; }
.user { display: flex; align-items: center; gap: 0.75rem; }
.user-text { display: flex; align-items: center; gap: 0.5rem; }
.content { padding: 1.75rem 1.5rem 3rem; max-width: 1280px; width: 100%; margin: 0 auto; }
.menu-toggle, .backdrop { display: none; }

@media (max-width: 900px) {
  .sidebar { position: fixed; z-index: 30; left: 0; transform: translateX(-100%); transition: transform 0.2s; }
  .sidebar.open { transform: none; }
  .backdrop { display: block; position: fixed; inset: 0; background: rgb(0 0 0 / 0.4); z-index: 20; }
  .menu-toggle { display: inline-flex; }
  .content { padding: 1.25rem 1rem 2rem; }
  .topbar { padding: 0.5rem 1rem; }
  .user-text strong { display: none; }
}
</style>
