import type { SalaryNetApi, TokenProvider } from '../client'
import { ApiError, businessRule, conflict, forbidden, notFound, validation } from '../errors'
import type {
  AttendanceLog, Department, Employee, PagedResult, PayrollRecord, SaveEmployeeRequest, User, UserAccount, UserRole,
} from '../types'
import { createDemoDatabase, LOCKOUT_MINUTES, MAX_FAILED_LOGINS, newId, type DemoDatabase, type DemoUser } from './demoData'
import { calculatePayroll } from './payrollCalculator'

const TOKEN_PREFIX = 'demo.'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * In-browser implementation of the API for the static GitHub Pages demo. It enforces the same
 * authorization, validation and business rules as the .NET backend; data resets on page reload.
 */
export function createDemoApi(getToken: TokenProvider, db: DemoDatabase = createDemoDatabase()): SalaryNetApi {
  const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 150))

  function caller(): DemoUser {
    const token = getToken()
    const user = token?.startsWith(TOKEN_PREFIX) ? db.users.find((u) => u.id === token.slice(TOKEN_PREFIX.length)) : undefined
    if (!user) throw new ApiError(401, 'Unauthorized', 'Please sign in again.')
    return user
  }
  const isLocked = (u: DemoUser) => !!u.lockoutEndsAt && new Date(u.lockoutEndsAt) > new Date()
  function checkPasswordPolicy(password: string, field: string) {
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      throw validation({ [field]: ['Use at least 8 characters with an uppercase letter, a lowercase letter and a digit.'] })
    }
  }
  function requireAdmin() {
    const u = caller()
    if (u.role !== 'Admin') throw forbidden()
    return u
  }
  function toAccount(u: DemoUser): UserAccount {
    const e = db.employees.find((x) => x.id === u.employeeId)
    const locked = isLocked(u)
    return {
      id: u.id, email: u.email, displayName: u.displayName, role: u.role, employeeId: u.employeeId,
      employeeName: e ? `${e.firstName} ${e.lastName}` : null,
      isActive: u.isActive, isLockedOut: locked, lockoutEndsAt: locked ? u.lockoutEndsAt : null,
      failedLoginCount: u.failedLoginCount, createdAt: u.createdAt,
    }
  }
  function account(id: string) {
    const u = db.users.find((x) => x.id === id)
    if (!u) throw notFound(`User '${id}'`)
    return u
  }
  function checkRoleLink(role: UserRole, employeeId: string | null, excludingId?: string) {
    if (role === 'Employee' && !employeeId) throw validation({ EmployeeId: ['Choose the employee this account belongs to.'] })
    if (role !== 'Employee' && employeeId) throw validation({ EmployeeId: ['Only employee accounts can be linked to an employee.'] })
    if (employeeId && db.users.some((u) => u.employeeId === employeeId && u.id !== excludingId)) {
      throw conflict('This employee already has an account.')
    }
  }
  function notSelf(id: string, action: string) {
    if (caller().id === id) throw businessRule(`You cannot ${action}. Ask another administrator.`)
  }
  const isStaff = (u: DemoUser) => u.role === 'Admin' || u.role === 'HR'
  function requireStaff() {
    const u = caller()
    if (!isStaff(u)) throw forbidden()
    return u
  }
  function requireEmployee() {
    const u = caller()
    if (!u.employeeId) throw forbidden()
    return u.employeeId
  }

  const department = (id: string) => db.departments.find((d) => d.id === id)
  function toEmployee(e: DemoDatabase['employees'][number]): Employee {
    return { ...e, departmentName: department(e.departmentId)?.name ?? '' }
  }
  function toPayroll(p: DemoDatabase['payroll'][number]): PayrollRecord {
    const e = db.employees.find((x) => x.id === p.employeeId)!
    return {
      ...p, employeeName: `${e.firstName} ${e.lastName}`, departmentName: department(e.departmentId)?.name ?? '',
      baseSalary: p.grossSalary - p.bonus,
    }
  }
  function toAttendance(a: DemoDatabase['attendance'][number]): AttendanceLog {
    const e = db.employees.find((x) => x.id === a.employeeId)!
    return { ...a, employeeName: `${e.firstName} ${e.lastName}`, isOpen: a.checkOut === null }
  }
  function toDepartment(d: DemoDatabase['departments'][number]): Department {
    const members = db.employees.filter((e) => e.departmentId === d.id)
    return { ...d, employeeCount: members.length, activeEmployeeCount: members.filter((e) => e.isActive).length }
  }
  function toUser(u: DemoUser): User {
    const e = db.employees.find((x) => x.id === u.employeeId)
    return { id: u.id, email: u.email, role: u.role, employeeId: u.employeeId,
      displayName: e ? `${e.firstName} ${e.lastName}` : (u.displayName ?? u.email) }
  }

  function page<T>(items: T[], pageNo = 1, pageSize = 20): PagedResult<T> {
    if (pageNo < 1 || pageSize < 1 || pageSize > 100) {
      throw validation({ PageSize: ['Page must be >= 1 and page size between 1 and 100.'] })
    }
    return {
      items: items.slice((pageNo - 1) * pageSize, pageNo * pageSize),
      page: pageNo, pageSize, totalCount: items.length, totalPages: Math.ceil(items.length / pageSize),
    }
  }

  function validateEmployee(r: SaveEmployeeRequest, excludingId?: string) {
    const errors: Record<string, string[]> = {}
    if (!r.firstName?.trim()) errors.FirstName = ["'First Name' must not be empty."]
    if (!r.lastName?.trim()) errors.LastName = ["'Last Name' must not be empty."]
    if (!EMAIL_PATTERN.test(r.email ?? '')) errors.Email = ["'Email' is not a valid email address."]
    if (!r.departmentId || !department(r.departmentId)) errors.DepartmentId = ['Please choose a department.']
    if (!(r.baseSalary > 0)) errors.BaseSalary = ["'Base Salary' must be greater than '0'."]
    if (Object.keys(errors).length) throw validation(errors)
    const email = r.email.trim().toLowerCase()
    if (db.employees.some((e) => e.email === email && e.id !== excludingId)) {
      throw conflict(`An employee with email '${r.email.trim()}' already exists.`)
    }
    return email
  }

  function currentPeriodGuard(year: number, month: number) {
    const now = new Date()
    if (year * 12 + month > now.getUTCFullYear() * 12 + now.getUTCMonth() + 1) {
      throw businessRule('Payroll cannot be generated for a future period.')
    }
  }

  return {
    async login(email, password) {
      // Mirrors the backend: unknown, inactive and locked accounts share one generic 401.
      const generic = () => new ApiError(401, 'Unauthorized', 'Invalid email or password.')
      const user = db.users.find((u) => u.email === email.trim().toLowerCase())
      if (!user || !user.isActive || isLocked(user)) throw generic()
      if (password !== user.password) {
        user.failedLoginCount += 1
        if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
          user.lockoutEndsAt = new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
          user.failedLoginCount = 0
        }
        throw generic()
      }
      user.failedLoginCount = 0
      user.lockoutEndsAt = null
      return delay({ accessToken: TOKEN_PREFIX + user.id, expiresAt: new Date(Date.now() + 3_600_000).toISOString(), user: toUser(user) })
    },
    async changePassword(currentPassword, newPassword) {
      const user = caller()
      if (currentPassword !== user.password) throw validation({ CurrentPassword: ['The current password is incorrect.'] })
      checkPasswordPolicy(newPassword, 'NewPassword')
      if (newPassword === currentPassword) throw validation({ NewPassword: ['The new password must be different from the current one.'] })
      user.password = newPassword
      return delay(undefined)
    },
    async me() {
      return delay(toUser(caller()))
    },
    async dashboard() {
      requireStaff()
      const periods = [...new Set(db.payroll.map((p) => p.year * 100 + p.month))].sort((a, b) => a - b).slice(-6)
      const monthlyTrend = periods.map((key) => {
        const rows = db.payroll.filter((p) => p.year * 100 + p.month === key)
        const sum = (f: (p: (typeof rows)[number]) => number) => Math.round(rows.reduce((s, p) => s + f(p), 0) * 100) / 100
        return { year: Math.floor(key / 100), month: key % 100, grossTotal: sum((p) => p.grossSalary),
          netTotal: sum((p) => p.netSalary), deductionsTotal: sum((p) => p.deductions), payslips: rows.length }
      })
      const latestPeriod = monthlyTrend.at(-1) ?? null
      const latestRows = latestPeriod ? db.payroll.filter((p) => p.year === latestPeriod.year && p.month === latestPeriod.month) : []
      const active = db.employees.filter((e) => e.isActive)
      return delay({
        totalEmployees: db.employees.length,
        activeEmployees: active.length,
        departmentCount: db.departments.length,
        currentlyCheckedIn: db.attendance.filter((a) => a.checkOut === null).length,
        averageBaseSalary: active.length ? Math.round((active.reduce((s, e) => s + e.baseSalary, 0) / active.length) * 100) / 100 : 0,
        latestPeriod,
        payrollByDepartment: db.departments
          .map((d) => {
            const rows = latestRows.filter((p) => db.employees.find((e) => e.id === p.employeeId)?.departmentId === d.id)
            return { departmentName: d.name, headcount: rows.length, grossTotal: rows.reduce((s, p) => s + p.grossSalary, 0),
              netTotal: rows.reduce((s, p) => s + p.netSalary, 0) }
          })
          .filter((d) => d.headcount > 0)
          .sort((a, b) => b.grossTotal - a.grossTotal),
        employmentTypes: (['FullTime', 'PartTime', 'Contractor'] as const)
          .map((t) => ({ employmentType: t, count: active.filter((e) => e.employmentType === t).length }))
          .filter((t) => t.count > 0),
        monthlyTrend,
      })
    },
    employees: {
      async search(q) {
        requireStaff()
        const term = q.search?.trim().toLowerCase()
        let rows = db.employees.filter((e) =>
          (!term || `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(term)) &&
          (!q.departmentId || e.departmentId === q.departmentId) &&
          (!q.employmentType || e.employmentType === q.employmentType) &&
          (q.isActive === undefined || e.isActive === q.isActive))
        const dir = q.sortDirection === 'Desc' ? -1 : 1
        rows = [...rows].sort((a, b) => {
          if (q.sortBy === 'BaseSalary') return (a.baseSalary - b.baseSalary) * dir
          if (q.sortBy === 'CreatedAt') return a.createdAt.localeCompare(b.createdAt) * dir
          return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`) * dir
        })
        return delay(page(rows.map(toEmployee), q.page, q.pageSize))
      },
      async get(id) {
        const u = caller()
        const e = db.employees.find((x) => x.id === id)
        if (!e || (!isStaff(u) && u.employeeId !== id)) throw notFound(`Employee '${id}'`)
        return delay(toEmployee(e))
      },
      async mine() {
        const id = requireEmployee()
        return delay(toEmployee(db.employees.find((e) => e.id === id)!))
      },
      async create(r) {
        requireStaff()
        const email = validateEmployee(r)
        const e = { id: newId(), ...r, firstName: r.firstName.trim(), lastName: r.lastName.trim(), email,
          isActive: true, createdAt: new Date().toISOString() }
        db.employees.push(e)
        return delay(toEmployee(e))
      },
      async update(id, r) {
        requireStaff()
        const e = db.employees.find((x) => x.id === id)
        if (!e) throw notFound(`Employee '${id}'`)
        const email = validateEmployee(r, id)
        Object.assign(e, { ...r, firstName: r.firstName.trim(), lastName: r.lastName.trim(), email })
        return delay(toEmployee(e))
      },
      async setActive(id, isActive) {
        requireStaff()
        const e = db.employees.find((x) => x.id === id)
        if (!e) throw notFound(`Employee '${id}'`)
        if (e.isActive === isActive) throw businessRule(`Employee is already ${isActive ? 'active' : 'inactive'}.`)
        e.isActive = isActive
        return delay(undefined)
      },
    },
    departments: {
      async list() {
        requireStaff()
        return delay([...db.departments].sort((a, b) => a.name.localeCompare(b.name)).map(toDepartment))
      },
      async create(r) {
        if (caller().role !== 'Admin') throw forbidden()
        if (!r.name?.trim()) throw validation({ Name: ["'Name' must not be empty."] })
        if (db.departments.some((d) => d.name.toLowerCase() === r.name.trim().toLowerCase())) {
          throw conflict(`A department named '${r.name.trim()}' already exists.`)
        }
        const d = { id: newId(), name: r.name.trim(), description: r.description?.trim() ?? '', createdAt: new Date().toISOString() }
        db.departments.push(d)
        return delay(toDepartment(d))
      },
      async update(id, r) {
        if (caller().role !== 'Admin') throw forbidden()
        const d = department(id)
        if (!d) throw notFound(`Department '${id}'`)
        if (!r.name?.trim()) throw validation({ Name: ["'Name' must not be empty."] })
        if (db.departments.some((x) => x.id !== id && x.name.toLowerCase() === r.name.trim().toLowerCase())) {
          throw conflict(`A department named '${r.name.trim()}' already exists.`)
        }
        Object.assign(d, { name: r.name.trim(), description: r.description?.trim() ?? '' })
        return delay(toDepartment(d))
      },
      async remove(id) {
        if (caller().role !== 'Admin') throw forbidden()
        const d = department(id)
        if (!d) throw notFound(`Department '${id}'`)
        if (db.employees.some((e) => e.departmentId === id)) {
          throw conflict(`Department '${d.name}' still has employees and cannot be deleted.`)
        }
        db.departments.splice(db.departments.indexOf(d), 1)
        return delay(undefined)
      },
    },
    payroll: {
      async search(q) {
        const u = caller()
        // Same IDOR guard as the backend: employee accounts are always scoped to themselves.
        const employeeId = isStaff(u) ? q.employeeId : u.employeeId
        const rows = db.payroll
          .filter((p) => (!employeeId || p.employeeId === employeeId) &&
            (!q.year || p.year === q.year) && (!q.month || p.month === q.month) &&
            (!q.departmentId || db.employees.find((e) => e.id === p.employeeId)?.departmentId === q.departmentId))
          .map(toPayroll)
          .sort((a, b) => b.year - a.year || b.month - a.month || a.employeeName.localeCompare(b.employeeName))
        return delay(page(rows, q.page, q.pageSize))
      },
      async get(id) {
        const u = caller()
        const p = db.payroll.find((x) => x.id === id)
        if (!p || (!isStaff(u) && p.employeeId !== u.employeeId)) throw notFound(`Payroll record '${id}'`)
        return delay(toPayroll(p))
      },
      async generate(r) {
        requireStaff()
        if (!(r.bonus >= 0)) throw validation({ Bonus: ["'Bonus' must be greater than or equal to '0'."] })
        const e = db.employees.find((x) => x.id === r.employeeId)
        if (!e) throw notFound(`Employee '${r.employeeId}'`)
        if (db.payroll.some((p) => p.employeeId === e.id && p.year === r.year && p.month === r.month)) {
          throw conflict(`Payroll for ${e.firstName} ${e.lastName} for ${String(r.month).padStart(2, '0')}/${r.year} has already been generated.`)
        }
        currentPeriodGuard(r.year, r.month)
        if (!e.isActive) throw businessRule('Payroll cannot be generated for an inactive employee.')
        const p = { id: newId(), employeeId: e.id, year: r.year, month: r.month, bonus: r.bonus,
          ...calculatePayroll(e.employmentType, e.baseSalary, r.bonus), generatedAt: new Date().toISOString() }
        db.payroll.push(p)
        return delay(toPayroll(p))
      },
      async runMonth(year, month) {
        requireStaff()
        currentPeriodGuard(year, month)
        const active = db.employees.filter((e) => e.isActive)
        const pending = active.filter((e) => !db.payroll.some((p) => p.employeeId === e.id && p.year === year && p.month === month))
        for (const e of pending) {
          db.payroll.push({ id: newId(), employeeId: e.id, year, month, bonus: 0,
            ...calculatePayroll(e.employmentType, e.baseSalary, 0), generatedAt: new Date().toISOString() })
        }
        return delay({ year, month, generated: pending.length, skipped: active.length - pending.length })
      },
    },
    users: {
      async search(q) {
        requireAdmin()
        const term = q.search?.trim().toLowerCase()
        const rows = db.users
          .map(toAccount)
          .filter((u) => (!term || `${u.email} ${u.displayName ?? ''} ${u.employeeName ?? ''}`.toLowerCase().includes(term)) &&
            (!q.role || u.role === q.role) && (q.isActive === undefined || u.isActive === q.isActive))
          .sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email))
        return delay(page(rows, q.page, q.pageSize))
      },
      async create(r) {
        requireAdmin()
        if (!EMAIL_PATTERN.test(r.email ?? '')) throw validation({ Email: ["'Email' is not a valid email address."] })
        checkPasswordPolicy(r.password ?? '', 'Password')
        const email = r.email.trim().toLowerCase()
        if (db.users.some((u) => u.email === email)) throw conflict(`An account with email '${r.email.trim()}' already exists.`)
        checkRoleLink(r.role, r.employeeId)
        if (r.role !== 'Employee' && !r.displayName?.trim()) {
          throw validation({ DisplayName: ['Enter the name of the person who uses this account.'] })
        }
        const u: DemoUser = { id: newId(), email, displayName: r.displayName?.trim() || null, role: r.role, employeeId: r.employeeId, password: r.password,
          isActive: true, failedLoginCount: 0, lockoutEndsAt: null, createdAt: new Date().toISOString() }
        db.users.push(u)
        return delay(toAccount(u))
      },
      async changeRole(id, role, employeeId) {
        requireAdmin()
        notSelf(id, 'change your own role')
        const u = account(id)
        checkRoleLink(role, employeeId, id)
        Object.assign(u, { role, employeeId })
        return delay(toAccount(u))
      },
      async setActive(id, isActive) {
        requireAdmin()
        if (!isActive) notSelf(id, 'deactivate your own account')
        const u = account(id)
        if (u.isActive === isActive) throw businessRule(`User is already ${isActive ? 'active' : 'inactive'}.`)
        u.isActive = isActive
        return delay(toAccount(u))
      },
      async unlock(id) {
        requireAdmin()
        const u = account(id)
        Object.assign(u, { failedLoginCount: 0, lockoutEndsAt: null })
        return delay(toAccount(u))
      },
      async resetPassword(id, newPassword) {
        requireAdmin()
        checkPasswordPolicy(newPassword, 'NewPassword')
        const u = account(id)
        Object.assign(u, { password: newPassword, failedLoginCount: 0, lockoutEndsAt: null })
        return delay(toAccount(u))
      },
    },
    attendance: {
      async search(q) {
        const u = caller()
        const employeeId = isStaff(u) ? q.employeeId : u.employeeId
        const rows = db.attendance
          .filter((a) => (!employeeId || a.employeeId === employeeId) &&
            (!q.from || a.checkIn >= q.from) && (!q.to || a.checkIn < q.to))
          .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
          .map(toAttendance)
        return delay(page(rows, q.page, q.pageSize))
      },
      async current() {
        const id = requireEmployee()
        const open = db.attendance.find((a) => a.employeeId === id && a.checkOut === null)
        return delay(open ? toAttendance(open) : null)
      },
      async checkIn() {
        const id = requireEmployee()
        if (db.attendance.some((a) => a.employeeId === id && a.checkOut === null)) {
          throw conflict('You are already checked in. Check out before starting a new shift.')
        }
        const log = { id: newId(), employeeId: id, checkIn: new Date().toISOString(), checkOut: null, totalHours: 0 }
        db.attendance.push(log)
        return delay(toAttendance(log))
      },
      async checkOut() {
        const id = requireEmployee()
        const log = db.attendance.find((a) => a.employeeId === id && a.checkOut === null)
        if (!log) throw conflict('You are not checked in.')
        const out = new Date()
        log.checkOut = out.toISOString()
        log.totalHours = Math.round(((out.getTime() - new Date(log.checkIn).getTime()) / 3_600_000) * 100) / 100
        return delay(toAttendance(log))
      },
    },
  }
}
