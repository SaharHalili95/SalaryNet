using System.Net;
using System.Net.Http.Json;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Departments;
using SalaryNet.Application.Employees;
using SalaryNet.Domain.Enums;
using SalaryNet.Tests.Integration.Infrastructure;

namespace SalaryNet.Tests.Integration;

public class EmployeesEndpointsTests(SqlServerContainerFixture sql) : IntegrationTestBase(sql)
{
    [Fact]
    public async Task Search_AsHr_ReturnsPagedFilteredSortedResults()
    {
        var client = await AsHrAsync();

        var page = await client.GetFromJsonAsync<PagedResult<EmployeeDto>>(
            "/api/employees?page=1&pageSize=5&isActive=true&sortBy=BaseSalary&sortDirection=Desc", Json);

        page!.Items.Should().HaveCount(5);
        page.TotalCount.Should().BeGreaterThan(5);
        page.Items.Should().OnlyContain(e => e.IsActive);
        page.Items.Select(e => e.BaseSalary).Should().BeInDescendingOrder();
        page.Items.Should().OnlyContain(e => e.DepartmentName.Length > 0);
    }

    [Fact]
    public async Task Search_ByText_MatchesNameOrEmail()
    {
        var client = await AsHrAsync();

        var page = await client.GetFromJsonAsync<PagedResult<EmployeeDto>>("/api/employees?search=noa.cohen", Json);

        page!.Items.Should().ContainSingle().Which.LastName.Should().Be("Cohen");
    }

    [Fact]
    public async Task Search_WithInvalidPageSize_Returns400()
    {
        var client = await AsHrAsync();

        var response = await client.GetAsync("/api/employees?pageSize=1000");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadAsync<ProblemDetailsResponse>(response)).Errors.Should().ContainKey("PageSize");
    }

    [Fact]
    public async Task Search_AsEmployee_Returns403()
    {
        var client = await AsEmployeeAsync();

        var response = await client.GetAsync("/api/employees");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Create_WithValidRequest_Returns201WithLocation()
    {
        var client = await AsHrAsync();
        var request = await NewRequestAsync(client, "new.hire@salarynet.demo");

        var response = await client.PostAsJsonAsync("/api/employees", request, Json);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        var created = await ReadAsync<EmployeeDto>(response);
        created.IsActive.Should().BeTrue();

        var fetched = await client.GetFromJsonAsync<EmployeeDto>(response.Headers.Location, Json);
        fetched!.Email.Should().Be("new.hire@salarynet.demo");
    }

    [Fact]
    public async Task Create_WithInvalidPayload_Returns400WithFieldErrors()
    {
        var client = await AsHrAsync();
        var request = new SaveEmployeeRequest("", "Levi", "not-an-email", Guid.Empty, -10m, EmploymentType.FullTime);

        var response = await client.PostAsJsonAsync("/api/employees", request, Json);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await ReadAsync<ProblemDetailsResponse>(response);
        problem.Errors.Should().ContainKeys("FirstName", "Email", "DepartmentId", "BaseSalary");
    }

    [Fact]
    public async Task Create_WithDuplicateEmailInDifferentCase_Returns409()
    {
        var client = await AsHrAsync();
        var request = await NewRequestAsync(client, "NOA.COHEN@salarynet.demo");

        var response = await client.PostAsJsonAsync("/api/employees", request, Json);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Create_WithUnknownDepartment_Returns400()
    {
        var client = await AsHrAsync();
        var request = new SaveEmployeeRequest("Gil", "Bar", "gil.bar@salarynet.demo", Guid.NewGuid(), 10_000m, EmploymentType.FullTime);

        var response = await client.PostAsJsonAsync("/api/employees", request, Json);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_ChangesSalaryAndDepartment()
    {
        var client = await AsHrAsync();
        var created = await ReadAsync<EmployeeDto>(
            await client.PostAsJsonAsync("/api/employees", await NewRequestAsync(client, "to.update@salarynet.demo"), Json));
        var departments = await client.GetFromJsonAsync<List<DepartmentDto>>("/api/departments", Json);
        var target = departments!.First(d => d.Id != created.DepartmentId);

        var response = await client.PutAsJsonAsync(
            $"/api/employees/{created.Id}",
            new SaveEmployeeRequest("Updated", "Person", "to.update@salarynet.demo", target.Id, 22_222.22m, EmploymentType.PartTime),
            Json);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await ReadAsync<EmployeeDto>(response);
        updated.DepartmentName.Should().Be(target.Name);
        updated.BaseSalary.Should().Be(22_222.22m);
        updated.EmploymentType.Should().Be(EmploymentType.PartTime);
    }

    [Fact]
    public async Task Deactivate_Twice_Returns422OnSecondCall()
    {
        var client = await AsHrAsync();
        var created = await ReadAsync<EmployeeDto>(
            await client.PostAsJsonAsync("/api/employees", await NewRequestAsync(client, "leaver@salarynet.demo"), Json));

        var first = await client.PostAsync($"/api/employees/{created.Id}/deactivate", null);
        var second = await client.PostAsync($"/api/employees/{created.Id}/deactivate", null);

        first.StatusCode.Should().Be(HttpStatusCode.NoContent);
        second.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task GetById_AsEmployeeForSomeoneElse_Returns404()
    {
        var hr = await AsHrAsync();
        var other = (await hr.GetFromJsonAsync<PagedResult<EmployeeDto>>("/api/employees?search=yonatan", Json))!.Items[0];
        var employee = await AsEmployeeAsync();

        var response = await employee.GetAsync($"/api/employees/{other.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetMine_AsEmployee_ReturnsOwnRecord()
    {
        var client = await AsEmployeeAsync();

        var me = await client.GetFromJsonAsync<EmployeeDto>("/api/employees/me", Json);

        me!.Email.Should().Be("noa.cohen@salarynet.demo");
    }

    private static async Task<SaveEmployeeRequest> NewRequestAsync(HttpClient client, string email)
    {
        var departments = await client.GetFromJsonAsync<List<DepartmentDto>>("/api/departments", Json);
        return new SaveEmployeeRequest("Test", "Person", email, departments![0].Id, 12_000m, EmploymentType.FullTime);
    }
}
