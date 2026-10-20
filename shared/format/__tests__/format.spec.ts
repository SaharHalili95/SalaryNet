import { describe, expect, it } from 'vitest'
import { formatDate, formatHours, formatMoney, formatPeriod, monthOptions } from '../format'

describe('shared formatting', () => {
  it('formats money per locale', () => {
    expect(formatMoney(21102.6, 'en')).toBe('₪21,102.60')
    expect(formatMoney(21102.6, 'he')).toContain('21,102.6')
  })

  it('formats hours in each language', () => {
    expect(formatHours(8.5, 'en')).toBe('8h 30m')
    expect(formatHours(8.5, 'he')).toBe('8 ש׳ 30 ד׳')
  })

  it('formats a period in UTC so the month never shifts', () => {
    expect(formatPeriod(2026, 1, 'en')).toBe('Jan 2026')
  })

  it('lists twelve months starting with January', () => {
    expect(monthOptions('en')[0]).toEqual({ label: 'January', value: 1 })
    expect(monthOptions('he')).toHaveLength(12)
  })

  it('keeps a separate formatter per locale', () => {
    expect(formatDate('2026-10-03T00:00:00Z', 'en')).not.toBe(formatDate('2026-10-03T00:00:00Z', 'he'))
  })
})
