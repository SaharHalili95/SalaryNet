import { expect, test } from '@playwright/test'
import { open, signIn } from './helpers'

test('admin signs in with one tap and lands on the dashboard', async ({ page }) => {
  await signIn(page, 'Admin')
  await expect(page).toHaveURL(/#\/dashboard/)
})

test('HR signs in with one tap and lands on the dashboard', async ({ page }) => {
  await signIn(page, 'HR')
  await expect(page).toHaveURL(/#\/dashboard/)
})

test('employee signs in with one tap and lands on their overview', async ({ page }) => {
  await signIn(page, 'Employee')
  await expect(page).toHaveURL(/#\/me/)
})

test('one-tap sign in works in Hebrew', async ({ page }) => {
  await signIn(page, 'Employee', 'he')
  await expect(page).toHaveURL(/#\/me/)
})

test('sign in by typing email and password', async ({ page }) => {
  await open(page, '/login')
  await page.locator('#email').fill('hr@salarynet.demo')
  await page.locator('#password').fill('Demo123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).tap()
  await expect(page).toHaveURL(/#\/dashboard/)
})

test('wrong password shows an error that fits the screen', async ({ page }) => {
  await open(page, '/login')
  await page.locator('#email').fill('hr@salarynet.demo')
  await page.locator('#password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).tap()
  const error = page.locator('.p-message-error, .form-error')
  await expect(error).toBeVisible()
  const box = (await error.boundingBox())!
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
})

test('tapping a credentials row fills the form', async ({ page }) => {
  await open(page, '/login')
  await page.locator('.credentials tbody tr').nth(2).locator('td').first().tap()
  await expect(page.locator('#email')).toHaveValue('noa.cohen@salarynet.demo')
  await expect(page.locator('#password')).toHaveValue('Demo123!')
})

test('every demo email and password is fully visible', async ({ page }) => {
  await open(page, '/login')
  for (const code of await page.locator('.credentials code').all()) {
    await code.scrollIntoViewIfNeeded()
    await expect(code).toBeInViewport({ ratio: 0.99 })
  }
})

test('copy buttons are visible next to every credential', async ({ page }) => {
  await open(page, '/login')
  for (const button of await page.locator('.credentials .copy').all()) {
    await button.scrollIntoViewIfNeeded()
    await expect(button).toBeInViewport({ ratio: 0.99 })
  }
})

test('demo account buttons are stacked full width', async ({ page }) => {
  await open(page, '/login')
  const width = page.viewportSize()!.width
  for (const button of await page.locator('.demo-account').all()) {
    const box = (await button.boundingBox())!
    expect(box.width).toBeGreaterThan(width * 0.8)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
  }
})

test('password show/hide toggle works', async ({ page }) => {
  await open(page, '/login')
  await page.locator('#password').fill('Demo123!')
  await expect(page.locator('#password')).toHaveAttribute('type', 'password')
  await page.locator('.p-password-toggle-mask-icon, .p-password [data-pc-section="maskicon"], .p-password [data-pc-section="unmaskicon"], .password-toggle').first().tap()
  await expect(page.locator('#password')).toHaveAttribute('type', 'text')
})

test('login form is reachable without scrolling sideways in Hebrew', async ({ page }) => {
  await open(page, '/login', 'he')
  await page.locator('#email').scrollIntoViewIfNeeded()
  await expect(page.locator('#email')).toBeInViewport({ ratio: 0.99 })
  await expect(page.locator('#password')).toBeInViewport({ ratio: 0.99 })
})

test('signed-in user opening /login is sent home', async ({ page }) => {
  await signIn(page, 'HR')
  await page.evaluate(() => (window.location.hash = '/login'))
  await expect(page).toHaveURL(/#\/dashboard/)
})
