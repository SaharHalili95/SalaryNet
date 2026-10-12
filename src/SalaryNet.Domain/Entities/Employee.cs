using SalaryNet.Domain.Common;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Domain.Entities;

public sealed class Employee : Entity
{
    public const int NameMaxLength = 100;
    public const int EmailMaxLength = 256;

    private Employee(
        Guid id,
        string firstName,
        string lastName,
        string email,
        Guid departmentId,
        decimal baseSalary,
        EmploymentType employmentType,
        DateTime createdAt)
        : base(id)
    {
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        DepartmentId = departmentId;
        BaseSalary = baseSalary;
        EmploymentType = employmentType;
        IsActive = true;
        CreatedAt = createdAt;
    }

    private Employee()
    {
        FirstName = null!;
        LastName = null!;
        Email = null!;
    }

    public string FirstName { get; private set; }

    public string LastName { get; private set; }

    /// <summary>Stored trimmed and lower-cased so the unique index is effectively case-insensitive.</summary>
    public string Email { get; private set; }

    public Guid DepartmentId { get; private set; }

    public Department? Department { get; private set; }

    /// <summary>Agreed gross monthly salary, before bonuses and deductions.</summary>
    public decimal BaseSalary { get; private set; }

    public EmploymentType EmploymentType { get; private set; }

    public bool IsActive { get; private set; }

    public DateTime CreatedAt { get; private init; }

    public static Employee Create(
        string firstName,
        string lastName,
        string email,
        Guid departmentId,
        decimal baseSalary,
        EmploymentType employmentType,
        TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        Guard.NotEmpty(departmentId, nameof(DepartmentId));
        Guard.Positive(baseSalary, nameof(BaseSalary));
        Guard.Defined(employmentType, nameof(EmploymentType));

        return new Employee(
            Guid.NewGuid(),
            Guard.RequiredText(firstName, nameof(FirstName), NameMaxLength),
            Guard.RequiredText(lastName, nameof(LastName), NameMaxLength),
            Guard.Email(email, nameof(Email), EmailMaxLength),
            departmentId,
            baseSalary,
            employmentType,
            clock.GetUtcNow().UtcDateTime);
    }

    public void UpdatePersonalDetails(string firstName, string lastName, string email)
    {
        FirstName = Guard.RequiredText(firstName, nameof(FirstName), NameMaxLength);
        LastName = Guard.RequiredText(lastName, nameof(LastName), NameMaxLength);
        Email = Guard.Email(email, nameof(Email), EmailMaxLength);
    }

    public void ChangeEmploymentTerms(decimal baseSalary, EmploymentType employmentType)
    {
        Guard.Positive(baseSalary, nameof(BaseSalary));
        Guard.Defined(employmentType, nameof(EmploymentType));
        BaseSalary = baseSalary;
        EmploymentType = employmentType;
    }

    public void TransferTo(Guid departmentId)
    {
        Guard.NotEmpty(departmentId, nameof(DepartmentId));
        DepartmentId = departmentId;
    }

    public void Deactivate()
    {
        if (!IsActive)
        {
            throw new BusinessRuleViolationException($"Employee '{Id}' is already inactive.");
        }

        IsActive = false;
    }

    public void Activate()
    {
        if (IsActive)
        {
            throw new BusinessRuleViolationException($"Employee '{Id}' is already active.");
        }

        IsActive = true;
    }
}
