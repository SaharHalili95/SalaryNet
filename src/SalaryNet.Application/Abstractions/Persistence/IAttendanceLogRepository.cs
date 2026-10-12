using SalaryNet.Application.Attendance;
using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Abstractions.Persistence;

public interface IAttendanceLogRepository
{
    Task<AttendanceLog?> GetOpenForEmployeeAsync(Guid employeeId, CancellationToken cancellationToken);

    Task<PagedResult<AttendanceLog>> SearchAsync(AttendanceQuery query, CancellationToken cancellationToken);

    void Add(AttendanceLog log);
}
