namespace SalaryNet.Application.Common.Exceptions;

/// <summary>Authentication failed. The message is deliberately generic to avoid account enumeration.</summary>
public sealed class UnauthorizedException : Exception
{
    public UnauthorizedException()
        : base("Invalid email or password.")
    {
    }
}
