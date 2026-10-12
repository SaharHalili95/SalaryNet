import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api'
import type { User, UserRole } from '@/api/types'

const STORAGE_KEY = 'salarynet.session'

interface Session {
  token: string
  expiresAt: string
  user: User
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const session = raw ? (JSON.parse(raw) as Session) : null
    return session && new Date(session.expiresAt) > new Date() ? session : null
  } catch {
    return null
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable (private mode); the session then simply lasts for this tab.
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(readSession())

  const token = computed(() => session.value?.token ?? null)
  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => session.value !== null)
  const isStaff = computed(() => user.value?.role === 'Admin' || user.value?.role === 'HR')
  const isAdmin = computed(() => user.value?.role === 'Admin')

  async function login(email: string, password: string) {
    const response = await api().login(email, password)
    session.value = { token: response.accessToken, expiresAt: response.expiresAt, user: response.user }
    writeSession(session.value)
  }

  function logout() {
    session.value = null
    writeSession(null)
  }

  const hasRole = (roles: UserRole[]) => !!user.value && roles.includes(user.value.role)

  return { token, user, isAuthenticated, isStaff, isAdmin, login, logout, hasRole }
})
