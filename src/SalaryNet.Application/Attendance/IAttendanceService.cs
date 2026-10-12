using SalaryNet.Application.Common.Models;

namespace SalaryNet.Application.Attendance;

public interface IAttendanceService
{
    /// <summary>Opens a shift for the calling employee at the current time.</summary>
    Task<AttendanceLogDto> CheckInAsync(CancellationToken cancellationToken);

    /// <summary>Closes the calling employee's open shift at the current time.</summary>
    Task<AttendanceLogDto> CheckOutAsync(CancellationToken cancellationToken);

    Task<AttendanceLogDto?> GetOpenShiftAsync(CancellationToken cancellationToken);

    /// <summary>For employee accounts the employee filter is always forced to the caller.</summary>
    Task<PagedResult<AttendanceLogDto>> SearchAsync(AttendanceQuery query, CancellationToken cancellationToken);
}
