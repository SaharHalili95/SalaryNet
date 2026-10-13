<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD, DEMO_PASSWORD } from '@/api/demo/demoData'
import { ApiError } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const demoAccounts = [
  { label: 'Admin', icon: 'pi pi-shield', email: DEMO_ACCOUNTS.admin, password: DEMO_ADMIN_PASSWORD, hint: 'Full access, manages users and departments' },
  { label: 'HR', icon: 'pi pi-briefcase', email: DEMO_ACCOUNTS.hr, password: DEMO_PASSWORD, hint: 'Employees, payroll, attendance' },
  { label: 'Employee', icon: 'pi pi-user', email: DEMO_ACCOUNTS.employee, password: DEMO_PASSWORD, hint: 'Own payslips and clock in/out' },
]

async function signIn(withEmail = email.value, withPassword = password.value) {
  loading.value = true
  error.value = null
  try {
    await auth.login(withEmail, withPassword)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof ApiError ? (e.detail ?? e.title) : 'Could not reach the server.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <section class="hero">
      <div class="brand"><span class="logo">S</span> SalaryNet</div>
      <h1>Payroll and HR management, end to end.</h1>
      <p>
        A portfolio project: ASP.NET Core 8 Web API with Clean Architecture, EF Core on SQL Server,
        JWT role-based security, and this Vue 3 + TypeScript front end.
      </p>
      <ul>
        <li><i class="pi pi-check-circle" /> Tiered tax calculation with a full payslip breakdown</li>
        <li><i class="pi pi-check-circle" /> Admin, HR and Employee roles with resource-level authorization</li>
        <li><i class="pi pi-check-circle" /> Attendance tracking with server-calculated hours</li>
      </ul>
    </section>

    <section class="form-side">
      <form class="card" @submit.prevent="signIn()">
        <h2>Sign in</h2>
        <p class="muted">Use a demo account below, or type the credentials.</p>

        <div class="demo-grid">
          <button v-for="a in demoAccounts" :key="a.label" type="button" class="demo-account" :disabled="loading"
            @click="signIn(a.email, a.password)">
            <i :class="a.icon" />
            <strong>{{ a.label }}</strong>
            <span>{{ a.hint }}</span>
          </button>
        </div>

        <div class="divider"><span>or</span></div>

        <div class="field">
          <label for="email">Email</label>
          <InputText id="email" v-model="email" type="email" autocomplete="username" placeholder="hr@salarynet.demo" fluid />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <Password v-model="password" input-id="password" :feedback="false" toggle-mask autocomplete="current-password" fluid />
        </div>
        <Message v-if="error" severity="error" :closable="false">
          {{ error }} After 5 failed attempts the account locks for 15 minutes.
        </Message>
        <Button type="submit" label="Sign in" icon="pi pi-sign-in" :loading="loading" fluid />
        <p class="hint muted">
          Demo passwords: admin <code>{{ DEMO_ADMIN_PASSWORD }}</code>, HR and employee <code>{{ DEMO_PASSWORD }}</code>
        </p>
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
.form-side { display: grid; place-items: center; padding: 2rem 1rem; }
.card { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 1rem; }
.card h2 { margin: 0; font-size: 1.5rem; }
.card > p { margin: -0.5rem 0 0; }
.demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.demo-account {
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; padding: 0.75rem; text-align: left;
  border: 1px solid var(--app-border); border-radius: 10px; background: var(--app-surface); color: var(--app-text);
  cursor: pointer; font: inherit; transition: border-color 0.15s, box-shadow 0.15s;
}
.demo-account:hover:not(:disabled) { border-color: var(--app-accent); box-shadow: 0 0 0 3px rgb(42 120 214 / 0.15); }
.demo-account i { color: var(--app-accent); font-size: 1.125rem; }
.demo-account span { font-size: 0.75rem; color: var(--app-text-muted); line-height: 1.3; }
.divider { display: flex; align-items: center; gap: 0.75rem; color: var(--app-text-muted); font-size: 0.8125rem; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--app-border); }
.hint { font-size: 0.8125rem; margin: 0; text-align: center; }
@media (max-width: 900px) {
  .login { grid-template-columns: 1fr; }
  .hero { padding: 2rem 1.25rem; }
  .hero h1 { font-size: 1.75rem; }
  .demo-grid { grid-template-columns: 1fr; }
}
</style>
