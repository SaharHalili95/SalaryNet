using Microsoft.AspNetCore.Identity;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Security;

/// <summary>Adapts ASP.NET Core Identity's PBKDF2 hasher (salted, versioned, iteration count upgradable).</summary>
internal sealed class IdentityPasswordHasher : Application.Abstractions.Security.IPasswordHasher
{
    private readonly PasswordHasher<User> _inner = new();

    public string Hash(string password) => _inner.HashPassword(null!, password);

    public bool Verify(string hashedPassword, string providedPassword) =>
        _inner.VerifyHashedPassword(null!, hashedPassword, providedPassword) != PasswordVerificationResult.Failed;
}
