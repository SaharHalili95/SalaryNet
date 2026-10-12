namespace SalaryNet.Domain.Exceptions;

/// <summary>An input value violates an entity invariant (e.g. an empty name or a negative salary).</summary>
public sealed class DomainValidationException : DomainException
{
    public DomainValidationException(string propertyName, string message)
        : base(message)
    {
        PropertyName = propertyName;
    }

    public string PropertyName { get; }
}
