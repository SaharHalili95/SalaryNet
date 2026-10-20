import { expect, test } from '@playwright/test'
import { appFor, expectNoHorizontalScroll, goTo, open, pagesFor, signIn, type Locale, type Role } from './helpers'

const guides = ['/architecture', '/troubleshooting', '/about']
for (const locale of ['en', 'he'] as Locale[]) {
  test.describe(`fits the screen (${locale})`, () => {
    test(`signed out: login`, async ({ page }) => {
      await open(page, '/login', locale)
      await expect(page.locator('form.card')).toBeVisible()
      await expectNoHorizontalScroll(page)
    })

    for (const path of guides) {
      test(`@full-app signed out: ${path}`, async ({ page }) => {
        await open(page, path, locale)
        await expect(page.locator('main.content h1').first()).toBeVisible()
        await expectNoHorizontalScroll(page)
      })
    }

    for (const role of ['Admin', 'HR', 'Employee'] as Role[]) {
      test(`${role}: every page`, async ({ page }) => {
        await signIn(page, role, locale)
        const paths = [...pagesFor(appFor(page), role), ...(appFor(page) === 'vue' ? guides : [])]
        for (const path of paths) {
          await test.step(path, async () => {
            await goTo(page, path)
            await expect(page.locator('main.content h1').first()).toBeVisible()
            await expectNoHorizontalScroll(page)
          })
        }
      })
    }
  })
}

test('page direction follows the language', async ({ page }) => {
  await open(page, '/login', 'he')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.getByRole('button', { name: 'מעבר לאנגלית' }).tap()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

test('text inputs are at least 16px so iOS Safari does not zoom in on focus', async ({ page }) => {
  await open(page, '/login')
  for (const id of ['#email', '#password']) {
    const size = await page.locator(id).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(size, id).toBeGreaterThanOrEqual(16)
  }
})

test('search fields on list pages are at least 16px', async ({ page }) => {
  await signIn(page, 'Admin')
  for (const path of ['/employees', ...(appFor(page) === 'vue' ? ['/users'] : [])]) {
    await goTo(page, path)
    const size = await page.locator('.toolbar input').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(size, path).toBeGreaterThanOrEqual(16)
  }
})

test('topbar buttons are large enough to tap (40px)', async ({ page }) => {
  await signIn(page, 'HR')
  for (const button of await page.locator('.topbar button:visible').all()) {
    const box = (await button.boundingBox())!
    expect(Math.min(box.width, box.height), await button.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(40)
  }
})

test('topbar stays on one row', async ({ page }) => {
  await signIn(page, 'Admin', 'he')
  const box = (await page.locator('.topbar').boundingBox())!
  expect(box.height).toBeLessThanOrEqual(64)
})

test('dashboard charts are drawn with a real size', async ({ page }) => {
  await signIn(page, 'HR')
  const canvases = page.locator('main canvas')
  await expect(canvases.first()).toBeVisible()
  for (const canvas of await canvases.all()) {
    const box = (await canvas.boundingBox())!
    expect(box.width).toBeGreaterThan(150)
    expect(box.height).toBeGreaterThan(100)
  }
})

test('page headers wrap their action buttons instead of overflowing', async ({ page }) => {
  await signIn(page, 'Admin')
  await goTo(page, '/payroll')
  for (const button of await page.locator('.page-header button').all()) {
    await expect(button).toBeInViewport({ ratio: 0.99 })
  }
})
