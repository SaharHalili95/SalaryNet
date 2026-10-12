using System.Net;
using System.Net.Http.Json;
using SalaryNet.Application.Attendance;
using SalaryNet.Application.Common.Models;
using SalaryNet.Tests.Integration.Infrastructure;

namespace SalaryNet.Tests.Integration;

public class AttendanceEndpointsTests(SqlServerContainerFixture sql) : IntegrationTestBase(sql)
{
    [Fact]
    public async Task CheckInThenCheckOut_ClosesShiftWithCalculatedHours()
    {
        var client = await AsEmployeeAsync();

        var checkIn = await client.PostAsync("/api/attendance/check-in", null);
        var current = await client.GetAsync("/api/attendance/current");
        var doubleCheckIn = await client.PostAsync("/api/attendance/check-in", null);
        var checkOut = await client.PostAsync("/api/attendance/check-out", null);
        var afterwards = await client.GetAsync("/api/attendance/current");

        checkIn.StatusCode.Should().Be(HttpStatusCode.OK);
        current.StatusCode.Should().Be(HttpStatusCode.OK);
        doubleCheckIn.StatusCode.Should().Be(HttpStatusCode.Conflict);
        checkOut.StatusCode.Should().Be(HttpStatusCode.OK);
        afterwards.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var closed = await ReadAsync<AttendanceLogDto>(checkOut);
        closed.IsOpen.Should().BeFalse();
        closed.CheckOut.Should().BeOnOrAfter(closed.CheckIn);
        closed.TotalHours.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task CheckOut_WithoutOpenShift_Returns409()
    {
        var client = await AsEmployeeAsync();

        var response = await client.PostAsync("/api/attendance/check-out", null);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CheckIn_AsHr_Returns403()
    {
        var client = await AsHrAsync();

        var response = await client.PostAsync("/api/attendance/check-in", null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Search_AsEmployee_OnlyReturnsOwnLogs_AsHr_ReturnsEveryone()
    {
        var employee = await AsEmployeeAsync();
        var hr = await AsHrAsync();

        var own = await employee.GetFromJsonAsync<PagedResult<AttendanceLogDto>>("/api/attendance?pageSize=100", Json);
        var all = await hr.GetFromJsonAsync<PagedResult<AttendanceLogDto>>("/api/attendance?pageSize=100", Json);

        own!.Items.Should().NotBeEmpty();
        own.Items.Select(l => l.EmployeeId).Distinct().Should().ContainSingle();
        all!.Items.Select(l => l.EmployeeId).Distinct().Should().HaveCountGreaterThan(1);
    }
}
