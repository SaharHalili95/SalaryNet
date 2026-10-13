using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Users;

public sealed record UserAccountDto(
    Guid Id,
    string Email,
    string? DisplayName,
    UserRole Role,
    Guid? EmployeeId,
    string? EmployeeName,
    bool IsActive,
    bool IsLockedOut,
    DateTime? LockoutEndsAt,
    int FailedLoginCount,
    DateTime CreatedAt)
{
    public static UserAccountDto From(UserListItem item, TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(item);
        var user = item.User;
        var locked = user.IsLockedOut(clock);

        return new UserAccountDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            user.EmployeeId,
            item.EmployeeName,
            user.IsActive,
            locked,
            locked ? user.LockoutEndsAt : null,
            user.FailedLoginCount,
            user.CreatedAt);
    }
}

public sealed record CreateUserRequest(string Email, string Password, UserRole Role, Guid? EmployeeId, string? DisplayName = null);

public sealed record ChangeRoleRequest(UserRole Role, Guid? EmployeeId);

public sealed record ResetPasswordRequest(string NewPassword);
