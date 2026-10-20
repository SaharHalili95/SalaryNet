import { expect, test, type Locator, type Page } from '@playwright/test'
import { dialog, goTo, signIn } from './helpers'

async function expectInsideScreen(page: Page, locator: Locator) {
  const box = (await locator.boundingBox())!
  const { width, height } = page.viewportSize()!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
  expect(box.height).toBeLessThanOrEqual(height)
}

async function expectDialogUsable(page: Page) {
  const modal = dialog(page)
  await expect(modal).toBeVisible()
  await expectInsideScreen(page, modal)
  const footer = modal.locator('.p-dialog-footer button, mat-dialog-actions button').last()
  if (await footer.count()) {
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeInViewport({ ratio: 0.99 })
  }
  return modal
}

test.describe('payroll', () => {
  test('employee opens a payslip and it fits the screen', async ({ page }) => {
    await signIn(page, 'Employee')
    await goTo(page, '/payroll')
    await page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').first().tap()
    const dialog = await expectDialogUsable(page)
    await expect(dialog).toContainText('Net')
  })

  test('payslip amounts are not cut off', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/payroll')
    await page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').first().tap()
    const dialog = await expectDialogUsable(page)
    for (const amount of await dialog.locator('.money').all()) {
      await expect(amount).toBeInViewport({ ratio: 0.99 })
    }
  })

  test('payslip closes with its close button', async ({ page }) => {
    await signIn(page, 'Employee')
    await goTo(page, '/payroll')
    await page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').first().tap()
    await expectDialogUsable(page)
    await dialog(page).getByRole('button', { name: /Close|Cancel/ }).last().tap()
    await expect(dialog(page)).toBeHidden()
  })

  test('staff can open the single payslip dialog', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/payroll')
    await page.getByRole('button', { name: 'Single payslip' }).tap()
    await expectDialogUsable(page)
  })

  test('staff can open the monthly run dialog', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/payroll')
    await page.getByRole('button', { name: 'Run monthly payroll' }).tap()
    await expectDialogUsable(page)
  })

  test('payroll table scrolls inside its panel, not the page', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/payroll')
    const table = page.locator('.p-datatable-table-container, .table-scroll').first()
    const box = (await table.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  })

  test('paginator fits the screen', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/payroll')
    const paginator = page.locator('.p-paginator, mat-paginator').first()
    await paginator.scrollIntoViewIfNeeded()
    await expectInsideScreen(page, paginator)
  })

  test('next page button works', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/payroll')
    const first = await page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').first().innerText()
    await page.locator('.p-paginator-next, button[aria-label="Next page"]').tap()
    await expect(page.locator('.p-datatable-tbody tr, tr.mat-mdc-row').first()).not.toHaveText(first)
  })

  test('year filter dropdown opens inside the screen', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/payroll')
    await page.locator('.toolbar .p-select, .toolbar mat-select').first().tap()
    const overlay = page.locator('.p-select-overlay, .cdk-overlay-pane').last()
    await expect(overlay).toBeVisible()
    await expectInsideScreen(page, overlay)
  })
})

test.describe('employees', () => {
  test('new employee dialog fits and every field is reachable', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/employees')
    await page.getByRole('button', { name: 'New employee' }).tap()
    const dialog = await expectDialogUsable(page)
    for (const id of ['#firstName', '#lastName', '#email', '#salary']) {
      await dialog.locator(id).scrollIntoViewIfNeeded()
      await expect(dialog.locator(id)).toBeInViewport({ ratio: 0.99 })
    }
  })

  test('creates an employee on a phone', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/employees')
    await page.getByRole('button', { name: 'New employee' }).tap()
    const dialog = page.locator('.p-dialog, .mat-mdc-dialog-container').last()
    await dialog.locator('#firstName').fill('Mobile')
    await dialog.locator('#lastName').fill('Tester')
    await dialog.locator('#email').fill('mobile.tester@salarynet.demo')
    await dialog.locator('#department').tap()
    await page.locator('.p-select-overlay .p-select-option, .cdk-overlay-pane mat-option').first().tap()
    await dialog.locator('#salary').fill('12000')
    await dialog.getByRole('button', { name: 'Create employee' }).tap()
    await expect(dialog).toBeHidden()
    await page.locator('.toolbar input').first().fill('Mobile')
    await expect(page.locator('.p-datatable-tbody, table[mat-table]')).toContainText('Tester')
  })

  test('search filters the list', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/employees')
    const rows = page.locator('.p-datatable-tbody tr, tr.mat-mdc-row')
    const before = await rows.count()
    await page.locator('.toolbar input').first().fill('Noa')
    await expect.poll(() => rows.count()).toBeLessThan(before)
    for (const row of await rows.all()) await expect(row).toContainText('Noa')
  })

  test('filters stack and stay inside the screen', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/employees')
    for (const filter of await page.locator('.toolbar > *').all()) {
      await expectInsideScreen(page, filter)
    }
  })

  test('validation errors are shown inside the dialog', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/employees')
    await page.getByRole('button', { name: 'New employee' }).tap()
    await page.locator('.p-dialog, .mat-mdc-dialog-container').getByRole('button', { name: /Create employee|Create/ }).tap()
    const error = page.locator('.p-dialog small.error, .mat-mdc-dialog-container small.error').first()
    await expect(error).toBeVisible()
    await expectInsideScreen(page, error)
  })
})

