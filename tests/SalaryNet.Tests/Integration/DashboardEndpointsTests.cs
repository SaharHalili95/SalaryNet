using System.Net;
using System.Net.Http.Json;
using SalaryNet.Application.Dashboard;
using SalaryNet.Tests.Integration.Infrastructure;

namespace SalaryNet.Tests.Integration;

public class DashboardEndpointsTests(SqlServerContainerFixture sql) : IntegrationTestBase(sql)
{
    [Fact]
    public async Task Summary_AsAdmin_ReturnsAggregates()
    {
        var client = await AsAdminAsync();

        var summary = await client.GetFromJsonAsync<DashboardSummaryDto>("/api/dashboard/summary", Json);

        summary!.TotalEmployees.Should().Be(40);
        summary.ActiveEmployees.Should().Be(38);
        summary.MonthlyTrend.Should().HaveCount(6);
        summary.LatestPeriod.Should().NotBeNull();
        summary.PayrollByDepartment.Sum(d => d.GrossTotal).Should().Be(summary.LatestPeriod!.GrossTotal);
    }

    [Fact]
    public async Task Summary_AsEmployee_Returns403()
    {
        var client = await AsEmployeeAsync();

        var response = await client.GetAsync("/api/dashboard/summary");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
