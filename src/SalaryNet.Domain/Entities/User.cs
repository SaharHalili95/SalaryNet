using SalaryNet.Domain.Common;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Domain.Entities;

/// <summary>A login account. Users in the <see cref="UserRole.Employee"/> role are bound to exactly one employee.</summary>
public sealed class User : Entity
{
    public const int EmailMaxLength = 256;
    public const int PasswordHashMaxLength = 512;
    public const int DisplayNameMaxLength = 100;
    public const int MaxFailedLogins = 5;

    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private User(Guid id, string email, string passwordHash, UserRole role, Guid? employeeId, string? displayName, DateTime createdAt)
        : base(id)
    {
        Email = email;
        DisplayName = displayName;
        PasswordHash = passwordHash;
        Role = role;
        EmployeeId = employeeId;
        IsActive = true;
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

    /// <summary>Name shown for staff accounts; employee accounts use the linked employee's name instead.</summary>
    public string? DisplayName { get; private set; }

    public Guid? EmployeeId { get; private set; }

    /// <summary>Inactive accounts cannot sign in. Deactivation keeps the account for audit history.</summary>
    public bool IsActive { get; private set; }

    /// <summary>Consecutive failed sign-ins since the last success, lockout or unlock.</summary>
    public int FailedLoginCount { get; private set; }

    public DateTime? LockoutEndsAt { get; private set; }

    public DateTime CreatedAt { get; private init; }

    public static User Create(
        string email,
        string passwordHash,
        UserRole role,
        Guid? employeeId,
        TimeProvider clock,
        string? displayName = null)
    {
        ArgumentNullException.ThrowIfNull(clock);
        ValidateRoleLink(role, employeeId);

        return new User(
            Guid.NewGuid(),
            Guard.Email(email, nameof(Email), EmailMaxLength),
            Guard.RequiredText(passwordHash, nameof(PasswordHash), PasswordHashMaxLength),
            role,
            employeeId,
            NormalizeDisplayName(displayName),
            clock.GetUtcNow().UtcDateTime);
    }

    public bool IsLockedOut(TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        return LockoutEndsAt > clock.GetUtcNow().UtcDateTime;
    }

    /// <summary>Counts a wrong password; the <see cref="MaxFailedLogins"/>th in a row locks the account.</summary>
    public void RegisterFailedLogin(TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        // Attempts during a lockout must not extend it, or an attacker could keep a victim locked out forever.
        if (IsLockedOut(clock))
        {
            return;
        }

        FailedLoginCount++;
        if (FailedLoginCount >= MaxFailedLogins)
        {
            LockoutEndsAt = clock.GetUtcNow().UtcDateTime.Add(LockoutDuration);
            FailedLoginCount = 0;
        }
    }

    public void RegisterSuccessfulLogin() => ClearLockout();

    public void Unlock() => ClearLockout();

    public void ChangePasswordHash(string passwordHash)
    {
        PasswordHash = Guard.RequiredText(passwordHash, nameof(PasswordHash), PasswordHashMaxLength);
    }

    /// <summary>An administrator-issued password also releases any lockout, so the user can sign in with it.</summary>
    public void ResetPasswordHash(string passwordHash)
    {
        ChangePasswordHash(passwordHash);
        ClearLockout();
    }

    public void ChangeRole(UserRole role, Guid? employeeId)
    {
        ValidateRoleLink(role, employeeId);
        Role = role;
        EmployeeId = employeeId;
    }

    public void Deactivate()
    {
        if (!IsActive)
        {
            throw new BusinessRuleViolationException($"User '{Email}' is already inactive.");
        }

        IsActive = false;
    }

    public void Activate()
    {
        if (IsActive)
        {
            throw new BusinessRuleViolationException($"User '{Email}' is already active.");
        }

        IsActive = true;
    }

    private static string? NormalizeDisplayName(string? displayName)
    {
        var name = Guard.OptionalText(displayName, nameof(DisplayName), DisplayNameMaxLength);
        return name.Length == 0 ? null : name;
    }

    private void ClearLockout()
    {
        FailedLoginCount = 0;
        LockoutEndsAt = null;
    }

    private static void ValidateRoleLink(UserRole role, Guid? employeeId)
    {
        Guard.Defined(role, nameof(Role));

        if (role == UserRole.Employee && (employeeId is null || employeeId == Guid.Empty))
        {
            throw new DomainValidationException(nameof(EmployeeId), "An employee account must be linked to an employee.");
        }

        if (role != UserRole.Employee && employeeId is not null)
        {
            throw new DomainValidationException(nameof(EmployeeId), "Only employee accounts can be linked to an employee.");
        }
    }
}
