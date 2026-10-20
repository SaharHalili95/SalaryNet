import * as shared from '@shared/format/format'
import { currentLocale } from '@/i18n'

export const formatMoney = (value: number) => shared.formatMoney(value, currentLocale())
export const formatMoneyCompact = (value: number) => shared.formatMoneyCompact(value, currentLocale())
export const formatPeriod = (year: number, month: number) => shared.formatPeriod(year, month, currentLocale())
export const formatMonthShort = (year: number, month: number) => shared.formatMonthShort(year, month, currentLocale())
export const formatDate = (iso: string) => shared.formatDate(iso, currentLocale())
export const formatTime = (iso: string) => shared.formatTime(iso, currentLocale())
export const formatHours = (hours: number) => shared.formatHours(hours, currentLocale())
export const monthOptions = () => shared.monthOptions(currentLocale())
