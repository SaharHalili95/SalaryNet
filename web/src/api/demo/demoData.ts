import type { EmploymentType, UserRole } from '../types'
import { calculatePayroll } from './payrollCalculator'

export interface DemoDepartment { id: string; name: string; description: string; createdAt: string }
export interface DemoEmployee {
  id: string; firstName: string; lastName: string; email: string; departmentId: string
  baseSalary: number; employmentType: EmploymentType; isActive: boolean; createdAt: string
}
export interface DemoPayroll {
  id: string; employeeId: string; year: number; month: number; bonus: number; grossSalary: number
  incomeTax: number; socialSecurity: number; deductions: number; netSalary: number; generatedAt: string
}
export interface DemoAttendance { id: string; employeeId: string; checkIn: string; checkOut: string | null; totalHours: number }
export interface DemoUser {
  id: string; email: string; displayName: string | null; role: UserRole; employeeId: string | null; password: string
  isActive: boolean; failedLoginCount: number; lockoutEndsAt: string | null; createdAt: string
}

export interface DemoDatabase {
  departments: DemoDepartment[]
  employees: DemoEmployee[]
  payroll: DemoPayroll[]
  attendance: DemoAttendance[]
  users: DemoUser[]
}

export const DEMO_PASSWORD = 'Demo123!'
export const DEMO_ADMIN_PASSWORD = 'Admin1234'
export const MAX_FAILED_LOGINS = 5
export const LOCKOUT_MINUTES = 15
export const DEMO_ACCOUNTS = {
  admin: 'admin@salarynet.demo',
  hr: 'hr@salarynet.demo',
  employee: 'noa.cohen@salarynet.demo',
} as const

const departmentSpecs: [string, string, number, number][] = [
  ['Engineering', 'Product development, platform and QA', 18_000, 42_000],
  ['Finance', 'Accounting, payroll control and reporting', 14_000, 30_000],
  ['Human Resources', 'Recruiting, people operations and benefits', 12_000, 26_000],
  ['Sales', 'New business and account management', 11_000, 28_000],
  ['Customer Success', 'Onboarding, support and retention', 9_000, 18_000],
  ['Operations', 'IT, facilities and procurement', 9_500, 20_000],
]

const firstNames = ['Noa', 'Yonatan', 'Maya', 'Itai', 'Tamar', 'Omer', 'Shira', 'Eitan', 'Yael', 'Amit',
  'Lior', 'Roni', 'Daniel', 'Michal', 'Ariel', 'Hila', 'Gal', 'Nadav', 'Dana', 'Tomer',
  'Adi', 'Ido', 'Keren', 'Yuval', 'Sivan', 'Ofir', 'Rotem', 'Alon', 'Inbar', 'Elad']
const lastNames = ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Friedman', 'Avraham', 'Dahan', 'Shapiro', 'Katz',
  'Azoulay', 'Golan', 'Ben-David', 'Rosen', 'Halevi', 'Segal', 'Weiss', 'Navon', 'Amar', 'Tal']

/** Small deterministic PRNG so every visitor sees the same demo company. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let idCounter = 0
export const newId = () => {
  idCounter += 1
  return `00000000-0000-4000-8000-${idCounter.toString(16).padStart(12, '0')}`
}

const roundToHundreds = (n: number) => Math.round(n / 100) * 100

const addMonths = (year: number, month0: number, delta: number) => new Date(Date.UTC(year, month0 + delta, 1))

/**
 * Mirrors DemoDataSeeder.cs: hires spread over five years, recent joiners and two leavers,
 * an annual raise three months ago and a quarter-end bonus round, with payslips issued on the 1st.
 */
