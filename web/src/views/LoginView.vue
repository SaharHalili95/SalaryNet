<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD, DEMO_PASSWORD } from '@/api/demo/demoData'
import { ApiError } from '@/api/errors'
import { toggleLocale, type Locale } from '@/i18n'
import { translateServerMessage } from '@/i18n/serverMessages'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const demoAccounts = [
  { role: 'Admin', icon: 'pi pi-shield', email: DEMO_ACCOUNTS.admin, password: DEMO_ADMIN_PASSWORD, hint: 'login.adminHint' },
  { role: 'HR', icon: 'pi pi-briefcase', email: DEMO_ACCOUNTS.hr, password: DEMO_PASSWORD, hint: 'login.hrHint' },
  { role: 'Employee', icon: 'pi pi-user', email: DEMO_ACCOUNTS.employee, password: DEMO_PASSWORD, hint: 'login.employeeHint' },
]

function fill(account: (typeof demoAccounts)[number]) {
  email.value = account.email
  password.value = account.password
  error.value = null
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ severity: 'success', summary: t('login.copied'), detail: text, life: 2000 })
  } catch {
    // Clipboard can be blocked (insecure context, permissions); the value is visible on screen anyway.
  }
}

async function signIn(withEmail = email.value, withPassword = password.value) {
  loading.value = true
  error.value = null
  try {
    await auth.login(withEmail, withPassword)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof ApiError ? (translateServerMessage(e.detail, locale.value as Locale) ?? e.title) : t('login.unreachable')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <section class="hero">
      <div class="brand"><span class="logo">S</span> SalaryNet</div>
      <h1>{{ t('login.heroTitle') }}</h1>
      <p>{{ t('login.heroText') }}</p>
      <ul>
        <li><i class="pi pi-check-circle" /> {{ t('login.bullet1') }}</li>
        <li><i class="pi pi-check-circle" /> {{ t('login.bullet2') }}</li>
        <li><i class="pi pi-check-circle" /> {{ t('login.bullet3') }}</li>
      </ul>
      <div class="guides">
        <RouterLink :to="{ name: 'architecture' }" class="guide-link"><i class="pi pi-share-alt" /> {{ t('nav.architecture') }}</RouterLink>
        <RouterLink :to="{ name: 'troubleshooting' }" class="guide-link"><i class="pi pi-wrench" /> {{ t('nav.troubleshooting') }}</RouterLink>
        <RouterLink :to="{ name: 'about' }" class="guide-link"><i class="pi pi-book" /> {{ t('nav.about') }}</RouterLink>
      </div>
    </section>

    <section class="form-side">
      <form class="card" @submit.prevent="signIn()">
        <div class="card-head">
          <h2>{{ t('login.title') }}</h2>
          <Button :label="t('nav.switchLanguage')" icon="pi pi-globe" text size="small" :aria-label="t('nav.switchLanguageLabel')" @click="toggleLocale" />
        </div>
        <p class="muted">{{ t('login.intro') }}</p>

        <div class="demo-grid">
          <button v-for="a in demoAccounts" :key="a.role" type="button" class="demo-account" :disabled="loading"
            @click="signIn(a.email, a.password)">
            <i :class="a.icon" />
            <strong>{{ t(`roles.${a.role}`) }}</strong>
            <span>{{ t(a.hint) }}</span>
          </button>
        </div>

        <div class="divider"><span>{{ t('login.or') }}</span></div>

        <div class="field">
          <label for="email">{{ t('common.email') }}</label>
          <InputText id="email" v-model="email" type="email" autocomplete="username" placeholder="hr@salarynet.demo" fluid />
        </div>
        <div class="field">
          <label for="password">{{ t('login.password') }}</label>
          <Password v-model="password" input-id="password" :feedback="false" toggle-mask autocomplete="current-password" fluid />
        </div>
        <Message v-if="error" severity="error" :closable="false">
          {{ error }} {{ t('login.lockoutHint') }}
        </Message>
        <Button type="submit" :label="t('login.submit')" icon="pi pi-sign-in" :loading="loading" fluid />
        <section class="credentials" :aria-label="t('login.credentialsTitle')">
          <h3>{{ t('login.credentialsTitle') }}</h3>
          <p class="muted">{{ t('login.credentialsHint') }}</p>
          <table>
            <thead>
              <tr><th>{{ t('users.role') }}</th><th>{{ t('common.email') }}</th><th>{{ t('login.password') }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="a in demoAccounts" :key="a.role" :class="{ selected: email === a.email }" @click="fill(a)">
                <td><strong>{{ t(`roles.${a.role}`) }}</strong></td>
                <td>
                  <span class="cred">
                    <code>{{ a.email }}</code>
                    <button type="button" class="copy" :aria-label="t('login.copy')" @click.stop="copy(a.email)"><i class="pi pi-copy" /></button>
                  </span>
                </td>
                <td>
                  <span class="cred">
                    <code>{{ a.password }}</code>
                    <button type="button" class="copy" :aria-label="t('login.copy')" @click.stop="copy(a.password)"><i class="pi pi-copy" /></button>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
.hero {
  background: radial-gradient(circle at 20% 20%, #1d4f91 0%, #0f172a 60%); color: #e2e8f0;
  padding: 3.5rem 4rem; display: flex; flex-direction: column; justify-content: center; gap: 1.25rem;
}
.brand { display: flex; align-items: center; gap: 0.625rem; font-weight: 700; font-size: 1.25rem; color: #fff; }
.logo { width: 36px; height: 36px; border-radius: 9px; background: #2a78d6; display: grid; place-items: center; }
.hero h1 { font-size: 2.25rem; line-height: 1.15; margin: 1rem 0 0; color: #fff; max-width: 28rem; letter-spacing: -0.02em; }
.hero p { max-width: 32rem; line-height: 1.6; margin: 0; opacity: 0.85; }
.hero ul { list-style: none; padding: 0; margin: 0.5rem 0 0; display: grid; gap: 0.625rem; }
.hero li { display: flex; gap: 0.625rem; align-items: center; }
.hero li i { color: #6ee7b7; }
.guides { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.75rem; }
.guide-link {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.875rem; border-radius: 8px;
  border: 1px solid rgb(255 255 255 / 0.25); color: #fff; text-decoration: none; font-weight: 550;
}
.guide-link:hover { background: rgb(255 255 255 / 0.08); }
.form-side { display: grid; place-items: center; padding: 2rem 1rem; }
.card { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 1rem; }
.card h2 { margin: 0; font-size: 1.5rem; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.card > p { margin: -0.5rem 0 0; }
.demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.demo-account {
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; padding: 0.75rem; text-align: start;
  border: 1px solid var(--app-border); border-radius: 10px; background: var(--app-surface); color: var(--app-text);
  cursor: pointer; font: inherit; transition: border-color 0.15s, box-shadow 0.15s;
}
.demo-account:hover:not(:disabled) { border-color: var(--app-accent); box-shadow: 0 0 0 3px rgb(42 120 214 / 0.15); }
.demo-account i { color: var(--app-accent); font-size: 1.125rem; }
.demo-account span { font-size: 0.75rem; color: var(--app-text-muted); line-height: 1.3; }
.divider { display: flex; align-items: center; gap: 0.75rem; color: var(--app-text-muted); font-size: 0.8125rem; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--app-border); }
.credentials { border: 1px solid var(--app-border); border-radius: 10px; padding: 0.875rem 1rem; }
.credentials h3 { margin: 0; font-size: 0.9375rem; }
.credentials p { margin: 0.25rem 0 0.5rem; font-size: 0.8125rem; }
.credentials table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.credentials th { text-align: start; color: var(--app-text-muted); font-weight: 550; padding: 0.25rem 0.375rem; }
.credentials td { padding: 0.375rem; border-top: 1px solid var(--app-border); }
.credentials tbody tr { cursor: pointer; }
.credentials tbody tr:hover, .credentials tbody tr.selected { background: color-mix(in srgb, var(--app-accent) 10%, transparent); }
.cred { display: inline-flex; align-items: center; gap: 0.25rem; }
.copy {
  border: 0; background: transparent; color: var(--app-text-muted); cursor: pointer; padding: 0.125rem 0.25rem; border-radius: 4px;
}
.copy:hover { color: var(--app-accent); }
@media (max-width: 900px) {
  .login { grid-template-columns: 1fr; }
  .hero { padding: 2rem 1.25rem; }
  .hero h1 { font-size: 1.75rem; }
  .demo-grid { grid-template-columns: 1fr; }
}
</style>
