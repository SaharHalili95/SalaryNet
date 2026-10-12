using SalaryNet.Application.Common.Models;

namespace SalaryNet.Application.Attendance;

public sealed record AttendanceQuery : PageQuery
{
    public Guid? EmployeeId { get; init; }

    /// <summary>Inclusive lower bound on check-in time (UTC).</summary>
    public DateTime? From { get; init; }

    /// <summary>Exclusive upper bound on check-in time (UTC).</summary>
    public DateTime? To { get; init; }
}
