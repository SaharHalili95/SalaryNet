namespace SalaryNet.Domain.Common;

public abstract class Entity
{
    protected Entity(Guid id)
    {
        Guard.NotEmpty(id, nameof(id));
        Id = id;
    }

    // Required by EF Core for materialization.
    protected Entity()
    {
    }

    public Guid Id { get; private init; }
}
