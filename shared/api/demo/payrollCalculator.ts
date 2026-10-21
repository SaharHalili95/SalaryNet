import type { EmploymentType } from '../types'

/**
 * TypeScript port of SalaryNet.Domain.Services.PayrollCalculator, used only by demo mode.
 * Same illustrative brackets; NOT official tax figures. Unit tests pin it to the C# results.
 */
const incomeTaxBrackets: [upperBound: number, rate: number][] = [
  [7_010, 0.1],
  [10_060, 0.14],
  [16_150, 0.2],
  [22_440, 0.31],
  [46_690, 0.35],
  [Number.POSITIVE_INFINITY, 0.47],
]

const socialSecurityBrackets: [upperBound: number, rate: number][] = [
  [7_500, 0.035],
  [50_000, 0.12],
]

export interface PayrollBreakdown {
  grossSalary: number
  incomeTax: number
  socialSecurity: number
  deductions: number
  netSalary: number
}

/** Rounds half away from zero to cents, like the C# MidpointRounding.AwayFromZero. */
export function roundMoney(amount: number): number {
  const cents = Math.round(Math.abs(amount) * 100 + 1e-7)
  return (Math.sign(amount) * cents) / 100
}

function applyBrackets(income: number, brackets: [number, number][]): number {
  let total = 0
  let lowerBound = 0
  for (const [upperBound, rate] of brackets) {
    if (income <= lowerBound) break
    total += (Math.min(income, upperBound) - lowerBound) * rate
    lowerBound = upperBound
  }
  return total
}

export function calculatePayroll(type: EmploymentType, baseSalary: number, bonus: number): PayrollBreakdown {
  const grossSalary = roundMoney(baseSalary + bonus)
  const incomeTax = type === 'Contractor' ? 0 : roundMoney(applyBrackets(grossSalary, incomeTaxBrackets))
  const socialSecurity = type === 'Contractor' ? 0 : roundMoney(applyBrackets(grossSalary, socialSecurityBrackets))
  const deductions = roundMoney(incomeTax + socialSecurity)
  return { grossSalary, incomeTax, socialSecurity, deductions, netSalary: roundMoney(grossSalary - deductions) }
}
