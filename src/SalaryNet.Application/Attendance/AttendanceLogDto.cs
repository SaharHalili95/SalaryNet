using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Attendance;

public sealed record AttendanceLogDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    DateTime CheckIn,
    DateTime? CheckOut,
    double TotalHours,
    bool IsOpen)
{
    public static AttendanceLogDto From(AttendanceLog log)
    {
        ArgumentNullException.ThrowIfNull(log);
        var employee = log.Employee;

        return new AttendanceLogDto(
            log.Id,
            log.EmployeeId,
            employee is null ? string.Empty : $"{employee.FirstName} {employee.LastName}",
            log.CheckIn,
            log.CheckOut,
            log.TotalHours,
            log.IsOpen);
    }
}
