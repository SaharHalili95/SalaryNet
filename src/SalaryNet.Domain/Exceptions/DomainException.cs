namespace SalaryNet.Domain.Exceptions;

/// <summary>Base type for every error raised by the domain model.</summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message)
        : base(message)
    {
    }
}
