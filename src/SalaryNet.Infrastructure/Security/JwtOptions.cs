using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace SalaryNet.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>HMAC-SHA256 requires a key of at least 256 bits.</summary>
    public const int MinSigningKeyLength = 32;

    public string Issuer { get; init; } = "SalaryNet";

    public string Audience { get; init; } = "SalaryNet";

    public string SigningKey { get; init; } = string.Empty;

    public int ExpiryMinutes { get; init; } = 60;

    public SymmetricSecurityKey CreateSigningKey() => new(Encoding.UTF8.GetBytes(SigningKey));
}
