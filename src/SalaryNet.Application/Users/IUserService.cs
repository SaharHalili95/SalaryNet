using SalaryNet.Application.Common.Models;

namespace SalaryNet.Application.Users;

/// <summary>Account administration. Every operation is restricted to administrators at the API layer.</summary>
public interface IUserService
{
    Task<PagedResult<UserAccountDto>> SearchAsync(UserQuery query, CancellationToken cancellationToken);

    Task<UserAccountDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken);

    Task<UserAccountDto> ChangeRoleAsync(Guid id, ChangeRoleRequest request, CancellationToken cancellationToken);

    Task<UserAccountDto> SetActiveAsync(Guid id, bool isActive, CancellationToken cancellationToken);

    Task<UserAccountDto> UnlockAsync(Guid id, CancellationToken cancellationToken);

    Task<UserAccountDto> ResetPasswordAsync(Guid id, ResetPasswordRequest request, CancellationToken cancellationToken);
}
