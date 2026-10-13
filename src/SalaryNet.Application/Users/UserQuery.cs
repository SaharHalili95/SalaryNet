using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Users;

public sealed record UserQuery : PageQuery
{
    /// <summary>Matches the account email or the linked employee's name.</summary>
    public string? Search { get; init; }

    public UserRole? Role { get; init; }

    public bool? IsActive { get; init; }
}
