using SalaryNet.Domain.Common;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Domain.Services;

/// <summary>
/// Simplified, illustrative monthly payroll calculation loosely modeled on the Israeli system.
/// The rates and thresholds are NOT the official figures and must not be used for real payroll.
/// </summary>
/// <remarks>
/// <para>Gross salary = base salary + bonus.</para>
/// <para>
/// Income tax is progressive: each bracket's rate applies only to the portion of gross salary inside that bracket.
/// </para>
/// <list type="table">
///   <listheader><term>Monthly gross (ILS)</term><description>Rate</description></listheader>
///   <item><term>0 - 7,010</term><description>10%</description></item>
///   <item><term>7,010 - 10,060</term><description>14%</description></item>
///   <item><term>10,060 - 16,150</term><description>20%</description></item>
///   <item><term>16,150 - 22,440</term><description>31%</description></item>
///   <item><term>22,440 - 46,690</term><description>35%</description></item>
///   <item><term>above 46,690</term><description>47%</description></item>
/// </list>
/// <para>
/// Social security is 3.5% up to 7,500 and 12% from 7,500 up to a 50,000 ceiling; income above the ceiling is exempt.
/// </para>
/// <para>
/// Contractors invoice the company and handle their own tax, so nothing is withheld for them.
/// Every component is rounded to two decimals (midpoint away from zero) and net is derived from the rounded values,
/// so gross - deductions = net always holds exactly.
/// </para>
/// </remarks>
public sealed class PayrollCalculator : IPayrollCalculator
{
    private static readonly Bracket[] IncomeTaxBrackets =
    [
        new(7_010m, 0.10m),
        new(10_060m, 0.14m),
        new(16_150m, 0.20m),
        new(22_440m, 0.31m),
        new(46_690m, 0.35m),
        new(decimal.MaxValue, 0.47m),
    ];

    private static readonly Bracket[] SocialSecurityBrackets =
    [
        new(7_500m, 0.035m),
        new(50_000m, 0.12m),
    ];

    public PayrollBreakdown Calculate(EmploymentType employmentType, decimal baseSalary, decimal bonus)
    {
        Guard.Defined(employmentType, nameof(employmentType));
        Guard.Positive(baseSalary, nameof(baseSalary));
        Guard.NotNegative(bonus, nameof(bonus));

        var gross = Round(baseSalary + bonus);

        if (employmentType == EmploymentType.Contractor)
        {
            return new PayrollBreakdown(baseSalary, bonus, gross, IncomeTax: 0m, SocialSecurity: 0m);
        }

        return new PayrollBreakdown(
            baseSalary,
            bonus,
            gross,
            Round(ApplyBrackets(gross, IncomeTaxBrackets)),
            Round(ApplyBrackets(gross, SocialSecurityBrackets)));
    }

    private static decimal ApplyBrackets(decimal income, Bracket[] brackets)
    {
        var total = 0m;
        var lowerBound = 0m;

        foreach (var bracket in brackets)
        {
            if (income <= lowerBound)
            {
                break;
            }

            var taxableInBracket = Math.Min(income, bracket.UpperBound) - lowerBound;
            total += taxableInBracket * bracket.Rate;
            lowerBound = bracket.UpperBound;
        }

        return total;
    }

    private static decimal Round(decimal amount) => Math.Round(amount, 2, MidpointRounding.AwayFromZero);

    private readonly record struct Bracket(decimal UpperBound, decimal Rate);
}
