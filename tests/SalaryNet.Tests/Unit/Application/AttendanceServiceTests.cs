using Moq;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Attendance;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Domain.Entities;
using SalaryNet.Tests.Unit.Domain;

namespace SalaryNet.Tests.Unit.Application;

public class AttendanceServiceTests
{
    private readonly Mock<IAttendanceLogRepository> _attendance = new();
    private readonly Mock<IEmployeeRepository> _employees = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private AttendanceService CreateSut(ICurrentUser user) =>
        new(_attendance.Object, _employees.Object, _unitOfWork.Object, user, TestData.Clock());

    [Fact]
    public async Task CheckInAsync_WhenShiftAlreadyOpen_ThrowsConflict()
    {
        var employee = TestData.CreateEmployee();
        var open = AttendanceLog.CheckInFor(employee, TestData.Now.UtcDateTime.AddHours(-1), TestData.Clock());
        _attendance.Setup(a => a.GetOpenForEmployeeAsync(employee.Id, It.IsAny<CancellationToken>())).ReturnsAsync(open);

        var act = () => CreateSut(FakeCurrentUser.EmployeeAccount(employee.Id)).CheckInAsync(CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CheckInAsync_AsStaffWithoutEmployee_ThrowsForbidden()
    {
        var act = () => CreateSut(FakeCurrentUser.Hr()).CheckInAsync(CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task CheckOutAsync_ClosesOpenShiftAtCurrentTime()
    {
        var employee = TestData.CreateEmployee();
        var open = AttendanceLog.CheckInFor(employee, TestData.Now.UtcDateTime.AddHours(-8), TestData.Clock());
        _attendance.Setup(a => a.GetOpenForEmployeeAsync(employee.Id, It.IsAny<CancellationToken>())).ReturnsAsync(open);

        var result = await CreateSut(FakeCurrentUser.EmployeeAccount(employee.Id)).CheckOutAsync(CancellationToken.None);

        result.TotalHours.Should().Be(8);
        result.CheckOut.Should().Be(TestData.Now.UtcDateTime);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
