using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Payroll;

public sealed record PayrollRecordDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string DepartmentName,
    int Year,
    int Month,
    decimal BaseSalary,
    decimal Bonus,
    decimal GrossSalary,
    decimal IncomeTax,
    decimal SocialSecurity,
    decimal Deductions,
    decimal NetSalary,
    DateTime GeneratedAt)
{
    public static PayrollRecordDto From(PayrollRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);
        var employee = record.Employee;

        return new PayrollRecordDto(
            record.Id,
            record.EmployeeId,
            employee is null ? string.Empty : $"{employee.FirstName} {employee.LastName}",
            employee?.Department?.Name ?? string.Empty,
            record.Year,
            record.Month,
            record.GrossSalary - record.Bonus,
            record.Bonus,
            record.GrossSalary,
            record.IncomeTax,
            record.SocialSecurity,
            record.Deductions,
            record.NetSalary,
            record.GeneratedAt);
    }
}

public sealed record GeneratePayrollRequest(Guid EmployeeId, int Year, int Month, decimal Bonus);

public sealed record GenerateMonthlyPayrollRequest(int Year, int Month);

/// <summary>Outcome of a monthly run. Employees that already had a payslip for the period are skipped, not failed.</summary>
public sealed record MonthlyPayrollResult(int Year, int Month, int Generated, int Skipped);
