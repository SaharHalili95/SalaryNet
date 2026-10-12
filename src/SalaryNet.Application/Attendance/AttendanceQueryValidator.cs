using FluentValidation;
using SalaryNet.Application.Common;

namespace SalaryNet.Application.Attendance;

public sealed class AttendanceQueryValidator : AbstractValidator<AttendanceQuery>
{
    public AttendanceQueryValidator()
    {
        this.AddPagingRules();
        RuleFor(q => q.To)
            .GreaterThan(q => q.From)
            .When(q => q.From is not null && q.To is not null)
            .WithMessage("'To' must be later than 'From'.");
    }
}
