using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SalaryNet.Tests.Integration.Infrastructure;

/// <summary>Boots the real API against a dedicated, migrated and demo-seeded database.</summary>
public sealed class SalaryNetApiFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:SalaryNet", connectionString);
        builder.UseSetting("Jwt:SigningKey", "integration-test-signing-key-0123456789abcdef");
        builder.UseSetting("Database:InitializeOnStartup", "true");
        builder.UseSetting("DemoData:Enabled", "true");
    }
}
