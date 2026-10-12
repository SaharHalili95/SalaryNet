using SalaryNet.Domain.Common;

namespace SalaryNet.Domain.Entities;

public sealed class Department : Entity
{
    public const int NameMaxLength = 100;
    public const int DescriptionMaxLength = 500;

    private readonly List<Employee> _employees = [];

    private Department(Guid id, string name, string description, DateTime createdAt)
        : base(id)
    {
        Name = name;
        Description = description;
        CreatedAt = createdAt;
    }

    private Department()
    {
        Name = null!;
        Description = null!;
    }

    public string Name { get; private set; }

    public string Description { get; private set; }

    public DateTime CreatedAt { get; private init; }

    public IReadOnlyCollection<Employee> Employees => _employees.AsReadOnly();

    public static Department Create(string name, string? description, TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        return new Department(
            Guid.NewGuid(),
            Guard.RequiredText(name, nameof(Name), NameMaxLength),
            Guard.OptionalText(description, nameof(Description), DescriptionMaxLength),
            clock.GetUtcNow().UtcDateTime);
    }

    public void Update(string name, string? description)
    {
        Name = Guard.RequiredText(name, nameof(Name), NameMaxLength);
        Description = Guard.OptionalText(description, nameof(Description), DescriptionMaxLength);
    }
}
