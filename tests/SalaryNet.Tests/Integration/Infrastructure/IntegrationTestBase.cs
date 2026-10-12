using System.Diagnostics.CodeAnalysis;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using SalaryNet.Application.Auth;
using SalaryNet.Infrastructure.Persistence.Seeding;

namespace SalaryNet.Tests.Integration.Infrastructure;

[Collection(IntegrationTestGroup.Name)]
[SuppressMessage("Design", "CA1001", Justification = "xUnit disposes the factory through IAsyncLifetime.DisposeAsync.")]
public abstract class IntegrationTestBase(SqlServerContainerFixture sql) : IAsyncLifetime
{
    protected const string DemoPassword = "Demo123!";

    protected static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private SalaryNetApiFactory _factory = null!;

    protected HttpClient Anonymous { get; private set; } = null!;

    public Task InitializeAsync()
    {
        _factory = new SalaryNetApiFactory(sql.ConnectionStringFor($"SalaryNet_{GetType().Name}_{Guid.NewGuid():N}"));

        // Creating the first client starts the host, which migrates and seeds the database.
        Anonymous = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync() => await _factory.DisposeAsync();

    protected Task<HttpClient> AsAdminAsync() => LoginAsync(DemoDataSeeder.AdminEmail);

    protected Task<HttpClient> AsHrAsync() => LoginAsync(DemoDataSeeder.HrEmail);

    protected Task<HttpClient> AsEmployeeAsync() => LoginAsync(DemoDataSeeder.EmployeeEmail);

    protected async Task<HttpClient> LoginAsync(string email)
    {
        var response = await Anonymous.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, DemoPassword));
        response.EnsureSuccessStatusCode();
        var login = (await response.Content.ReadFromJsonAsync<LoginResponse>(Json))!;

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.AccessToken);
        return client;
    }

    protected static async Task<T> ReadAsync<T>(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<T>(Json))!;

    protected static (int Year, int Month) CurrentPeriod()
    {
        var now = DateTime.UtcNow;
        return (now.Year, now.Month);
    }
}