test.describe('@full-app departments', () => {
  test('department cards stack in one column', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/departments')
    const cards = page.locator('.cards .card')
    const a = (await cards.nth(0).boundingBox())!
    const b = (await cards.nth(1).boundingBox())!
    expect(b.y).toBeGreaterThan(a.y + a.height - 1)
  })

  test('admin opens the new department dialog', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/departments')
    await page.getByRole('button', { name: 'New department' }).tap()
    await expectDialogUsable(page)
  })

  test('edit and delete buttons are large enough to tap', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/departments')
    for (const button of await page.locator('.cards .card').first().locator('.actions button').all()) {
      const box = (await button.boundingBox())!
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40)
    }
  })
})

test.describe('attendance', () => {
  test('employee checks in and out on a phone', async ({ page }) => {
    await signIn(page, 'Employee')
    await goTo(page, '/attendance')
    await page.getByRole('button', { name: 'Check in' }).tap()
    await expect(page.getByRole('button', { name: 'Check out' })).toBeVisible()
    await page.getByRole('button', { name: 'Check out' }).tap()
    await expect(page.getByRole('button', { name: 'Check in' })).toBeVisible()
  })

  test('check-in button fits the screen', async ({ page }) => {
    await signIn(page, 'Employee')
    await goTo(page, '/attendance')
    await expectInsideScreen(page, page.locator('.clock button'))
  })

  test('employee can check in from the overview page', async ({ page }) => {
    await signIn(page, 'Employee')
    await page.locator('.shift').getByRole('button', { name: 'Check in' }).tap()
    await expect(page.locator('.shift').getByRole('button', { name: 'Check out' })).toBeVisible()
  })
})

test.describe('@full-app users', () => {
  test('row action menu opens inside the screen', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/users')
    const actions = page.getByRole('button', { name: 'Actions' }).first()
    await actions.scrollIntoViewIfNeeded()
    await actions.tap()
    const menu = page.locator('.p-menu-overlay, .p-tieredmenu-overlay').first()
    await expect(menu).toBeVisible()
    await expectInsideScreen(page, menu)
  })

  test('actions button is visible without scrolling sideways', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/users')
    const actions = page.getByRole('button', { name: 'Actions' }).first()
    await actions.scrollIntoViewIfNeeded()
    await expect(actions).toBeInViewport({ ratio: 0.99 })
  })

  test('new account dialog fits the screen', async ({ page }) => {
    await signIn(page, 'Admin')
    await goTo(page, '/users')
    await page.getByRole('button', { name: 'New account' }).tap()
    await expectDialogUsable(page)
  })
})

test.describe('@full-app account', () => {
  test('change password dialog fits the screen', async ({ page }) => {
    await signIn(page, 'Employee')
    await page.locator('.topbar').getByRole('button', { name: 'Change password' }).tap()
    await expectDialogUsable(page)
  })

  test('change password dialog fits in Hebrew', async ({ page }) => {
    await signIn(page, 'Employee', 'he')
    await page.locator('.topbar').getByRole('button', { name: 'החלפת סיסמה' }).tap()
    await expectDialogUsable(page)
  })
})

test.describe('@full-app guides', () => {
  test('architecture diagram fits or scrolls inside its own box', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/architecture')
    const width = page.viewportSize()!.width
    for (const svg of await page.locator('main svg').all()) {
      const box = await svg.boundingBox()
      if (box) expect(box.x).toBeGreaterThanOrEqual(-1)
      expect(await svg.evaluate((el, w) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          if (['auto', 'scroll'].includes(getComputedStyle(p).overflowX)) return true
        }
        return el.getBoundingClientRect().right <= w + 1
      }, width)).toBe(true)
    }
  })

  test('troubleshooting entries open on tap', async ({ page }) => {
    await signIn(page, 'HR')
    await goTo(page, '/troubleshooting')
    const header = page.locator('.p-accordionheader, details summary').first()
    await header.tap()
    await expect(page.locator('.p-accordioncontent-content, details[open] > :not(summary)').first()).toBeVisible()
  })
})
