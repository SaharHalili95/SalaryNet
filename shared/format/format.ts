import { intlLocale, type Locale } from '../i18n/locale'

// Intl formatters are relatively expensive to build, so keep one per locale.
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()
function formatter<T extends Intl.NumberFormat | Intl.DateTimeFormat>(locale: Locale, key: string, create: (locale: string) => T): T {
  const id = `${locale}:${key}`
  if (!cache.has(id)) cache.set(id, create(intlLocale(locale)))
  return cache.get(id) as T
}

export const formatMoney = (value: number, locale: Locale) =>
  formatter(locale, 'money', (l) => new Intl.NumberFormat(l, { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })).format(value)

export const formatMoneyCompact = (value: number, locale: Locale) =>
  formatter(locale, 'money-compact', (l) =>
    new Intl.NumberFormat(l, { style: 'currency', currency: 'ILS', notation: 'compact', maximumFractionDigits: 1 })).format(value)

const monthDate = (year: number, month: number) => new Date(Date.UTC(year, month - 1, 1))

export const formatPeriod = (year: number, month: number, locale: Locale) =>
  formatter(locale, 'period', (l) => new Intl.DateTimeFormat(l, { month: 'short', year: 'numeric', timeZone: 'UTC' })).format(monthDate(year, month))

export const formatMonthShort = (year: number, month: number, locale: Locale) =>
  formatter(locale, 'month-short', (l) => new Intl.DateTimeFormat(l, { month: 'short', year: '2-digit', timeZone: 'UTC' })).format(monthDate(year, month))

export const formatDate = (iso: string, locale: Locale) =>
  formatter(locale, 'date', (l) => new Intl.DateTimeFormat(l, { day: '2-digit', month: 'short', year: 'numeric' })).format(new Date(iso))

export const formatTime = (iso: string, locale: Locale) =>
  formatter(locale, 'time', (l) => new Intl.DateTimeFormat(l, { hour: '2-digit', minute: '2-digit' })).format(new Date(iso))

export const formatHours = (hours: number, locale: Locale) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return locale === 'he' ? `${h} ש׳ ${String(m).padStart(2, '0')} ד׳` : `${h}h ${String(m).padStart(2, '0')}m`
}

export const monthOptions = (locale: Locale) =>
  Array.from({ length: 12 }, (_, i) => ({
    label: formatter(locale, 'month-name', (l) => new Intl.DateTimeFormat(l, { month: 'long', timeZone: 'UTC' })).format(monthDate(2026, i + 1)),
    value: i + 1,
  }))
