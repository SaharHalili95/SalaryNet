using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Attendance;

internal sealed class AttendanceService(
    IAttendanceLogRepository attendance,
    IEmployeeRepository employees,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    TimeProvider clock) : IAttendanceService
{
    public async Task<AttendanceLogDto> CheckInAsync(CancellationToken cancellationToken)
    {
        var employeeId = RequireOwnEmployeeId();

        if (await attendance.GetOpenForEmployeeAsync(employeeId, cancellationToken) is not null)
        {
            throw new ConflictException("You are already checked in. Check out before starting a new shift.");
        }

        var employee = await employees.GetByIdAsync(employeeId, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), employeeId);

        var log = AttendanceLog.CheckInFor(employee, clock.GetUtcNow().UtcDateTime, clock);
        attendance.Add(log);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return AttendanceLogDto.From(log);
    }

    public async Task<AttendanceLogDto> CheckOutAsync(CancellationToken cancellationToken)
    {
        var employeeId = RequireOwnEmployeeId();

        var log = await attendance.GetOpenForEmployeeAsync(employeeId, cancellationToken)
            ?? throw new ConflictException("You are not checked in.");

        log.CheckOutAt(clock.GetUtcNow().UtcDateTime, clock);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return AttendanceLogDto.From(log);
    }

    public async Task<AttendanceLogDto?> GetOpenShiftAsync(CancellationToken cancellationToken)
    {
        var log = await attendance.GetOpenForEmployeeAsync(RequireOwnEmployeeId(), cancellationToken);
        return log is null ? null : AttendanceLogDto.From(log);
    }

    public async Task<PagedResult<AttendanceLogDto>> SearchAsync(AttendanceQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        var scoped = currentUser.IsStaff ? query : query with { EmployeeId = RequireOwnEmployeeId() };

        var page = await attendance.SearchAsync(scoped, cancellationToken);
        return page.Map(AttendanceLogDto.From);
    }

    private Guid RequireOwnEmployeeId() =>
        currentUser.EmployeeId ?? throw new ForbiddenAccessException("Only employee accounts can record attendance.");
}