export function createDemoDatabase(now: Date = new Date()): DemoDatabase {
  const random = mulberry32(2026)
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const monthKey = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth()
  const currentKey = y * 12 + m
  const founded = addMonths(y, m, -72).toISOString()
  const db: DemoDatabase = { departments: [], employees: [], payroll: [], attendance: [], users: [] }

  db.departments = departmentSpecs.map(([name, description]) => ({ id: newId(), name, description, createdAt: founded }))

  const count = Math.floor((firstNames.length * 4) / 3)
  const recentHires = 5
  const history: { hiredKey: number; leftKey: number | null }[] = []

  for (let i = 0; i < count; i++) {
    const spec = departmentSpecs[i % departmentSpecs.length]!
    const first = firstNames[i % firstNames.length]!
    const last = lastNames[(i * 7) % lastNames.length]!
    let salary = roundToHundreds(spec[2] + (spec[3] - spec[2]) * random())
    const roll = Math.floor(random() * 10)
    let type: EmploymentType = roll < 7 ? 'FullTime' : roll < 9 ? 'PartTime' : 'Contractor'
    if (i === 0) type = 'FullTime'
    if (type === 'PartTime') salary = roundToHundreds(salary * 0.6)

    const isRecentHire = i >= count - 2 - recentHires && i < count - 2
    const isLeaver = i >= count - 2
    const monthsAgo = i === 0 ? 36 : isRecentHire ? Math.floor(random() * 6) : 7 + Math.floor(random() * 53)
    const hired = addMonths(y, m, -monthsAgo)
    hired.setUTCDate(1 + Math.floor(random() * 27))
    hired.setUTCHours(9)

    db.employees.push({
      id: newId(),
      firstName: first,
      lastName: last,
      email: i === 0 ? DEMO_ACCOUNTS.employee : `${first}.${last}${i}@salarynet.demo`.toLowerCase(),
      departmentId: db.departments[i % db.departments.length]!.id,
      baseSalary: salary,
      employmentType: type,
      isActive: !isLeaver,
      createdAt: hired.toISOString(),
    })
    history.push({ hiredKey: monthKey(hired), leftKey: isLeaver ? currentKey - 2 : null })
  }

  const raiseKey = currentKey - 3
  db.employees.forEach((employee, index) => {
    const { hiredKey, leftKey } = history[index]!
    const beforeRaise = roundToHundreds(employee.baseSalary / 1.04)
    for (let offset = 6; offset >= 1; offset--) {
      const period = addMonths(y, m, -offset)
      const key = monthKey(period)
      if (key < hiredKey || (leftKey !== null && key > leftKey)) continue
      const salary = key < raiseKey && hiredKey < raiseKey ? beforeRaise : employee.baseSalary
      const quarterEnd = (period.getUTCMonth() + 1) % 3 === 0
      const r = Math.floor(random() * 10)
      const bonus = quarterEnd && r < 4 ? (15 + Math.floor(random() * 46)) * 100 : r === 0 ? (5 + Math.floor(random() * 11)) * 100 : 0
      const issued = addMonths(y, m, -offset + 1)
      issued.setUTCHours(8)
      db.payroll.push({
        id: newId(), employeeId: employee.id, year: period.getUTCFullYear(), month: period.getUTCMonth() + 1,
        bonus, ...calculatePayroll(employee.employmentType, salary, bonus), generatedAt: issued.toISOString(),
      })
    }
  })

  const today = Date.UTC(y, m, now.getUTCDate())
  for (const employee of db.employees.filter((e) => e.isActive && e.employmentType !== 'Contractor')) {
    for (let day = 14; day >= 1; day--) {
      const date = new Date(today - day * 86_400_000)
      if (date.getUTCDay() === 5 || date.getUTCDay() === 6 || date < new Date(employee.createdAt.slice(0, 10))) continue
      const checkIn = new Date(date.getTime() + (5 * 60 + Math.floor(random() * 120)) * 60_000)
      const minutes = employee.employmentType === 'PartTime' ? 240 + Math.floor(random() * 90) : 480 + Math.floor(random() * 120)
      db.attendance.push({
        id: newId(), employeeId: employee.id, checkIn: checkIn.toISOString(),
        checkOut: new Date(checkIn.getTime() + minutes * 60_000).toISOString(),
        totalHours: Math.round((minutes / 60) * 100) / 100,
      })
    }
  }

  const account = (email: string, password: string, role: UserRole, employeeId: string | null, displayName: string | null): DemoUser => ({
    id: newId(), email, displayName, role, employeeId, password, isActive: true, failedLoginCount: 0, lockoutEndsAt: null, createdAt: founded,
  })
  db.users = [
    account(DEMO_ACCOUNTS.admin, DEMO_ADMIN_PASSWORD, 'Admin', null, 'Eyal Shamir'),
    account(DEMO_ACCOUNTS.hr, DEMO_PASSWORD, 'HR', null, 'Michal Barak'),
    account(DEMO_ACCOUNTS.employee, DEMO_PASSWORD, 'Employee', db.employees[0]!.id, null),
  ]

  return db
}
