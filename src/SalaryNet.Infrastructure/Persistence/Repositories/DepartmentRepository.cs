using Microsoft.EntityFrameworkCore;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Repositories;

internal sealed class DepartmentRepository(SalaryNetDbContext db) : IDepartmentRepository
{
    public Task<Department?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Departments.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken) =>
        db.Departments.AnyAsync(d => d.Id == id, cancellationToken);

    public Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken) =>
        db.Departments.AnyAsync(d => d.Name == name && d.Id != excludingId, cancellationToken);

    public async Task<IReadOnlyList<DepartmentSummary>> ListWithHeadcountAsync(CancellationToken cancellationToken) =>
        await Summaries(db.Departments.AsNoTracking().OrderBy(d => d.Name)).ToListAsync(cancellationToken);

    public Task<DepartmentSummary?> GetSummaryAsync(Guid id, CancellationToken cancellationToken) =>
        Summaries(db.Departments.AsNoTracking().Where(d => d.Id == id)).FirstOrDefaultAsync(cancellationToken);

    public Task<bool> HasEmployeesAsync(Guid id, CancellationToken cancellationToken) =>
        db.Employees.AnyAsync(e => e.DepartmentId == id, cancellationToken);

    public void Add(Department department) => db.Departments.Add(department);

    public void Remove(Department department) => db.Departments.Remove(department);

    private IQueryable<DepartmentSummary> Summaries(IQueryable<Department> departments) =>
        departments.Select(d => new DepartmentSummary(
            d,
            db.Employees.Count(e => e.DepartmentId == d.Id),
            db.Employees.Count(e => e.DepartmentId == d.Id && e.IsActive)));
}
