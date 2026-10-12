using Microsoft.EntityFrameworkCore;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Employees;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Repositories;

internal sealed class EmployeeRepository(SalaryNetDbContext db) : IEmployeeRepository
{
    public Task<Employee?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Employees.Include(e => e.Department).FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    public Task<bool> EmailExistsAsync(string normalizedEmail, Guid? excludingId, CancellationToken cancellationToken) =>
        db.Employees.AnyAsync(e => e.Email == normalizedEmail && e.Id != excludingId, cancellationToken);

    public Task<PagedResult<Employee>> SearchAsync(EmployeeQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        var employees = db.Employees.AsNoTracking().Include(e => e.Department).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            employees = employees.Where(e =>
                e.FirstName.Contains(term) || e.LastName.Contains(term) || e.Email.Contains(term));
        }

        if (query.DepartmentId is { } departmentId)
        {
            employees = employees.Where(e => e.DepartmentId == departmentId);
        }

        if (query.EmploymentType is { } employmentType)
        {
            employees = employees.Where(e => e.EmploymentType == employmentType);
        }

        if (query.IsActive is { } isActive)
        {
            employees = employees.Where(e => e.IsActive == isActive);
        }

        var descending = query.SortDirection == SortDirection.Desc;
        employees = query.SortBy switch
        {
            EmployeeSortField.BaseSalary => descending
                ? employees.OrderByDescending(e => e.BaseSalary)
                : employees.OrderBy(e => e.BaseSalary),
            EmployeeSortField.CreatedAt => descending
                ? employees.OrderByDescending(e => e.CreatedAt)
                : employees.OrderBy(e => e.CreatedAt),
            _ => descending
                ? employees.OrderByDescending(e => e.LastName).ThenByDescending(e => e.FirstName)
                : employees.OrderBy(e => e.LastName).ThenBy(e => e.FirstName),
        };

        // Tie-breaker keeps paging stable when the sort key has duplicates.
        employees = ((IOrderedQueryable<Employee>)employees).ThenBy(e => e.Id);

        return employees.ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<IReadOnlyList<Employee>> ListActiveAsync(CancellationToken cancellationToken) =>
        await db.Employees.Where(e => e.IsActive).ToListAsync(cancellationToken);

    public void Add(Employee employee) => db.Employees.Add(employee);
}
