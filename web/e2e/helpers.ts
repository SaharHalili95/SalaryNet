import { expect, type Page } from '@playwright/test'

export type Role = 'Admin' | 'HR' | 'Employee'
export type Locale = 'en' | 'he'

const roleLabel: Record<Locale, Record<Role, string>> = {
  en: { Admin: 'Admin', HR: 'HR', Employee: 'Employee' },
  he: { Admin: 'מנהל מערכת', HR: 'משאבי אנוש', Employee: 'עובד' },
}

/** Starts a fresh session in the given language. Each page load gets its own in-memory demo company. */
export async function open(page: Page, path = '/', locale: Locale = 'en') {
  await page.addInitScript((l) => {
    if (!sessionStorage.getItem('e2e.init')) {
      localStorage.clear()
      localStorage.setItem('salarynet.locale', l)
      sessionStorage.setItem('e2e.init', '1')
    }
  }, locale)
  await page.goto(`/#${path}`)
}

export async function signIn(page: Page, role: Role, locale: Locale = 'en') {
  await open(page, '/login', locale)
  await page.locator('.demo-account').filter({ has: page.getByText(roleLabel[locale][role], { exact: true }) }).tap()
  await expect(page.locator('.topbar')).toBeVisible()
}

/** Navigates inside the SPA without a reload, so the in-memory demo session survives. */
export async function goTo(page: Page, path: string) {
  await page.evaluate((p) => (window.location.hash = p), path)
  await page.waitForFunction((p) => window.location.hash === `#${p}`, path)
  await page.waitForLoadState('networkidle')
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return false
        // Content inside an element that scrolls on its own (tables, code blocks) is allowed to be wider.
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const style = getComputedStyle(p)
          if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) return false
          if (style.position === 'fixed') return false
        }
        if (getComputedStyle(el).position === 'fixed') return false
        return r.right > width + 1 || r.left < -1
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`)
    return { scrollWidth: document.documentElement.scrollWidth, width, offenders }
  })
  expect(overflow.offenders, `elements wider than the ${overflow.width}px screen`).toEqual([])
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width)
}

export async function openMenu(page: Page) {
  await page.locator('.menu-toggle').tap()
  await expect(page.locator('.sidebar.open')).toBeInViewport()
}
