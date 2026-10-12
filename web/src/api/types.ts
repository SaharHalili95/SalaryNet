export type UserRole = 'Admin' | 'HR' | 'Employee'
export type EmploymentType = 'FullTime' | 'PartTime' | 'Contractor'
export type SortDirection = 'Asc' | 'Desc'
export type EmployeeSortField = 'LastName' | 'BaseSalary' | 'CreatedAt'

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface PageQuery {
  page?: number
  pageSize?: number
}

export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  employeeId: string | null
}

export interface LoginResponse {
  accessToken: string
  expiresAt: string
  user: User
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  departmentId: string
  departmentName: string
  baseSalary: number
  employmentType: EmploymentType
  isActive: boolean
  createdAt: string
}

export interface EmployeeQuery extends PageQuery {
  search?: string
  departmentId?: string
  employmentType?: EmploymentType
  isActive?: boolean
  sortBy?: EmployeeSortField
  sortDirection?: SortDirection
}

export interface SaveEmployeeRequest {
  firstName: string
  lastName: string
  email: string
  departmentId: string
  baseSalary: number
  employmentType: EmploymentType
}

export interface Department {
  id: string
  name: string
  description: string
  employeeCount: number
  activeEmployeeCount: number
  createdAt: string
}

export interface SaveDepartmentRequest {
  name: string
  description?: string
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  departmentName: string
  year: number
  month: number
  baseSalary: number
  bonus: number
  grossSalary: number
  incomeTax: number
  socialSecurity: number
  deductions: number
  netSalary: number
  generatedAt: string
}

export interface PayrollQuery extends PageQuery {
  employeeId?: string
  departmentId?: string
  year?: number
  month?: number
}

export interface GeneratePayrollRequest {
  employeeId: string
  year: number
  month: number
  bonus: number
}

export interface MonthlyPayrollResult {
  year: number
  month: number
  generated: number
  skipped: number
}

export interface AttendanceLog {
  id: string
  employeeId: string
  employeeName: string
  checkIn: string
  checkOut: string | null
  totalHours: number
  isOpen: boolean
}

export interface AttendanceQuery extends PageQuery {
  employeeId?: string
  from?: string
  to?: string
}

export interface PayrollPeriodTotals {
  year: number
  month: number
  grossTotal: number
  netTotal: number
  deductionsTotal: number
  payslips: number
}

export interface DashboardSummary {
  totalEmployees: number
  activeEmployees: number
  departmentCount: number
  currentlyCheckedIn: number
  averageBaseSalary: number
  latestPeriod: PayrollPeriodTotals | null
  payrollByDepartment: { departmentName: string; headcount: number; grossTotal: number; netTotal: number }[]
  employmentTypes: { employmentType: EmploymentType; count: number }[]
  monthlyTrend: PayrollPeriodTotals[]
}
