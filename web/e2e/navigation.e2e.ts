import { expect, test } from '@playwright/test'
import { goTo, open, openMenu, signIn, type Role } from './helpers'

const expectedLinks: Record<Role, string[]> = {
  Admin: ['/dashboard', '/employees', '/departments', '/payroll', '/attendance', '/users'],
  HR: ['/dashboard', '/employees', '/departments', '/payroll', '/attendance'],
  Employee: ['/me', '/payroll', '/attendance'],
}

test('menu is hidden off-screen until opened', async ({ page }) => {
  await signIn(page, 'HR')
  await expect(page.locator('.sidebar')).not.toBeInViewport()
  await expect(page.locator('.menu-toggle')).toBeVisible()
})

test('menu opens from the left in English', async ({ page }) => {
  await signIn(page, 'HR')
  await openMenu(page)
  const box = (await page.locator('.sidebar').boundingBox())!
  expect(box.x).toBeLessThanOrEqual(1)
})

test('menu opens from the right in Hebrew', async ({ page }) => {
  await signIn(page, 'HR', 'he')
  await openMenu(page)
  const box = (await page.locator('.sidebar').boundingBox())!
  const width = page.viewportSize()!.width
  expect(box.x + box.width).toBeGreaterThanOrEqual(width - 1)
})

test('menu leaves part of the page visible to tap outside', async ({ page }) => {
  await signIn(page, 'HR')
  await openMenu(page)
  const box = (await page.locator('.sidebar').boundingBox())!
  expect(box.width).toBeLessThan(page.viewportSize()!.width - 40)
})

test('tapping the backdrop closes the menu', async ({ page }) => {
  await signIn(page, 'HR')
  await openMenu(page)
  const width = page.viewportSize()!.width
  await page.locator('.backdrop').tap({ position: { x: width - 10, y: 300 } })
  await expect(page.locator('.sidebar')).not.toBeInViewport()
})

test('choosing a page closes the menu and navigates', async ({ page }) => {
  await signIn(page, 'HR')
  await openMenu(page)
  await page.locator('.sidebar a[href="#/employees"]').tap()
  await expect(page).toHaveURL(/#\/employees/)
  await expect(page.locator('.sidebar')).not.toBeInViewport()
  await expect(page.locator('main h1')).toBeVisible()
})

test('the page behind the open menu does not scroll', async ({ page }) => {
  await signIn(page, 'Admin')
  await goTo(page, '/architecture')
  await openMenu(page)
  const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow)
  expect(overflow).toBe('hidden')
})

test('every link in the menu is reachable on a short screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 560 })
  await signIn(page, 'Admin')
  await openMenu(page)
  const last = page.locator('.sidebar a').last()
  await last.scrollIntoViewIfNeeded()
  await expect(last).toBeInViewport()
})

for (const [role, links] of Object.entries(expectedLinks) as [Role, string[]][]) {
  test(`${role} sees only their own pages in the menu`, async ({ page }) => {
    await signIn(page, role)
    await openMenu(page)
    const hrefs = await page.locator('.sidebar nav a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    expect(hrefs).toEqual([...links, '/architecture', '/troubleshooting', '/about'].map((l) => `#${l}`))
  })
}

test('employee cannot open staff pages by URL', async ({ page }) => {
  await signIn(page, 'Employee')
  await page.evaluate(() => (window.location.hash = '/users'))
  await expect(page).toHaveURL(/#\/me/)
})

test('signed-out visitor can open the guides from the menu', async ({ page }) => {
  await open(page, '/architecture')
  await openMenu(page)
  await page.locator('.sidebar a[href="#/troubleshooting"]').tap()
  await expect(page).toHaveURL(/#\/troubleshooting/)
})

test('guide links on the login page work', async ({ page }) => {
  await open(page, '/login')
  await page.locator('.guide-link').first().tap()
  await expect(page).toHaveURL(/#\/architecture/)
  await expect(page.locator('main h1').first()).toBeVisible()
})

test('signed-out topbar shows a sign-in button that works', async ({ page }) => {
  await open(page, '/about')
  await page.locator('.topbar').getByRole('button', { name: 'Sign in' }).tap()
  await expect(page).toHaveURL(/#\/login/)
})

test('language switch in the topbar keeps you on the same page', async ({ page }) => {
  await signIn(page, 'HR')
  await goTo(page, '/employees')
  await page.locator('.topbar').getByRole('button', { name: 'Switch to Hebrew' }).tap()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page).toHaveURL(/#\/employees/)
})

test('sign out from the topbar returns to login', async ({ page }) => {
  await signIn(page, 'HR')
  await page.locator('.topbar').getByRole('button', { name: 'Sign out' }).tap()
  await expect(page).toHaveURL(/#\/login/)
})

test('@full-app the menu links to the Angular version', async ({ page }) => {
  await signIn(page, 'HR')
  await openMenu(page)
  const link = page.locator('.sidebar .version-link')
  await expect(link).toHaveAttribute('href', '/angular/')
  await expect(link).toBeInViewport()
})

test('@full-app the sign-in page links to the Angular version', async ({ page }) => {
  await open(page, '/login')
  await expect(page.locator('.guide-link.version-link')).toHaveAttribute('href', '/angular/')
})
