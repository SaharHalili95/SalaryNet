import type { EmploymentType } from '@/api/types'

const currency = new Intl.NumberFormat('en-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 })
const compactCurrency = new Intl.NumberFormat('en-IL', { style: 'currency', currency: 'ILS', notation: 'compact', maximumFractionDigits: 1 })
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const formatMoney = (value: number) => currency.format(value)
export const formatMoneyCompact = (value: number) => compactCurrency.format(value)
export const formatPeriod = (year: number, month: number) => `${monthNames[month - 1]} ${year}`
export const formatMonthShort = (year: number, month: number) => `${monthNames[month - 1]} ’${String(year).slice(-2)}`

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export const formatHours = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export const employmentTypeLabel: Record<EmploymentType, string> = {
  FullTime: 'Full-time',
  PartTime: 'Part-time',
  Contractor: 'Contractor',
}

export const monthOptions = monthNames.map((label, i) => ({ label, value: i + 1 }))
