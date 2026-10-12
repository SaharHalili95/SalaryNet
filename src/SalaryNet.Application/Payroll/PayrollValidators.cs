using FluentValidation;
using SalaryNet.Application.Common;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Payroll;

public sealed class GeneratePayrollRequestValidator : AbstractValidator<GeneratePayrollRequest>
{
    public GeneratePayrollRequestValidator()
    {
        RuleFor(r => r.EmployeeId).NotEmpty();
        RuleFor(r => r.Year).InclusiveBetween(PayrollRecord.MinYear, PayrollRecord.MaxYear);
        RuleFor(r => r.Month).InclusiveBetween(1, 12);
        RuleFor(r => r.Bonus).GreaterThanOrEqualTo(0).PrecisionScale(18, 2, ignoreTrailingZeros: true);
    }
}

public sealed class GenerateMonthlyPayrollRequestValidator : AbstractValidator<GenerateMonthlyPayrollRequest>
{
    public GenerateMonthlyPayrollRequestValidator()
    {
        RuleFor(r => r.Year).InclusiveBetween(PayrollRecord.MinYear, PayrollRecord.MaxYear);
        RuleFor(r => r.Month).InclusiveBetween(1, 12);
    }
}

public sealed class PayrollQueryValidator : AbstractValidator<PayrollQuery>
{
    public PayrollQueryValidator()
    {
        this.AddPagingRules();
        RuleFor(q => q.Year).InclusiveBetween(PayrollRecord.MinYear, PayrollRecord.MaxYear);
        RuleFor(q => q.Month).InclusiveBetween(1, 12);
    }
}
