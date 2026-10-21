import { expect, test } from '@playwright/test'
import { appFor, expectNoHorizontalScroll, goTo, open, openMenu, pagesFor, signIn, type Role } from './helpers'

test.describe('landscape', () => {
  for (const role of ['Admin', 'HR', 'Employee'] as Role[]) {
    test(`${role} pages fit when the phone is turned sideways`, async ({ page }) => {
      const { width, height } = page.viewportSize()!
      await page.setViewportSize({ width: height, height: width })
      await signIn(page, role)
      const paths = [...pagesFor(appFor(page), role), ...(appFor(page) === 'vue' && role === 'Admin' ? ['/architecture'] : [])]
      for (const path of paths) {
        await goTo(page, path)
        await expect(page.locator('main.content h1').first()).toBeVisible()
        await expectNoHorizontalScroll(page)
      }
    })
  }
})

test.describe('no errors in the console', () => {
  for (const role of ['Admin', 'HR', 'Employee'] as Role[]) {
    test(`${role} can visit every page without errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      await signIn(page, role)
      await openMenu(page)
      const hrefs = await page.locator('.sidebar nav a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!.slice(1)))
      await page.locator('.backdrop').tap({ position: { x: page.viewportSize()!.width - 10, y: 300 } })
      for (const href of hrefs) await goTo(page, href)
      expect(errors).toEqual([])
    })
  }
})

test.describe('dark mode', () => {
  test.use({ colorScheme: 'dark' })

  test('login uses the dark theme', async ({ page }) => {
    await open(page, '/login')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe('rgb(11, 15, 23)')
  })

  test('dashboard fits the screen in dark mode', async ({ page }) => {
    await signIn(page, 'HR')
    await expectNoHorizontalScroll(page)
  })
})

test.describe('Hebrew flows', () => {
  test('menu link navigates and closes the menu', async ({ page }) => {
    await signIn(page, 'HR', 'he')
    await openMenu(page)
    await page.locator('.sidebar a[href="#/payroll"]').tap()
    await expect(page).toHaveURL(/#\/payroll/)
    await expect(page.locator('.sidebar')).not.toBeInViewport()
  })

  test('payslip dialog fits the screen', async ({ page }) => {
    await signIn(page, 'Employee', 'he')
    await goTo(page, '/payroll')
    await page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').first().tap()
    const box = (await page.locator('.p-dialog, .mat-mdc-dialog-container').boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  })

  test('employee checks in', async ({ page }) => {
    await signIn(page, 'Employee', 'he')
    await goTo(page, '/attendance')
    await page.getByRole('button', { name: 'כניסה למשמרת' }).tap()
    await expect(page.locator('.clock .dot.on')).toBeVisible()
  })

  test('new employee dialog fits the screen', async ({ page }) => {
    await signIn(page, 'HR', 'he')
    await goTo(page, '/employees')
    await page.locator('.page-header button').tap()
    const box = (await page.locator('.p-dialog, .mat-mdc-dialog-container').boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  })
})

test.describe('more interactions', () => {
  test('dashboard can switch a chart to a table', async ({ page }) => {
    await signIn(page, 'HR')
    await page.getByRole('button', { name: 'Table' }).first().tap()
    await expect(page.locator('.data-table').first()).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('@full-app admin opens the edit dialog for a department', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/departments')
    await page.locator('.cards .card').first().getByRole('button', { name: 'Edit' }).tap()
    await expect(page.locator('.p-dialog #dept-name')).not.toHaveValue('')
  })

  test('@full-app users search filters the list', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/users')
    await page.locator('.toolbar input').first().fill('hr@')
    await expect(page.locator('.p-datatable-tbody tr, tr.mat-mdc-row')).toHaveCount(1)
  })

  test('employee filters payslips by year', async ({ page }) => {
    await signIn(page, 'Employee')
    await goTo(page, '/payroll')
    await page.locator('.toolbar .p-select, .toolbar mat-select').first().tap()
    const year = String(new Date().getFullYear())
    await page.getByRole('option', { name: year, exact: true }).tap()
    for (const row of await page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').all()) await expect(row).toContainText(year)
  })

  test('payslip shows the tax breakdown', async ({ page }) => {
    await signIn(page, 'Employee')
    await goTo(page, '/payroll')
    await page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').first().tap()
    await expect(page.locator('.p-dialog, .mat-mdc-dialog-container')).toContainText('Income tax')
    await expect(page.locator('.p-dialog, .mat-mdc-dialog-container')).toContainText('Social security')
  })

  test('"All payslips" on the overview opens the payroll page', async ({ page }) => {
    await signIn(page, 'Employee')
    await page.getByRole('button', { name: 'All payslips' }).tap()
    await expect(page).toHaveURL(/#\/payroll/)
  })
})

test.describe('account security on a phone', () => {
  test('@full-app five wrong passwords lock the account, and an admin unlocks it', async ({ page }) => {
    await open(page, '/login')
    for (let i = 0; i < 5; i++) {
      await page.locator('#email').fill('hr@salarynet.demo')
      await page.locator('#password').fill(`wrong-${i}`)
      await page.getByRole('button', { name: 'Sign in', exact: true }).tap()
      await expect(page.locator('.p-message-error, .form-error')).toBeVisible()
    }
    await page.locator('.demo-account').filter({ has: page.getByText('Admin', { exact: true }) }).tap()
    await goTo(page, '/users')
    const row = page.locator('.p-datatable-tbody tr', { hasText: 'hr@salarynet.demo' })
    await expect(row).toContainText('Locked')
    await row.getByRole('button', { name: 'Actions' }).tap()
    await page.getByRole('menuitem', { name: 'Unlock account' }).tap()
    await expect(row).not.toContainText('Locked')
    await page.locator('.topbar').getByRole('button', { name: 'Sign out' }).tap()
    await page.locator('.demo-account').filter({ has: page.getByText('HR', { exact: true }) }).tap()
    await expect(page).toHaveURL(/#\/dashboard/)
  })

  test('after signing out, protected pages send you to login', async ({ page }) => {
    await signIn(page, 'HR')
    await page.locator('.topbar').getByRole('button', { name: 'Sign out' }).tap()
    await page.evaluate(() => (window.location.hash = '/employees'))
    await expect(page).toHaveURL(/#\/login/)
  })

  test('session survives a reload', async ({ page }) => {
    await signIn(page, 'Employee')
    await page.reload()
    await expect(page.locator('.topbar .user')).toBeVisible()
  })
})

test('viewport allows pinch zoom for accessibility', async ({ page }) => {
  await open(page, '/login')
  const content = await page.locator('meta[name="viewport"]').getAttribute('content')
  expect(content).toContain('width=device-width')
  expect(content).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/)
})

test('links in the closed menu cannot be reached by keyboard or screen readers', async ({ page }) => {
  await signIn(page, 'HR')
  await expect(page.locator('.sidebar a').first()).toBeHidden()
  await openMenu(page)
  await expect(page.locator('.sidebar a').first()).toBeVisible()
})
