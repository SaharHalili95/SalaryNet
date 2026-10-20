import type { DashboardSummary, Employee, PayrollRecord } from '@shared/api/types';
import type { ChartFactory } from './chart-canvas';

/** A chart factory that records what would be drawn, since jsdom has no canvas. */
export function fakeCharts() {
  const created: { config: unknown; destroyed: boolean }[] = [];
  const factory: ChartFactory = (_canvas, config) => {
    const chart = { config, destroyed: false };
    created.push(chart);
    return { destroy: () => (chart.destroyed = true) };
  };
  return { created, factory };
}

export const summary: DashboardSummary = {
  totalEmployees: 40,
  activeEmployees: 38,
  departmentCount: 6,
  currentlyCheckedIn: 7,
  averageBaseSalary: 18000,
  latestPeriod: { year: 2026, month: 9, grossTotal: 720000, netTotal: 520000, deductionsTotal: 200000, payslips: 38 },
  payrollByDepartment: [{ departmentName: 'Engineering', headcount: 12, grossTotal: 300000, netTotal: 210000 }],
  employmentTypes: [{ employmentType: 'FullTime', count: 30 }],
  monthlyTrend: [{ year: 2026, month: 9, grossTotal: 720000, netTotal: 520000, deductionsTotal: 200000, payslips: 38 }],
};

export const noa: Employee = {
  id: 'e1', firstName: 'Noa', lastName: 'Cohen', email: 'noa.cohen@salarynet.demo', departmentId: 'd1',
  departmentName: 'Engineering', baseSalary: 28900, employmentType: 'FullTime', isActive: true, createdAt: '2024-03-01T00:00:00Z',
};

export const payslip: PayrollRecord = {
  id: 'p1', employeeId: 'e1', employeeName: 'Noa Cohen', departmentName: 'Engineering', year: 2026, month: 9,
  baseSalary: 28900, bonus: 3000, grossSalary: 31900, incomeTax: 7606.9, socialSecurity: 3190.5, deductions: 10797.4,
  netSalary: 21102.6, generatedAt: '2026-10-01T00:00:00Z',
};

export const page = <T>(items: T[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1 });
