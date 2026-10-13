<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { isDemoMode } from '@/api'
import type { UserRole } from '@/api/types'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import { toggleLocale } from '@/i18n'
import { useLocalizedData } from '@/i18n/useLocalizedData'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { t } = useI18n()
const { person } = useLocalizedData()
const router = useRouter()
const route = useRoute()
const mobileOpen = ref(false)
const passwordOpen = ref(false)

const nav: { to: string; label: string; icon: string; roles?: UserRole[] }[] = [
  { to: '/me', label: 'nav.myOverview', icon: 'pi pi-home', roles: ['Employee'] },
  { to: '/dashboard', label: 'nav.dashboard', icon: 'pi pi-chart-bar', roles: ['Admin', 'HR'] },
  { to: '/employees', label: 'nav.employees', icon: 'pi pi-users', roles: ['Admin', 'HR'] },
  { to: '/departments', label: 'nav.departments', icon: 'pi pi-sitemap', roles: ['Admin', 'HR'] },
  { to: '/payroll', label: 'nav.payroll', icon: 'pi pi-wallet' },
  { to: '/attendance', label: 'nav.attendance', icon: 'pi pi-clock' },
  { to: '/users', label: 'nav.users', icon: 'pi pi-shield', roles: ['Admin'] },
]
const guideNav = [
  { to: '/architecture', label: 'nav.architecture', icon: 'pi pi-share-alt' },
  { to: '/troubleshooting', label: 'nav.troubleshooting', icon: 'pi pi-wrench' },
  { to: '/about', label: 'nav.about', icon: 'pi pi-book' },
]

// Signed-out visitors (e.g. recruiters) can still read the architecture and troubleshooting guides.
const visibleNav = computed(() => (auth.isAuthenticated ? nav.filter((item) => !item.roles || auth.hasRole(item.roles)) : []))
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
          <span>{{ t(item.label) }}</span>
        </RouterLink>
        <div v-if="visibleNav.length" class="nav-divider" />
        <RouterLink v-for="item in guideNav" :key="item.to" :to="item.to" class="nav-link">
          <i :class="item.icon" />
          <span>{{ t(item.label) }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <span dir="ltr">{{ t('layout.footer') }}</span>
      </div>
    </aside>
    <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />

    <div class="main">
      <div v-if="isDemoMode" class="demo-banner">
        <i class="pi pi-info-circle" />
        {{ t('layout.demoBanner') }}
      </div>
      <header class="topbar">
        <Button class="menu-toggle" icon="pi pi-bars" text rounded :aria-label="t('nav.openMenu')" @click="mobileOpen = true" />
        <div class="spacer" />
        <div v-if="!auth.isAuthenticated" class="user">
          <Button :label="t('nav.switchLanguage')" icon="pi pi-globe" text size="small" :aria-label="t('nav.switchLanguageLabel')" @click="toggleLocale" />
          <Button :label="t('nav.signIn')" icon="pi pi-sign-in" size="small" @click="router.push({ name: 'login' })" />
        </div>
        <div v-else class="user">
          <Avatar :label="initials" shape="circle" />
          <div class="user-text">
            <strong>{{ person(auth.user?.displayName) }}</strong>
            <Tag :value="auth.user ? t(`roles.${auth.user.role}`) : ''" :severity="roleSeverity" />
          </div>
          <Button :label="t('nav.switchLanguage')" icon="pi pi-globe" text size="small" :aria-label="t('nav.switchLanguageLabel')" @click="toggleLocale" />
          <Button icon="pi pi-key" text rounded :aria-label="t('nav.changePassword')" v-tooltip.bottom="t('nav.changePassword')" @click="passwordOpen = true" />
          <Button icon="pi pi-sign-out" text rounded :aria-label="t('nav.signOut')" v-tooltip.bottom="t('nav.signOut')" @click="logout" />
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
      <ChangePasswordDialog v-model:visible="passwordOpen" />
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
:global([dir='rtl']) .nav-link.router-link-active { box-shadow: inset -3px 0 0 var(--app-accent); }
.nav-divider { height: 1px; background: rgb(255 255 255 / 0.08); margin: 0.5rem 0.75rem; }
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
  .sidebar { position: fixed; z-index: 30; inset-inline-start: 0; transform: translateX(-100%); transition: transform 0.2s; }
  :global([dir='rtl']) .sidebar { transform: translateX(100%); }
  .sidebar.open { transform: none; }
  .backdrop { display: block; position: fixed; inset: 0; background: rgb(0 0 0 / 0.4); z-index: 20; }
  .menu-toggle { display: inline-flex; }
  .content { padding: 1.25rem 1rem 2rem; }
  .topbar { padding: 0.5rem 1rem; }
  .user-text strong { display: none; }
}
</style>
