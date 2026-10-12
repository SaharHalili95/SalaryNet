using FluentValidation;
using SalaryNet.Application.Common;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Employees;

public sealed class SaveEmployeeRequestValidator : AbstractValidator<SaveEmployeeRequest>
{
    public const decimal MaxMonthlySalary = 1_000_000m;

    public SaveEmployeeRequestValidator()
    {
        RuleFor(r => r.FirstName).NotEmpty().MaximumLength(Employee.NameMaxLength);
        RuleFor(r => r.LastName).NotEmpty().MaximumLength(Employee.NameMaxLength);
        RuleFor(r => r.Email).NotEmpty().EmailAddress().MaximumLength(Employee.EmailMaxLength);
        RuleFor(r => r.DepartmentId).NotEmpty();
        RuleFor(r => r.BaseSalary)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaxMonthlySalary)
            .PrecisionScale(18, 2, ignoreTrailingZeros: true);
        RuleFor(r => r.EmploymentType).IsInEnum();
    }
}

public sealed class EmployeeQueryValidator : AbstractValidator<EmployeeQuery>
{
    public EmployeeQueryValidator()
    {
        this.AddPagingRules();
        RuleFor(q => q.Search).MaximumLength(100);
        RuleFor(q => q.EmploymentType).IsInEnum();
        RuleFor(q => q.SortBy).IsInEnum();
        RuleFor(q => q.SortDirection).IsInEnum();
    }
}
