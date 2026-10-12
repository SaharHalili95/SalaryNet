using System.Net;
using System.Net.Http.Json;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Employees;
using SalaryNet.Application.Payroll;
using SalaryNet.Tests.Integration.Infrastructure;

namespace SalaryNet.Tests.Integration;

public class PayrollEndpointsTests(SqlServerContainerFixture sql) : IntegrationTestBase(sql)
{
    [Fact]
    public async Task Generate_ForCurrentPeriod_Returns201AndConsistentTotals()
    {
        var client = await AsHrAsync();
        var employee = await ActiveEmployeeAsync(client, skip: 0);
        var (year, month) = CurrentPeriod();

        var response = await client.PostAsJsonAsync("/api/payroll", new GeneratePayrollRequest(employee.Id, year, month, 750m), Json);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var record = await ReadAsync<PayrollRecordDto>(response);
        record.Bonus.Should().Be(750m);
        record.GrossSalary.Should().Be(employee.BaseSalary + 750m);
        record.Deductions.Should().Be(record.IncomeTax + record.SocialSecurity);
        record.NetSalary.Should().Be(record.GrossSalary - record.Deductions);
    }

    [Fact]
    public async Task Generate_TwiceForSamePeriod_Returns409()
    {
        var client = await AsHrAsync();
        var employee = await ActiveEmployeeAsync(client, skip: 1);
        var (year, month) = CurrentPeriod();
        var request = new GeneratePayrollRequest(employee.Id, year, month, 0m);

        (await client.PostAsJsonAsync("/api/payroll", request, Json)).StatusCode.Should().Be(HttpStatusCode.Created);
        var second = await client.PostAsJsonAsync("/api/payroll", request, Json);

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Generate_ConcurrentDuplicates_DatabaseIndexAllowsOnlyOne()
    {
        var client = await AsHrAsync();
        var employee = await ActiveEmployeeAsync(client, skip: 2);
        var (year, month) = CurrentPeriod();
        var request = new GeneratePayrollRequest(employee.Id, year, month, 0m);

        var responses = await Task.WhenAll(Enumerable.Range(0, 5)
            .Select(_ => client.PostAsJsonAsync("/api/payroll", request, Json)));

        responses.Count(r => r.StatusCode == HttpStatusCode.Created).Should().Be(1);
        responses.Count(r => r.StatusCode == HttpStatusCode.Conflict).Should().Be(4);
    }

    [Fact]
    public async Task Generate_ForFuturePeriod_Returns422()
    {
        var client = await AsHrAsync();
        var employee = await ActiveEmployeeAsync(client, skip: 3);
        var next = DateTime.UtcNow.AddMonths(1);

        var response = await client.PostAsJsonAsync("/api/payroll", new GeneratePayrollRequest(employee.Id, next.Year, next.Month, 0m), Json);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task Generate_AsEmployee_Returns403()
    {
        var client = await AsEmployeeAsync();
        var (year, month) = CurrentPeriod();

        var response = await client.PostAsJsonAsync("/api/payroll", new GeneratePayrollRequest(Guid.NewGuid(), year, month, 0m), Json);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Search_AsEmployeeWithSpoofedEmployeeId_OnlyReturnsOwnPayslips()
    {
        var hr = await AsHrAsync();
        var someoneElse = await ActiveEmployeeAsync(hr, skip: 4);
        var employee = await AsEmployeeAsync();
        var me = await employee.GetFromJsonAsync<EmployeeDto>("/api/employees/me", Json);

        var page = await employee.GetFromJsonAsync<PagedResult<PayrollRecordDto>>(
            $"/api/payroll?employeeId={someoneElse.Id}&pageSize=100", Json);

        page!.Items.Should().NotBeEmpty();
        page.Items.Should().OnlyContain(p => p.EmployeeId == me!.Id);
    }

    [Fact]
    public async Task GetById_AsEmployeeForSomeoneElsesPayslip_Returns404()
    {
        var hr = await AsHrAsync();
        var me = await (await AsEmployeeAsync()).GetFromJsonAsync<EmployeeDto>("/api/employees/me", Json);
        var others = await hr.GetFromJsonAsync<PagedResult<PayrollRecordDto>>("/api/payroll?pageSize=100", Json);
        var foreign = others!.Items.First(p => p.EmployeeId != me!.Id);
        var employee = await AsEmployeeAsync();

        var response = await employee.GetAsync($"/api/payroll/{foreign.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RunMonth_GeneratesForEveryoneOnceAndIsIdempotent()
    {
        var client = await AsHrAsync();
        var (year, month) = CurrentPeriod();
        var request = new GenerateMonthlyPayrollRequest(year, month);

        var first = await ReadAsync<MonthlyPayrollResult>(await client.PostAsJsonAsync("/api/payroll/run", request, Json));
        var second = await ReadAsync<MonthlyPayrollResult>(await client.PostAsJsonAsync("/api/payroll/run", request, Json));

        (first.Generated + first.Skipped).Should().Be(second.Skipped);
        second.Generated.Should().Be(0);
    }

    private static async Task<EmployeeDto> ActiveEmployeeAsync(HttpClient client, int skip)
    {
        // Skip the demo employee account so these tests never touch Noa Cohen's payroll.
        var page = await client.GetFromJsonAsync<PagedResult<EmployeeDto>>(
            "/api/employees?isActive=true&pageSize=50&sortBy=CreatedAt", Json);
        return page!.Items.Where(e => e.Email != "noa.cohen@salarynet.demo").Skip(skip).First();
    }
}
