import { describe, expect, it } from 'vitest'
import { calculatePayroll } from '../payrollCalculator'

// Same cases as PayrollCalculatorTests.cs, so the demo can never drift from the backend.
describe('calculatePayroll', () => {
  it.each([
    [5_000, 0, 500.0, 175.0],
    [7_010, 0, 701.0, 245.35],
    [10_000, 0, 1_119.6, 562.5],
    [8_000, 2_000, 1_119.6, 562.5],
    [60_000, 0, 19_039.1, 5_362.5],
    [10_000.05, 0, 1_119.61, 562.51],
  ])('base %d + bonus %d matches the C# calculator', (base, bonus, incomeTax, socialSecurity) => {
    const result = calculatePayroll('FullTime', base, bonus)

    expect(result.incomeTax).toBe(incomeTax)
    expect(result.socialSecurity).toBe(socialSecurity)
    expect(result.netSalary).toBeCloseTo(result.grossSalary - result.deductions, 10)
  })

  it('withholds nothing for contractors', () => {
    expect(calculatePayroll('Contractor', 20_000, 1_500)).toEqual({
      grossSalary: 21_500, incomeTax: 0, socialSecurity: 0, deductions: 0, netSalary: 21_500,
    })
  })
})
