using FluentValidation;
using FluentValidation.Results;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Domain.Common;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Auth;

internal sealed class AuthService(
    IUserRepository users,
    IEmployeeRepository employees,
    IPasswordHasher passwordHasher,
    IAccessTokenGenerator tokenGenerator,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    TimeProvider clock) : IAuthService
{
    // Verified against when the email is unknown so both failure paths cost the same (no timing oracle).
    private readonly Lazy<string> _dummyHash = new(() => passwordHasher.Hash(Guid.NewGuid().ToString()));

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var user = await users.GetByEmailAsync(EmailNormalizer.Normalize(request.Email), cancellationToken);
        var passwordOk = passwordHasher.Verify(user?.PasswordHash ?? _dummyHash.Value, request.Password);

        // Unknown, inactive and locked accounts all get the same generic 401 so the response
        // never reveals which accounts exist or what state they are in.
        if (user is null || !user.IsActive || user.IsLockedOut(clock))
        {
            throw new UnauthorizedException();
        }

        if (!passwordOk)
        {
            user.RegisterFailedLogin(clock);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException();
        }

        if (user.FailedLoginCount > 0)
        {
            user.RegisterSuccessfulLogin();
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var token = tokenGenerator.Generate(user);
        return new LoginResponse(token.Token, token.ExpiresAt, await ToDtoAsync(user, cancellationToken));
    }

    public async Task<UserDto> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var user = await users.GetByIdAsync(currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), currentUser.UserId);

        return await ToDtoAsync(user, cancellationToken);
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var user = await users.GetByIdAsync(currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), currentUser.UserId);

        if (!passwordHasher.Verify(user.PasswordHash, request.CurrentPassword))
        {
            throw new ValidationException(
                [new ValidationFailure(nameof(ChangePasswordRequest.CurrentPassword), "The current password is incorrect.")]);
        }

        user.ChangePasswordHash(passwordHasher.Hash(request.NewPassword));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<UserDto> ToDtoAsync(User user, CancellationToken cancellationToken)
    {
        var displayName = user.DisplayName ?? user.Email;
        if (user.EmployeeId is { } employeeId
            && await employees.GetByIdAsync(employeeId, cancellationToken) is { } employee)
        {
            displayName = $"{employee.FirstName} {employee.LastName}";
        }

        return new UserDto(user.Id, user.Email, displayName, user.Role, user.EmployeeId);
    }
}
