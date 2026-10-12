using SalaryNet.Domain.Enums;

namespace SalaryNet.API.Security;

public static class Policies
{
    public const string Staff = nameof(Staff);
    public const string AdminOnly = nameof(AdminOnly);
    public const string EmployeeOnly = nameof(EmployeeOnly);

    public static readonly string[] StaffRoles = [nameof(UserRole.Admin), nameof(UserRole.HR)];
}
