import type {
  AttendanceLog,
  AttendanceQuery,
  DashboardSummary,
  Department,
  Employee,
  EmployeeQuery,
  GeneratePayrollRequest,
  LoginResponse,
  MonthlyPayrollResult,
  PagedResult,
  PayrollQuery,
  PayrollRecord,
  SaveDepartmentRequest,
  SaveEmployeeRequest,
  User,
} from './types'

/**
 * The contract every view depends on. Two implementations exist: HttpApi talks to the .NET backend,
 * DemoApi runs the same rules in the browser so the UI can be hosted statically.
 */
export interface SalaryNetApi {
  login(email: string, password: string): Promise<LoginResponse>
  me(): Promise<User>
  dashboard(): Promise<DashboardSummary>
  employees: {
    search(query: EmployeeQuery): Promise<PagedResult<Employee>>
    get(id: string): Promise<Employee>
    mine(): Promise<Employee>
    create(request: SaveEmployeeRequest): Promise<Employee>
    update(id: string, request: SaveEmployeeRequest): Promise<Employee>
    setActive(id: string, isActive: boolean): Promise<void>
  }
  departments: {
    list(): Promise<Department[]>
    create(request: SaveDepartmentRequest): Promise<Department>
    update(id: string, request: SaveDepartmentRequest): Promise<Department>
    remove(id: string): Promise<void>
  }
  payroll: {
    search(query: PayrollQuery): Promise<PagedResult<PayrollRecord>>
    get(id: string): Promise<PayrollRecord>
    generate(request: GeneratePayrollRequest): Promise<PayrollRecord>
    runMonth(year: number, month: number): Promise<MonthlyPayrollResult>
  }
  attendance: {
    search(query: AttendanceQuery): Promise<PagedResult<AttendanceLog>>
    current(): Promise<AttendanceLog | null>
    checkIn(): Promise<AttendanceLog>
    checkOut(): Promise<AttendanceLog>
  }
}

export type TokenProvider = () => string | null
