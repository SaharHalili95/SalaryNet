using Microsoft.EntityFrameworkCore;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Attendance;
using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Repositories;

internal sealed class AttendanceLogRepository(SalaryNetDbContext db) : IAttendanceLogRepository
{
    public Task<AttendanceLog?> GetOpenForEmployeeAsync(Guid employeeId, CancellationToken cancellationToken) =>
        db.AttendanceLogs
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.CheckOut == null, cancellationToken);

    public Task<PagedResult<AttendanceLog>> SearchAsync(AttendanceQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        var logs = db.AttendanceLogs.AsNoTracking().Include(a => a.Employee).AsQueryable();

        if (query.EmployeeId is { } employeeId)
        {
            logs = logs.Where(a => a.EmployeeId == employeeId);
        }

        if (query.From is { } from)
        {
            logs = logs.Where(a => a.CheckIn >= from);
        }

        if (query.To is { } to)
        {
            logs = logs.Where(a => a.CheckIn < to);
        }

        return logs
            .OrderByDescending(a => a.CheckIn)
            .ThenBy(a => a.Id)
            .ToPagedResultAsync(query, cancellationToken);
    }

    public void Add(AttendanceLog log) => db.AttendanceLogs.Add(log);
}
