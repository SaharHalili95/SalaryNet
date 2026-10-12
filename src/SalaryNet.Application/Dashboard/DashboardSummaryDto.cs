using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Dashboard;

public sealed record DashboardSummaryDto(
    int TotalEmployees,
    int ActiveEmployees,
    int DepartmentCount,
    int CurrentlyCheckedIn,
    decimal AverageBaseSalary,
    PayrollPeriodTotalsDto? LatestPeriod,
    IReadOnlyList<DepartmentPayrollDto> PayrollByDepartment,
    IReadOnlyList<EmploymentTypeCountDto> EmploymentTypes,
    IReadOnlyList<PayrollPeriodTotalsDto> MonthlyTrend);

public sealed record PayrollPeriodTotalsDto(int Year, int Month, decimal GrossTotal, decimal NetTotal, decimal DeductionsTotal, int Payslips);

/// <summary>Totals for the latest payroll period, grouped by the employee's current department.</summary>
public sealed record DepartmentPayrollDto(string DepartmentName, int Headcount, decimal GrossTotal, decimal NetTotal);

public sealed record EmploymentTypeCountDto(EmploymentType EmploymentType, int Count);
