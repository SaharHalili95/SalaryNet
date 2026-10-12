using Microsoft.EntityFrameworkCore;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Dashboard;

namespace SalaryNet.Infrastructure.Persistence;

internal sealed class DashboardReadModel(SalaryNetDbContext db) : IDashboardReadModel
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(int trendMonths, CancellationToken cancellationToken)
    {
        var employees = db.Employees.AsNoTracking();

        var totalEmployees = await employees.CountAsync(cancellationToken);
        var activeEmployees = await employees.CountAsync(e => e.IsActive, cancellationToken);
        var departmentCount = await db.Departments.CountAsync(cancellationToken);
        var checkedIn = await db.AttendanceLogs.CountAsync(a => a.CheckOut == null, cancellationToken);
        var averageSalary = await employees
            .Where(e => e.IsActive)
            .Select(e => (decimal?)e.BaseSalary)
            .AverageAsync(cancellationToken) ?? 0m;

        var trend = await db.PayrollRecords
            .AsNoTracking()
            .GroupBy(p => new { p.Year, p.Month })
            .OrderByDescending(g => g.Key.Year)
            .ThenByDescending(g => g.Key.Month)
            .Take(trendMonths)
            .Select(g => new PayrollPeriodTotalsDto(
                g.Key.Year,
                g.Key.Month,
                g.Sum(p => p.GrossSalary),
                g.Sum(p => p.NetSalary),
                g.Sum(p => p.Deductions),
                g.Count()))
            .ToListAsync(cancellationToken);
        trend.Reverse();

        var latest = trend.Count > 0 ? trend[^1] : null;

        var byDepartment = latest is null
            ? []
            : await db.PayrollRecords
                .AsNoTracking()
                .Where(p => p.Year == latest.Year && p.Month == latest.Month)
                .GroupBy(p => p.Employee!.Department!.Name)
                .OrderByDescending(g => g.Sum(p => p.GrossSalary))
                .Select(g => new DepartmentPayrollDto(g.Key, g.Count(), g.Sum(p => p.GrossSalary), g.Sum(p => p.NetSalary)))
                .ToListAsync(cancellationToken);

        var employmentTypes = await employees
            .Where(e => e.IsActive)
            .GroupBy(e => e.EmploymentType)
            .OrderBy(g => g.Key)
            .Select(g => new EmploymentTypeCountDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        return new DashboardSummaryDto(
            totalEmployees,
            activeEmployees,
            departmentCount,
            checkedIn,
            Math.Round(averageSalary, 2),
            latest,
            byDepartment,
            employmentTypes,
            trend);
    }
}
