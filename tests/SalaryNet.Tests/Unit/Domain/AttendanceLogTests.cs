using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Tests.Unit.Domain;

public class AttendanceLogTests
{
    private static readonly DateTime ShiftStart = new(2026, 6, 15, 2, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void CheckInFor_ActiveEmployee_OpensLog()
    {
        var employee = TestData.CreateEmployee();

        var log = AttendanceLog.CheckInFor(employee, ShiftStart, TestData.Clock());

        log.EmployeeId.Should().Be(employee.Id);
        log.CheckIn.Should().Be(ShiftStart);
        log.CheckOut.Should().BeNull();
        log.TotalHours.Should().Be(0);
        log.IsOpen.Should().BeTrue();
    }

    [Fact]
    public void CheckInFor_InactiveEmployee_Throws()
    {
        var employee = TestData.CreateEmployee();
        employee.Deactivate();

        var act = () => AttendanceLog.CheckInFor(employee, ShiftStart, TestData.Clock());

        act.Should().Throw<BusinessRuleViolationException>();
    }

    [Fact]
    public void CheckInFor_FutureTime_Throws()
    {
        var act = () => AttendanceLog.CheckInFor(TestData.CreateEmployee(), TestData.Now.UtcDateTime.AddMinutes(1), TestData.Clock());

        act.Should().Throw<DomainValidationException>();
    }

    [Fact]
    public void CheckInFor_NonUtcTime_Throws()
    {
        var local = DateTime.SpecifyKind(ShiftStart, DateTimeKind.Local);

        var act = () => AttendanceLog.CheckInFor(TestData.CreateEmployee(), local, TestData.Clock());

        act.Should().Throw<DomainValidationException>();
    }

    [Theory]
    [InlineData(8 * 60 + 30, 8.5)]
    [InlineData(7 * 60 + 20, 7.33)]
    [InlineData(1, 0.02)]
    public void CheckOutAt_CalculatesTotalHoursDeterministically(int minutesWorked, double expectedHours)
    {
        var clock = TestData.Clock();
        var log = AttendanceLog.CheckInFor(TestData.CreateEmployee(), ShiftStart, clock);

        log.CheckOutAt(ShiftStart.AddMinutes(minutesWorked), clock);

        log.CheckOut.Should().Be(ShiftStart.AddMinutes(minutesWorked));
        log.TotalHours.Should().Be(expectedHours);
        log.IsOpen.Should().BeFalse();
    }

    [Fact]
    public void CheckOutAt_BeforeOrAtCheckIn_Throws()
    {
        var clock = TestData.Clock();
        var log = AttendanceLog.CheckInFor(TestData.CreateEmployee(), ShiftStart, clock);

        var act = () => log.CheckOutAt(ShiftStart, clock);

        act.Should().Throw<DomainValidationException>();
        log.IsOpen.Should().BeTrue();
    }

    [Fact]
    public void CheckOutAt_InFuture_Throws()
    {
        var clock = TestData.Clock();
        var log = AttendanceLog.CheckInFor(TestData.CreateEmployee(), ShiftStart, clock);

        var act = () => log.CheckOutAt(TestData.Now.UtcDateTime.AddHours(1), clock);

        act.Should().Throw<DomainValidationException>();
    }

    [Fact]
    public void CheckOutAt_Twice_Throws()
    {
        var clock = TestData.Clock();
        var log = AttendanceLog.CheckInFor(TestData.CreateEmployee(), ShiftStart, clock);
        log.CheckOutAt(ShiftStart.AddHours(8), clock);

        var act = () => log.CheckOutAt(ShiftStart.AddHours(9), clock);

        act.Should().Throw<BusinessRuleViolationException>();
        log.TotalHours.Should().Be(8);
    }
}
