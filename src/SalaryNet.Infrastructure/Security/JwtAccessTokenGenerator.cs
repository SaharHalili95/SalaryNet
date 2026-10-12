using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Security;

internal sealed class JwtAccessTokenGenerator(IOptions<JwtOptions> options, TimeProvider clock) : IAccessTokenGenerator
{
    private readonly JsonWebTokenHandler _handler = new();

    public AccessToken Generate(User user)
    {
        ArgumentNullException.ThrowIfNull(user);
        var jwt = options.Value;
        var now = clock.GetUtcNow().UtcDateTime;
        var expires = now.AddMinutes(jwt.ExpiryMinutes);

        var claims = new Dictionary<string, object>
        {
            [SalaryNetClaims.Subject] = user.Id.ToString(),
            [SalaryNetClaims.Email] = user.Email,
            [SalaryNetClaims.Role] = user.Role.ToString(),
        };

        if (user.EmployeeId is { } employeeId)
        {
            claims[SalaryNetClaims.EmployeeId] = employeeId.ToString();
        }

        var token = _handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            Claims = claims,
            IssuedAt = now,
            NotBefore = now,
            Expires = expires,
            SigningCredentials = new SigningCredentials(jwt.CreateSigningKey(), SecurityAlgorithms.HmacSha256),
        });

        return new AccessToken(token, expires);
    }
}
