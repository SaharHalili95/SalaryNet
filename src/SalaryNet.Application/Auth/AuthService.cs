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
    ICurrentUser currentUser) : IAuthService
{
    // Verified against when the email is unknown so both failure paths cost the same (no timing oracle).
    private readonly Lazy<string> _dummyHash = new(() => passwordHasher.Hash(Guid.NewGuid().ToString()));

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var user = await users.GetByEmailAsync(EmailNormalizer.Normalize(request.Email), cancellationToken);
        var passwordOk = passwordHasher.Verify(user?.PasswordHash ?? _dummyHash.Value, request.Password);

        if (user is null || !passwordOk)
        {
            throw new UnauthorizedException();
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

    private async Task<UserDto> ToDtoAsync(User user, CancellationToken cancellationToken)
    {
        var displayName = user.Email;
        if (user.EmployeeId is { } employeeId
            && await employees.GetByIdAsync(employeeId, cancellationToken) is { } employee)
        {
            displayName = $"{employee.FirstName} {employee.LastName}";
        }

        return new UserDto(user.Id, user.Email, displayName, user.Role, user.EmployeeId);
    }
}
