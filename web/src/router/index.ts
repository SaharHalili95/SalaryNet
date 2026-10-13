import { createRouter, createWebHashHistory, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { isDemoMode } from '@/api'
import type { UserRole } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: UserRole[]
    title?: string
    public?: boolean
  }
}

const staff: UserRole[] = ['Admin', 'HR']

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true, title: 'Sign in' } },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        redirect: () => {
          const auth = useAuthStore()
          // Resolve the landing page only after sign-in; otherwise staff would be sent to the employee page.
          if (!auth.isAuthenticated) return { name: 'login' }
          return auth.isStaff ? { name: 'dashboard' } : { name: 'attendance' }
        },
      },
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { roles: staff, title: 'Dashboard' } },
      { path: 'employees', name: 'employees', component: () => import('@/views/EmployeesView.vue'), meta: { roles: staff, title: 'Employees' } },
      { path: 'departments', name: 'departments', component: () => import('@/views/DepartmentsView.vue'), meta: { roles: staff, title: 'Departments' } },
      { path: 'payroll', name: 'payroll', component: () => import('@/views/PayrollView.vue'), meta: { title: 'Payroll' } },
      { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { roles: ['Admin'], title: 'Users' } },
      { path: 'attendance', name: 'attendance', component: () => import('@/views/AttendanceView.vue'), meta: { title: 'Attendance' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  // Static hosting (GitHub Pages) cannot rewrite deep links, so demo mode uses hash URLs.
  history: isDemoMode ? createWebHashHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return auth.isAuthenticated && to.name === 'login' ? { name: 'home' } : true
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.roles && !auth.hasRole(to.meta.roles)) return { name: 'home' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · SalaryNet` : 'SalaryNet'
})

export default router
