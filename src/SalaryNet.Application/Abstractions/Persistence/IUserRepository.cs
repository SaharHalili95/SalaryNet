using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Users;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Abstractions.Persistence;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);

    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<UserListItem?> GetListItemAsync(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<UserListItem>> SearchAsync(UserQuery query, CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);

    Task<bool> IsEmployeeLinkedAsync(Guid employeeId, Guid? excludingUserId, CancellationToken cancellationToken);

    void Add(User user);
}

/// <summary>A user together with the display name of its linked employee, if any.</summary>
public sealed record UserListItem(User User, string? EmployeeName);
