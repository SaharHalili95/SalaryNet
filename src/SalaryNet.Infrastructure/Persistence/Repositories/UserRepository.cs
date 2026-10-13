using Microsoft.EntityFrameworkCore;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Users;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Repositories;

internal sealed class UserRepository(SalaryNetDbContext db) : IUserRepository
{
    // Tracked: sign-in updates the failed-login counter on the same entity.
    public Task<User?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public Task<UserListItem?> GetListItemAsync(Guid id, CancellationToken cancellationToken) =>
        ListItems(db.Users.AsNoTracking().Where(u => u.Id == id)).FirstOrDefaultAsync(cancellationToken);

    public Task<PagedResult<UserListItem>> SearchAsync(UserQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        var users = db.Users.AsNoTracking();

        if (query.Role is { } role)
        {
            users = users.Where(u => u.Role == role);
        }

        if (query.IsActive is { } isActive)
        {
            users = users.Where(u => u.IsActive == isActive);
        }

        var items =
            from u in users
            join e in db.Employees on u.EmployeeId equals e.Id into linked
            from e in linked.DefaultIfEmpty()
            select new { User = u, Employee = e };

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            items = items.Where(i =>
                i.User.Email.Contains(term)
                || (i.User.DisplayName != null && i.User.DisplayName.Contains(term))
                || (i.Employee != null && (i.Employee.FirstName + " " + i.Employee.LastName).Contains(term)));
        }

        return items
            .OrderBy(i => i.User.Role)
            .ThenBy(i => i.User.Email)
            .Select(i => new UserListItem(i.User, i.Employee == null ? null : i.Employee.FirstName + " " + i.Employee.LastName))
            .ToPagedResultAsync(query, cancellationToken);
    }

    public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        db.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);

    public Task<bool> IsEmployeeLinkedAsync(Guid employeeId, Guid? excludingUserId, CancellationToken cancellationToken) =>
        db.Users.AnyAsync(u => u.EmployeeId == employeeId && u.Id != excludingUserId, cancellationToken);

    public void Add(User user) => db.Users.Add(user);

    // Filters must be applied to the users before this projection; EF cannot translate predicates on the record.
    private IQueryable<UserListItem> ListItems(IQueryable<User> users) =>
        from u in users
        join e in db.Employees on u.EmployeeId equals e.Id into linked
        from e in linked.DefaultIfEmpty()
        select new UserListItem(u, e == null ? null : e.FirstName + " " + e.LastName);
}
