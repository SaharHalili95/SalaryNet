import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../../errors'
import { createDemoApi } from '../demoApi'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../demoData'

describe('demo API authorization', () => {
  let token: string | null
  const api = createDemoApi(() => token)

  const signIn = async (email: string) => {
    token = (await api.login(email, DEMO_PASSWORD)).accessToken
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
})
