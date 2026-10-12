using FluentValidation;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Departments;

public sealed class SaveDepartmentRequestValidator : AbstractValidator<SaveDepartmentRequest>
{
    public SaveDepartmentRequestValidator()
    {
        RuleFor(r => r.Name).NotEmpty().MaximumLength(Department.NameMaxLength);
        RuleFor(r => r.Description).MaximumLength(Department.DescriptionMaxLength);
    }
}
