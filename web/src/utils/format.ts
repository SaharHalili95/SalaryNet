import { intlLocale } from '@/i18n'

// Intl formatters are relatively expensive to build, so keep one per locale.
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()
function formatter<T extends Intl.NumberFormat | Intl.DateTimeFormat>(key: string, create: (locale: string) => T): T {
  const locale = intlLocale()
  const id = `${locale}:${key}`
  if (!cache.has(id)) cache.set(id, create(locale))
  return cache.get(id) as T
}

export const formatMoney = (value: number) =>
  formatter('money', (l) => new Intl.NumberFormat(l, { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })).format(value)

export const formatMoneyCompact = (value: number) =>
  formatter('money-compact', (l) =>
    new Intl.NumberFormat(l, { style: 'currency', currency: 'ILS', notation: 'compact', maximumFractionDigits: 1 })).format(value)

const monthDate = (year: number, month: number) => new Date(Date.UTC(year, month - 1, 1))

export const formatPeriod = (year: number, month: number) =>
  formatter('period', (l) => new Intl.DateTimeFormat(l, { month: 'short', year: 'numeric', timeZone: 'UTC' })).format(monthDate(year, month))

export const formatMonthShort = (year: number, month: number) =>
  formatter('month-short', (l) => new Intl.DateTimeFormat(l, { month: 'short', year: '2-digit', timeZone: 'UTC' })).format(monthDate(year, month))

export const formatDate = (iso: string) =>
  formatter('date', (l) => new Intl.DateTimeFormat(l, { day: '2-digit', month: 'short', year: 'numeric' })).format(new Date(iso))

export const formatTime = (iso: string) =>
  formatter('time', (l) => new Intl.DateTimeFormat(l, { hour: '2-digit', minute: '2-digit' })).format(new Date(iso))

export const formatHours = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export const monthOptions = () =>
  Array.from({ length: 12 }, (_, i) => ({
    label: formatter('month-name', (l) => new Intl.DateTimeFormat(l, { month: 'long', timeZone: 'UTC' })).format(monthDate(2026, i + 1)),
    value: i + 1,
  }))
