using FluentValidation;
using SalaryNet.Application.Users;

namespace SalaryNet.Application.Auth;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(r => r.Email).NotEmpty().EmailAddress();
        RuleFor(r => r.Password).NotEmpty().MaximumLength(128);
    }
}

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(r => r.CurrentPassword).NotEmpty();
        RuleFor(r => r.NewPassword).MeetsPasswordPolicy();
        RuleFor(r => r.NewPassword).NotEqual(r => r.CurrentPassword)
            .WithMessage("The new password must be different from the current one.");
    }
}
