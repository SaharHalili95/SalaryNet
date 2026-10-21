import type { SalaryNetApi, TokenProvider } from './client'
import { ApiError } from './errors'

type Query = Record<string, string | number | boolean | undefined | null>

export function createHttpApi(baseUrl: string, getToken: TokenProvider, onUnauthorized: () => void): SalaryNetApi {
  async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
    const url = new URL(`${baseUrl}${path}`, window.location.origin)
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }

    const headers: Record<string, string> = { Accept: 'application/json' }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })

    if (response.status === 401 && token) onUnauthorized()
    if (response.status === 204) return undefined as T
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}))
      throw new ApiError(response.status, problem.title ?? response.statusText, problem.detail, problem.errors)
    }
    return (await response.json()) as T
  }

  const get = <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query)
  const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {})

  return {
    login: (email, password) => post('/auth/login', { email, password }),
    me: () => get('/auth/me'),
    changePassword: (currentPassword, newPassword) => post('/auth/change-password', { currentPassword, newPassword }),
    dashboard: () => get('/dashboard/summary'),
    employees: {
      search: (q) => get('/employees', { ...q }),
      get: (id) => get(`/employees/${id}`),
      mine: () => get('/employees/me'),
      create: (r) => post('/employees', r),
      update: (id, r) => request('PUT', `/employees/${id}`, r),
      setActive: (id, isActive) => post(`/employees/${id}/${isActive ? 'activate' : 'deactivate'}`),
    },
    departments: {
      list: () => get('/departments'),
      create: (r) => post('/departments', r),
      update: (id, r) => request('PUT', `/departments/${id}`, r),
      remove: (id) => request('DELETE', `/departments/${id}`),
    },
    payroll: {
      search: (q) => get('/payroll', { ...q }),
      get: (id) => get(`/payroll/${id}`),
      generate: (r) => post('/payroll', r),
      runMonth: (year, month) => post('/payroll/run', { year, month }),
    },
    users: {
      search: (q) => get('/users', { ...q }),
      create: (r) => post('/users', r),
      changeRole: (id, role, employeeId) => request('PUT', `/users/${id}/role`, { role, employeeId }),
      setActive: (id, isActive) => post(`/users/${id}/${isActive ? 'activate' : 'deactivate'}`),
      unlock: (id) => post(`/users/${id}/unlock`),
      resetPassword: (id, newPassword) => post(`/users/${id}/reset-password`, { newPassword }),
    },
    attendance: {
      search: (q) => get('/attendance', { ...q }),
      current: async () => (await get<import('./types').AttendanceLog | undefined>('/attendance/current')) ?? null,
      checkIn: () => post('/attendance/check-in'),
      checkOut: () => post('/attendance/check-out'),
    },
  }
}
