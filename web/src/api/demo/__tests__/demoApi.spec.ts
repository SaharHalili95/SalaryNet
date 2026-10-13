import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../../errors'
import { createDemoApi } from '../demoApi'
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD, DEMO_PASSWORD, MAX_FAILED_LOGINS } from '../demoData'

describe('demo API authorization', () => {
  let token: string | null
  const api = createDemoApi(() => token)

  const signIn = async (email: string) => {
    const password = email === DEMO_ACCOUNTS.admin ? DEMO_ADMIN_PASSWORD : DEMO_PASSWORD
    token = (await api.login(email, password)).accessToken
  }

  beforeEach(() => {
    token = null
  })

  it('rejects a wrong password with 401', async () => {
    await expect(api.login(DEMO_ACCOUNTS.hr, 'nope')).rejects.toMatchObject({ status: 401 })
  })

  it('scopes an employee to their own payslips even when another id is requested', async () => {
    await signIn(DEMO_ACCOUNTS.hr)
    const someoneElse = (await api.employees.search({ search: 'yonatan' })).items[0]!

    await signIn(DEMO_ACCOUNTS.employee)
    const me = await api.employees.mine()
    const page = await api.payroll.search({ employeeId: someoneElse.id, pageSize: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((p) => p.employeeId === me.id)).toBe(true)
  })

  it("hides other employees' payslips behind 404", async () => {
    await signIn(DEMO_ACCOUNTS.hr)
    const foreign = (await api.payroll.search({ pageSize: 100 })).items.find((p) => !p.employeeName.startsWith('Noa'))!

    await signIn(DEMO_ACCOUNTS.employee)

    await expect(api.payroll.get(foreign.id)).rejects.toMatchObject({ status: 404 })
  })

  it('blocks employees from staff-only endpoints with 403', async () => {
    await signIn(DEMO_ACCOUNTS.employee)

    await expect(api.employees.search({})).rejects.toBeInstanceOf(ApiError)
    await expect(api.dashboard()).rejects.toMatchObject({ status: 403 })
  })

  it('refuses a duplicate payslip for the same period with 409', async () => {
    await signIn(DEMO_ACCOUNTS.hr)
    const existing = (await api.payroll.search({ pageSize: 1 })).items[0]!

    await expect(api.payroll.generate({ employeeId: existing.employeeId, year: existing.year, month: existing.month, bonus: 0 }))
      .rejects.toMatchObject({ status: 409 })
  })

  it('does not allow checking in twice', async () => {
    await signIn(DEMO_ACCOUNTS.employee)
    await api.attendance.checkIn()

    await expect(api.attendance.checkIn()).rejects.toMatchObject({ status: 409 })
    const closed = await api.attendance.checkOut()
    expect(closed.isOpen).toBe(false)
  })

  it('locks an account after repeated failures until an admin unlocks it', async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await expect(api.login(DEMO_ACCOUNTS.hr, 'Wrong1234')).rejects.toMatchObject({ status: 401 })
    }
    await expect(api.login(DEMO_ACCOUNTS.hr, DEMO_PASSWORD)).rejects.toMatchObject({ status: 401 })

    await signIn(DEMO_ACCOUNTS.admin)
    const hr = (await api.users.search({ search: 'hr@' })).items[0]!
    expect(hr.isLockedOut).toBe(true)
    await api.users.unlock(hr.id)

    await expect(api.login(DEMO_ACCOUNTS.hr, DEMO_PASSWORD)).resolves.toMatchObject({ user: { role: 'HR' } })
  })

  it('restricts user administration to admins', async () => {
    await signIn(DEMO_ACCOUNTS.hr)

    await expect(api.users.search({})).rejects.toMatchObject({ status: 403 })
  })

  it('rejects weak passwords and prevents admins from deactivating themselves', async () => {
    await signIn(DEMO_ACCOUNTS.admin)
    const me = await api.me()

    await expect(api.users.create({ email: 'weak@salarynet.demo', password: 'password', role: 'HR', employeeId: null, displayName: 'Weak' }))
      .rejects.toMatchObject({ status: 400 })
    await expect(api.users.setActive(me.id, false)).rejects.toMatchObject({ status: 422 })
  })

  it('changes the password only with the correct current password', async () => {
    await signIn(DEMO_ACCOUNTS.employee)

    await expect(api.changePassword('nope', 'Rotated123')).rejects.toMatchObject({ status: 400 })
    await api.changePassword(DEMO_PASSWORD, 'Rotated123')
    await expect(api.login(DEMO_ACCOUNTS.employee, 'Rotated123')).resolves.toBeDefined()
  })
})

describe('randomChange', () => {
  it('keeps headcount between 35 and 45 and never removes the demo employee', async () => {
    const { createDemoDatabase, randomChange } = await import('../demoData')
    const db = createDemoDatabase()
    const demoEmployeeId = db.users.find((u) => u.role === 'Employee')!.employeeId

    for (let i = 0; i < 300; i++) {
      randomChange(db)
      const active = db.employees.filter((e) => e.isActive).length
      expect(active).toBeGreaterThanOrEqual(35)
      expect(active).toBeLessThanOrEqual(45)
    }

    expect(db.employees.find((e) => e.id === demoEmployeeId)!.isActive).toBe(true)
  })

  it('records a departure as deactivation so payroll history remains', async () => {
    const { createDemoDatabase, randomChange } = await import('../demoData')
    const db = createDemoDatabase()
    const before = db.employees.length

    const change = randomChange(db, () => 0.99)

    expect(change.kind).toBe('leave')
    expect(db.employees.length).toBe(before)
  })
})
