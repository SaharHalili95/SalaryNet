using SalaryNet.Domain.Common;
using SalaryNet.Domain.Exceptions;
using SalaryNet.Domain.Services;

namespace SalaryNet.Domain.Entities;

/// <summary>An immutable payslip for one employee and one calendar month.</summary>
/// <remarks>
/// Uniqueness per (EmployeeId, Year, Month) is enforced by a database index, since it spans the whole table.
/// </remarks>
public sealed class PayrollRecord : Entity
{
    public const int MinYear = 2000;
    public const int MaxYear = 2100;

    private PayrollRecord(
        Guid id,
        Guid employeeId,
        int year,
        int month,
        PayrollBreakdown breakdown,
        DateTime generatedAt)
        : base(id)
    {
        EmployeeId = employeeId;
        Year = year;
        Month = month;
        GrossSalary = breakdown.GrossSalary;
        Bonus = breakdown.Bonus;
        Deductions = breakdown.TotalDeductions;
        NetSalary = breakdown.NetSalary;
        GeneratedAt = generatedAt;
    }

    private PayrollRecord()
    {
    }

    public Guid EmployeeId { get; private init; }

    public int Year { get; private init; }

    public int Month { get; private init; }

    /// <summary>Base salary plus <see cref="Bonus"/>.</summary>
    public decimal GrossSalary { get; private init; }

    public decimal Bonus { get; private init; }

    public decimal Deductions { get; private init; }

    public decimal NetSalary { get; private init; }

    public DateTime GeneratedAt { get; private init; }

    public static PayrollRecord Generate(
        Employee employee,
        int year,
        int month,
        decimal bonus,
        IPayrollCalculator calculator,
        TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(employee);
        ArgumentNullException.ThrowIfNull(calculator);
        ArgumentNullException.ThrowIfNull(clock);

        if (year is < MinYear or > MaxYear)
        {
            throw new DomainValidationException(nameof(Year), $"Year must be between {MinYear} and {MaxYear}.");
        }

        if (month is < 1 or > 12)
        {
            throw new DomainValidationException(nameof(Month), "Month must be between 1 and 12.");
        }

        var now = clock.GetUtcNow().UtcDateTime;
        if (new DateOnly(year, month, 1) > new DateOnly(now.Year, now.Month, 1))
        {
            throw new BusinessRuleViolationException("Payroll cannot be generated for a future period.");
        }

        if (!employee.IsActive)
        {
            throw new BusinessRuleViolationException($"Payroll cannot be generated for inactive employee '{employee.Id}'.");
        }

        var breakdown = calculator.Calculate(employee.EmploymentType, employee.BaseSalary, bonus);

        return new PayrollRecord(Guid.NewGuid(), employee.Id, year, month, breakdown, now);
    }
}
