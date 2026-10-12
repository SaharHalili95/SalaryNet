using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Domain.Enums;
using SalaryNet.Infrastructure.Security;

namespace SalaryNet.API.Security;

/// <summary>Reads the caller's identity from the validated JWT. Only used on endpoints that require authentication.</summary>
internal sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid UserId => Guid.Parse(Claim(SalaryNetClaims.Subject)
        ?? throw new InvalidOperationException("Access token has no subject claim."));

    public UserRole Role => Enum.Parse<UserRole>(Claim(SalaryNetClaims.Role)
        ?? throw new InvalidOperationException("Access token has no role claim."));

    public Guid? EmployeeId => Claim(SalaryNetClaims.EmployeeId) is { } value ? Guid.Parse(value) : null;

    private string? Claim(string type) => accessor.HttpContext?.User.FindFirst(type)?.Value;
}
