using System.Net;
using System.Net.Http.Json;
using SalaryNet.Application.Auth;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Employees;
using SalaryNet.Application.Users;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Tests.Integration.Infrastructure;

namespace SalaryNet.Tests.Integration;

public class UsersEndpointsTests(SqlServerContainerFixture sql) : IntegrationTestBase(sql)
{
    private const string StrongPassword = "Start123";

    [Fact]
    public async Task Search_AsHr_Returns403()
    {
        var client = await AsHrAsync();

        var response = await client.GetAsync("/api/users");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Search_AsAdmin_ListsDemoAccountsWithLinkedEmployeeName()
    {
        var client = await AsAdminAsync();

        var page = await client.GetFromJsonAsync<PagedResult<UserAccountDto>>("/api/users", Json);

        page!.Items.Should().HaveCount(3);
        page.Items.Single(u => u.Role == UserRole.Employee).EmployeeName.Should().Be("Noa Cohen");
    }

    [Fact]
    public async Task Create_ThenNewUserCanSignIn()
    {
        var admin = await AsAdminAsync();

        var response = await admin.PostAsJsonAsync("/api/users", new CreateUserRequest("auditor@salarynet.demo", StrongPassword, UserRole.HR, null), Json);
        var login = await Anonymous.PostAsJsonAsync("/api/auth/login", new LoginRequest("auditor@salarynet.demo", StrongPassword));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        login.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Create_WithWeakPassword_Returns400()
    {
        var admin = await AsAdminAsync();

        var response = await admin.PostAsJsonAsync("/api/users", new CreateUserRequest("weak@salarynet.demo", "password", UserRole.HR, null), Json);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadAsync<ProblemDetailsResponse>(response)).Errors.Should().ContainKey("Password");
    }

    [Fact]
    public async Task Create_SecondAccountForSameEmployee_Returns409()
    {
        var admin = await AsAdminAsync();
        var noa = (await admin.GetFromJsonAsync<UserDto>("/api/auth/me", Json))!;
        var users = await admin.GetFromJsonAsync<PagedResult<UserAccountDto>>("/api/users?role=Employee", Json);
        var linkedEmployeeId = users!.Items[0].EmployeeId!.Value;

        var response = await admin.PostAsJsonAsync("/api/users",
            new CreateUserRequest("noa.second@salarynet.demo", StrongPassword, UserRole.Employee, linkedEmployeeId), Json);

        noa.Role.Should().Be(UserRole.Admin);
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task FiveFailedLogins_LockAccount_AdminUnlockRestoresAccess()
    {
        var admin = await AsAdminAsync();
        var created = await CreateHrUserAsync(admin, "lockme@salarynet.demo");

        for (var i = 0; i < User.MaxFailedLogins; i++)
        {
            (await Login("lockme@salarynet.demo", "Wrong1234")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        var whileLocked = await Login("lockme@salarynet.demo", StrongPassword);
        var listed = await admin.GetFromJsonAsync<PagedResult<UserAccountDto>>("/api/users?search=lockme", Json);
        var unlock = await admin.PostAsync($"/api/users/{created.Id}/unlock", null);
        var afterUnlock = await Login("lockme@salarynet.demo", StrongPassword);

        whileLocked.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        listed!.Items.Single().IsLockedOut.Should().BeTrue();
        (await ReadAsync<UserAccountDto>(unlock)).IsLockedOut.Should().BeFalse();
        afterUnlock.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Deactivate_BlocksSignIn_ActivateRestoresIt()
    {
        var admin = await AsAdminAsync();
        var created = await CreateHrUserAsync(admin, "leaver@salarynet.demo");

        await admin.PostAsync($"/api/users/{created.Id}/deactivate", null);
        var whileInactive = await Login("leaver@salarynet.demo", StrongPassword);
        await admin.PostAsync($"/api/users/{created.Id}/activate", null);
        var afterActivate = await Login("leaver@salarynet.demo", StrongPassword);

        whileInactive.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        afterActivate.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Deactivate_OwnAccount_Returns422()
    {
        var admin = await AsAdminAsync();
        var me = await admin.GetFromJsonAsync<UserDto>("/api/auth/me", Json);

        var response = await admin.PostAsync($"/api/users/{me!.Id}/deactivate", null);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task ChangeRole_ToEmployee_LinksEmployeeAndChangesAccess()
    {
        var admin = await AsAdminAsync();
        var created = await CreateHrUserAsync(admin, "promoted@salarynet.demo");
        var unlinked = (await admin.GetFromJsonAsync<PagedResult<EmployeeDto>>("/api/employees?search=yonatan", Json))!.Items[0];

        var response = await admin.PutAsJsonAsync($"/api/users/{created.Id}/role", new ChangeRoleRequest(UserRole.Employee, unlinked.Id), Json);
        var asEmployee = await LoginAsync("promoted@salarynet.demo", StrongPassword);

        (await ReadAsync<UserAccountDto>(response)).EmployeeName.Should().Be($"{unlinked.FirstName} {unlinked.LastName}");
        (await asEmployee.GetAsync("/api/employees")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ResetPassword_OldPasswordStopsWorking()
    {
        var admin = await AsAdminAsync();
        var created = await CreateHrUserAsync(admin, "forgetful@salarynet.demo");

        await admin.PostAsJsonAsync($"/api/users/{created.Id}/reset-password", new ResetPasswordRequest("Brand123"), Json);

        (await Login("forgetful@salarynet.demo", StrongPassword)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await Login("forgetful@salarynet.demo", "Brand123")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChangePassword_RequiresCurrentPasswordAndThenUsesNewOne()
    {
        var admin = await AsAdminAsync();
        await CreateHrUserAsync(admin, "rotator@salarynet.demo");
        var user = await LoginAsync("rotator@salarynet.demo", StrongPassword);

        var wrongCurrent = await user.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest("Nope1234", "Rotated123"), Json);
        var ok = await user.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest(StrongPassword, "Rotated123"), Json);

        wrongCurrent.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ReadAsync<ProblemDetailsResponse>(wrongCurrent)).Errors.Should().ContainKey("CurrentPassword");
        ok.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await Login("rotator@salarynet.demo", "Rotated123")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private Task<HttpResponseMessage> Login(string email, string password) =>
        Anonymous.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));

    private static async Task<UserAccountDto> CreateHrUserAsync(HttpClient admin, string email)
    {
        var response = await admin.PostAsJsonAsync("/api/users", new CreateUserRequest(email, StrongPassword, UserRole.HR, null), Json);
        response.EnsureSuccessStatusCode();
        return await ReadAsync<UserAccountDto>(response);
    }
}
