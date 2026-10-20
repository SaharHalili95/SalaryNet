import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { SalaryNetApi } from '@shared/api/client';
import type {
  AttendanceLog, AttendanceQuery, CreateUserRequest, DashboardSummary, Department, Employee, EmployeeQuery,
  GeneratePayrollRequest, LoginResponse, MonthlyPayrollResult, PagedResult, PayrollQuery, PayrollRecord,
  SaveDepartmentRequest, SaveEmployeeRequest, User, UserAccount, UserQuery, UserRole,
} from '@shared/api/types';
import { firstValueFrom, type Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type Query = object;

/**
 * The shared SalaryNetApi contract on Angular's HttpClient, so requests go through the interceptors
 * (JWT and ProblemDetails). Endpoints and query rules match shared/api/httpApi.ts used by the Vue app.
 */
@Injectable({ providedIn: 'root' })
export class HttpSalaryNetApi implements SalaryNetApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  private params(query?: Query): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return params;
  }

  private run<T>(request: Observable<T>): Promise<T> {
    return firstValueFrom(request);
  }

  private get<T>(path: string, query?: Query) {
    return this.run(this.http.get<T>(this.base + path, { params: this.params(query) }));
  }

  private post<T>(path: string, body: unknown = {}) {
    return this.run(this.http.post<T>(this.base + path, body));
  }

  private put<T>(path: string, body: unknown) {
    return this.run(this.http.put<T>(this.base + path, body));
  }

  login = (email: string, password: string) => this.post<LoginResponse>('/auth/login', { email, password });
  me = () => this.get<User>('/auth/me');
  changePassword = (currentPassword: string, newPassword: string) =>
    this.post<void>('/auth/change-password', { currentPassword, newPassword });
  dashboard = () => this.get<DashboardSummary>('/dashboard/summary');

  employees = {
    search: (q: EmployeeQuery) => this.get<PagedResult<Employee>>('/employees', q),
    get: (id: string) => this.get<Employee>(`/employees/${id}`),
    mine: () => this.get<Employee>('/employees/me'),
    create: (r: SaveEmployeeRequest) => this.post<Employee>('/employees', r),
    update: (id: string, r: SaveEmployeeRequest) => this.put<Employee>(`/employees/${id}`, r),
    setActive: (id: string, isActive: boolean) =>
      this.post<void>(`/employees/${id}/${isActive ? 'activate' : 'deactivate'}`),
  };

  departments = {
    list: () => this.get<Department[]>('/departments'),
    create: (r: SaveDepartmentRequest) => this.post<Department>('/departments', r),
    update: (id: string, r: SaveDepartmentRequest) => this.put<Department>(`/departments/${id}`, r),
    remove: (id: string) => this.run(this.http.delete<void>(`${this.base}/departments/${id}`)),
  };

  payroll = {
    search: (q: PayrollQuery) => this.get<PagedResult<PayrollRecord>>('/payroll', q),
    get: (id: string) => this.get<PayrollRecord>(`/payroll/${id}`),
    generate: (r: GeneratePayrollRequest) => this.post<PayrollRecord>('/payroll', r),
    runMonth: (year: number, month: number) => this.post<MonthlyPayrollResult>('/payroll/run', { year, month }),
  };

  users = {
    search: (q: UserQuery) => this.get<PagedResult<UserAccount>>('/users', q),
    create: (r: CreateUserRequest) => this.post<UserAccount>('/users', r),
    changeRole: (id: string, role: UserRole, employeeId: string | null) =>
      this.put<UserAccount>(`/users/${id}/role`, { role, employeeId }),
    setActive: (id: string, isActive: boolean) =>
      this.post<UserAccount>(`/users/${id}/${isActive ? 'activate' : 'deactivate'}`),
    unlock: (id: string) => this.post<UserAccount>(`/users/${id}/unlock`),
    resetPassword: (id: string, newPassword: string) =>
      this.post<UserAccount>(`/users/${id}/reset-password`, { newPassword }),
  };

  attendance = {
    search: (q: AttendanceQuery) => this.get<PagedResult<AttendanceLog>>('/attendance', q),
    current: async () => (await this.get<AttendanceLog | null>('/attendance/current')) ?? null,
    checkIn: () => this.post<AttendanceLog>('/attendance/check-in'),
    checkOut: () => this.post<AttendanceLog>('/attendance/check-out'),
  };
}
