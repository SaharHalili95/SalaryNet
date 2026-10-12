using System.Net;
using System.Net.Http.Json;
using SalaryNet.Application.Auth;
using SalaryNet.Domain.Enums;
using SalaryNet.Infrastructure.Persistence.Seeding;
using SalaryNet.Tests.Integration.Infrastructure;

namespace SalaryNet.Tests.Integration;

public class AuthEndpointsTests(SqlServerContainerFixture sql) : IntegrationTestBase(sql)
{
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokenAndUser()
    {
        var response = await Anonymous.PostAsJsonAsync("/api/auth/login", new LoginRequest(DemoDataSeeder.EmployeeEmail, DemoPassword));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await ReadAsync<LoginResponse>(response);
        body.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.User.Role.Should().Be(UserRole.Employee);
        body.User.DisplayName.Should().Be("Noa Cohen");
        body.User.EmployeeId.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401ProblemDetails()
    {
        var response = await Anonymous.PostAsJsonAsync("/api/auth/login", new LoginRequest(DemoDataSeeder.HrEmail, "wrong-password"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        var problem = await ReadAsync<ProblemDetailsResponse>(response);
        problem.Status.Should().Be(401);
        problem.TraceId.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        var response = await Anonymous.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithTamperedToken_Returns401()
    {
        var client = await AsHrAsync();
        var token = client.DefaultRequestHeaders.Authorization!.Parameter!;
        client.DefaultRequestHeaders.Authorization = new("Bearer", token[..^4] + "AAAA");

        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithToken_ReturnsCurrentUser()
    {
        var client = await AsAdminAsync();

        var me = await client.GetFromJsonAsync<UserDto>("/api/auth/me", Json);

        me!.Email.Should().Be(DemoDataSeeder.AdminEmail);
        me.Role.Should().Be(UserRole.Admin);
    }
}
