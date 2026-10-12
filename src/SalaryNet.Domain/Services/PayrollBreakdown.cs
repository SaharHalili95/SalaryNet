namespace SalaryNet.Domain.Services;

/// <summary>Result of a payroll calculation. All amounts are rounded to two decimal places.</summary>
public sealed record PayrollBreakdown(
    decimal BaseSalary,
    decimal Bonus,
    decimal GrossSalary,
    decimal IncomeTax,
    decimal SocialSecurity)
{
    public decimal TotalDeductions => IncomeTax + SocialSecurity;

    public decimal NetSalary => GrossSalary - TotalDeductions;
}
