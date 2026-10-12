using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Tests.Unit.Application;

internal sealed class FakeCurrentUser(UserRole role, Guid? employeeId = null) : ICurrentUser
{
    public Guid UserId { get; } = Guid.NewGuid();

    public UserRole Role { get; } = role;

    public Guid? EmployeeId { get; } = employeeId;

    public static FakeCurrentUser Hr() => new(UserRole.HR);

    public static FakeCurrentUser EmployeeAccount(Guid employeeId) => new(UserRole.Employee, employeeId);
}
