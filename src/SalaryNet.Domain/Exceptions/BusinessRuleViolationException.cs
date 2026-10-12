namespace SalaryNet.Domain.Exceptions;

/// <summary>An operation is not allowed in the entity's current state (e.g. checking out twice).</summary>
public sealed class BusinessRuleViolationException : DomainException
{
    public BusinessRuleViolationException(string message)
        : base(message)
    {
    }
}
