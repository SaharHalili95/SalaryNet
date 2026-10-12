namespace SalaryNet.Application.Common.Exceptions;

/// <summary>The request conflicts with existing data, e.g. a duplicate email or payroll period.</summary>
public sealed class ConflictException : Exception
{
    public ConflictException(string message)
        : base(message)
    {
    }

    public ConflictException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
