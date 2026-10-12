using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Abstractions.Security;

public interface IAccessTokenGenerator
{
    AccessToken Generate(User user);
}

public sealed record AccessToken(string Token, DateTime ExpiresAt);
