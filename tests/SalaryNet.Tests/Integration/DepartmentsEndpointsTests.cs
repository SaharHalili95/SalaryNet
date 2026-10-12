using System.Net;
using System.Net.Http.Json;
using SalaryNet.Application.Departments;
using SalaryNet.Tests.Integration.Infrastructure;

namespace SalaryNet.Tests.Integration;

public class DepartmentsEndpointsTests(SqlServerContainerFixture sql) : IntegrationTestBase(sql)
{
    [Fact]
    public async Task List_AsHr_ReturnsDepartmentsWithHeadcount()
    {
        var client = await AsHrAsync();

        var departments = await client.GetFromJsonAsync<List<DepartmentDto>>("/api/departments", Json);

        departments.Should().HaveCount(6);
        departments!.Sum(d => d.EmployeeCount).Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Create_AsHr_Returns403()
    {
        var client = await AsHrAsync();

        var response = await client.PostAsJsonAsync("/api/departments", new SaveDepartmentRequest("Legal", null), Json);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateAndDelete_AsAdmin_Succeeds()
    {
        var client = await AsAdminAsync();

        var create = await client.PostAsJsonAsync("/api/departments", new SaveDepartmentRequest("Legal", "Contracts"), Json);
        var created = await ReadAsync<DepartmentDto>(create);
        var delete = await client.DeleteAsync($"/api/departments/{created.Id}");

        create.StatusCode.Should().Be(HttpStatusCode.Created);
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Create_WithDuplicateName_Returns409()
    {
        var client = await AsAdminAsync();

        var response = await client.PostAsJsonAsync("/api/departments", new SaveDepartmentRequest("Engineering", null), Json);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Delete_DepartmentWithEmployees_Returns409()
    {
        var client = await AsAdminAsync();
        var departments = await client.GetFromJsonAsync<List<DepartmentDto>>("/api/departments", Json);

        var response = await client.DeleteAsync($"/api/departments/{departments!.First(d => d.EmployeeCount > 0).Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}
