using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Abstractions.Security;

/// <summary>The authenticated caller, resolved from the validated access token.</summary>
public interface ICurrentUser
{
    Guid UserId { get; }

    UserRole Role { get; }

    /// <summary>Set only for <see cref="UserRole.Employee"/> accounts.</summary>
    Guid? EmployeeId { get; }

    bool IsStaff => Role is UserRole.Admin or UserRole.HR;
}
