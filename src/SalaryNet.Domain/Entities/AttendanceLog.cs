using SalaryNet.Domain.Common;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Domain.Entities;

public sealed class AttendanceLog : Entity
{
    private AttendanceLog(Guid id, Guid employeeId, DateTime checkIn)
        : base(id)
    {
        EmployeeId = employeeId;
        CheckIn = checkIn;
    }

    private AttendanceLog()
    {
    }

    public Guid EmployeeId { get; private init; }

    public DateTime CheckIn { get; private init; }

    public DateTime? CheckOut { get; private set; }

    /// <summary>Derived from <see cref="CheckIn"/> and <see cref="CheckOut"/>; zero while the shift is open.</summary>
    public double TotalHours { get; private set; }

    public bool IsOpen => CheckOut is null;

    /// <remarks>
    /// Ensuring an employee has at most one open shift requires a query, so that rule lives in the application layer.
    /// </remarks>
    public static AttendanceLog CheckInFor(Employee employee, DateTime checkInUtc, TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(employee);
        ArgumentNullException.ThrowIfNull(clock);
        Guard.Utc(checkInUtc, nameof(CheckIn));

        if (!employee.IsActive)
        {
            throw new BusinessRuleViolationException($"Inactive employee '{employee.Id}' cannot check in.");
        }

        if (checkInUtc > clock.GetUtcNow().UtcDateTime)
        {
            throw new DomainValidationException(nameof(CheckIn), "Check-in time cannot be in the future.");
        }

        return new AttendanceLog(Guid.NewGuid(), employee.Id, checkInUtc);
    }

    public void CheckOutAt(DateTime checkOutUtc, TimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);
        Guard.Utc(checkOutUtc, nameof(CheckOut));

        if (!IsOpen)
        {
            throw new BusinessRuleViolationException($"Attendance log '{Id}' is already checked out.");
        }

        if (checkOutUtc <= CheckIn)
        {
            throw new DomainValidationException(nameof(CheckOut), "Check-out time must be later than check-in time.");
        }

        if (checkOutUtc > clock.GetUtcNow().UtcDateTime)
        {
            throw new DomainValidationException(nameof(CheckOut), "Check-out time cannot be in the future.");
        }

        CheckOut = checkOutUtc;
        TotalHours = Math.Round((checkOutUtc - CheckIn).TotalHours, 2, MidpointRounding.AwayFromZero);
    }
}
