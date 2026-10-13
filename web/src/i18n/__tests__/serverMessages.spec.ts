import { describe, expect, it } from 'vitest'
import { localizeName, localizeTerm } from '../dataGlossary'
import { translateServerMessage } from '../serverMessages'

// Real messages produced by the API and the demo; each must come out in Hebrew.
const apiMessages = [
  'Invalid email or password.',
  "An employee with email 'dana@salarynet.demo' already exists.",
  "An account with email 'x@salarynet.demo' already exists.",
  "A department named 'Sales' already exists.",
  "Department 'Sales' still has employees and cannot be deleted.",
  'Payroll for Noa Cohen for 09/2026 has already been generated.',
  'Payroll cannot be generated for a future period.',
  "Payroll cannot be generated for inactive employee '0b0e'.",
  'You are already checked in. Check out before starting a new shift.',
  'You are not checked in.',
  'Only employee accounts can record attendance.',
  "Employee '1f2e' is already inactive.",
  "User 'hr@salarynet.demo' is already active.",
  'You cannot deactivate your own account. Ask another administrator.',
  'You cannot change your own role. Ask another administrator.',
  'This employee already has an account.',
  'The current password is incorrect.',
  "Employee '6c1d' was not found.",
  "'First Name' must not be empty.",
  "'Email' is not a valid email address.",
  "'Base Salary' must be greater than '0'.",
  'Password must contain an uppercase letter.',
  "The length of 'Password' must be at least 8 characters. You entered 4 characters.",
]

const hebrew = /[֐-׿]/

describe('translateServerMessage', () => {
  it.each(apiMessages)('translates "%s" to Hebrew', (message) => {
    expect(translateServerMessage(message, 'he')).toMatch(hebrew)
  })

  it('keeps English untouched in English mode and passes unknown messages through', () => {
    expect(translateServerMessage('You are not checked in.', 'en')).toBe('You are not checked in.')
    expect(translateServerMessage('Something brand new', 'he')).toBe('Something brand new')
  })

  it('translates the employee name inside a payroll conflict', () => {
    expect(translateServerMessage('Payroll for Noa Cohen for 09/2026 has already been generated.', 'he')).toContain('נועה כהן')
  })
})

describe('demo data glossary', () => {
  it('translates demo departments and names, leaves user-typed text alone', () => {
    expect(localizeTerm('Engineering', 'he')).toBe('הנדסה')
    expect(localizeName('Noa Ben-David', 'he')).toBe('נועה בן דוד')
    expect(localizeName('Smoke Tester', 'he')).toBe('Smoke Tester')
    expect(localizeTerm('Engineering', 'en')).toBe('Engineering')
  })
})
