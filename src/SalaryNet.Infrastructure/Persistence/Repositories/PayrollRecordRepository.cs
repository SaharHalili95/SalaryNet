using Microsoft.EntityFrameworkCore;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Payroll;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Repositories;

internal sealed class PayrollRecordRepository(SalaryNetDbContext db) : IPayrollRecordRepository
{
    public Task<PayrollRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.PayrollRecords
            .AsNoTracking()
            .Include(p => p.Employee).ThenInclude(e => e!.Department)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(Guid employeeId, int year, int month, CancellationToken cancellationToken) =>
        db.PayrollRecords.AnyAsync(
            p => p.EmployeeId == employeeId && p.Year == year && p.Month == month,
            cancellationToken);

    public async Task<IReadOnlySet<Guid>> GetEmployeeIdsWithPayrollAsync(int year, int month, CancellationToken cancellationToken)
    {
        var ids = await db.PayrollRecords
            .Where(p => p.Year == year && p.Month == month)
            .Select(p => p.EmployeeId)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }

    public Task<PagedResult<PayrollRecord>> SearchAsync(PayrollQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        var records = db.PayrollRecords
            .AsNoTracking()
            .Include(p => p.Employee).ThenInclude(e => e!.Department)
            .AsQueryable();

        if (query.EmployeeId is { } employeeId)
        {
            records = records.Where(p => p.EmployeeId == employeeId);
        }

        if (query.DepartmentId is { } departmentId)
        {
            records = records.Where(p => p.Employee!.DepartmentId == departmentId);
        }

        if (query.Year is { } year)
        {
            records = records.Where(p => p.Year == year);
        }

        if (query.Month is { } month)
        {
            records = records.Where(p => p.Month == month);
        }

        return records
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ThenBy(p => p.Employee!.LastName)
            .ThenBy(p => p.Id)
            .ToPagedResultAsync(query, cancellationToken);
    }

    public void Add(PayrollRecord record) => db.PayrollRecords.Add(record);
}
