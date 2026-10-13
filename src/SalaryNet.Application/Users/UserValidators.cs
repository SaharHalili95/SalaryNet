using FluentValidation;
using SalaryNet.Application.Common;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Users;

public sealed class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(r => r.Email).NotEmpty().EmailAddress().MaximumLength(User.EmailMaxLength);
        RuleFor(r => r.Password).MeetsPasswordPolicy();
        RuleFor(r => r.Role).IsInEnum();
        RuleFor(r => r.EmployeeId).NotEmpty().When(r => r.Role == UserRole.Employee)
            .WithMessage("Choose the employee this account belongs to.");
        RuleFor(r => r.EmployeeId).Null().When(r => r.Role != UserRole.Employee)
            .WithMessage("Only employee accounts can be linked to an employee.");
        RuleFor(r => r.DisplayName).NotEmpty().When(r => r.Role != UserRole.Employee)
            .WithMessage("Enter the name of the person who uses this account.");
        RuleFor(r => r.DisplayName).MaximumLength(User.DisplayNameMaxLength);
    }
}

public sealed class ChangeRoleRequestValidator : AbstractValidator<ChangeRoleRequest>
{
    public ChangeRoleRequestValidator()
    {
        RuleFor(r => r.Role).IsInEnum();
        RuleFor(r => r.EmployeeId).NotEmpty().When(r => r.Role == UserRole.Employee)
            .WithMessage("Choose the employee this account belongs to.");
        RuleFor(r => r.EmployeeId).Null().When(r => r.Role != UserRole.Employee)
            .WithMessage("Only employee accounts can be linked to an employee.");
    }
}

public sealed class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(r => r.NewPassword).MeetsPasswordPolicy();
    }
}

public sealed class UserQueryValidator : AbstractValidator<UserQuery>
{
    public UserQueryValidator()
    {
        this.AddPagingRules();
        RuleFor(q => q.Search).MaximumLength(100);
        RuleFor(q => q.Role).IsInEnum();
    }
}
