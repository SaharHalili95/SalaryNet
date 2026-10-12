using SalaryNet.Domain.Common;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Domain.Entities;

/// <summary>A login account. Users in the <see cref="UserRole.Employee"/> role are bound to exactly one employee.</summary>
public sealed class User : Entity
{
    public const int EmailMaxLength = 256;
    public const int PasswordHashMaxLength = 512;

    private User(Guid id, string email, string passwordHash, UserRole role, Guid? employeeId, DateTime createdAt)
        : base(id)
    {
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        EmployeeId = employeeId;
        CreatedAt = createdAt;
    }

    private User()
    {
        Email = null!;
        PasswordHash = null!;
    }

    public string Email { get; private set; }

    public string PasswordHash { get; private set; }

    public UserRole Role { get; private set; }

    public Guid? EmployeeId { get; private set; }

    public DateTime CreatedAt { get; private init; }

    public static User Create(string email, string passwordHash, UserRole role, Guid? employeeId, TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        Guard.Defined(role, nameof(Role));

        if (role == UserRole.Employee && (employeeId is null || employeeId == Guid.Empty))
        {
            throw new DomainValidationException(nameof(EmployeeId), "An employee account must be linked to an employee.");
        }

        if (role != UserRole.Employee && employeeId is not null)
        {
            throw new DomainValidationException(nameof(EmployeeId), "Only employee accounts can be linked to an employee.");
        }

        return new User(
            Guid.NewGuid(),
            Guard.Email(email, nameof(Email), EmailMaxLength),
            Guard.RequiredText(passwordHash, nameof(PasswordHash), PasswordHashMaxLength),
            role,
            employeeId,
            clock.GetUtcNow().UtcDateTime);
    }

    public void ChangePasswordHash(string passwordHash)
    {
        PasswordHash = Guard.RequiredText(passwordHash, nameof(PasswordHash), PasswordHashMaxLength);
    }
}
