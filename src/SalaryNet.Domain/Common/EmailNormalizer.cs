namespace SalaryNet.Domain.Common;

public static class EmailNormalizer
{
    /// <summary>The canonical form entities store, so lookups and unique checks must use it too.</summary>
    public static string Normalize(string email)
    {
        ArgumentNullException.ThrowIfNull(email);
        return email.Trim().ToLowerInvariant();
    }
}
