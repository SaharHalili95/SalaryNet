using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Infrastructure.Persistence;
using SalaryNet.Infrastructure.Persistence.Repositories;
using SalaryNet.Infrastructure.Persistence.Seeding;
using SalaryNet.Infrastructure.Security;

namespace SalaryNet.Infrastructure;

public static class DependencyInjection
{
    public const string ConnectionStringName = "SalaryNet";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddDbContext<SalaryNetDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString(ConnectionStringName),
                sql => sql.EnableRetryOnFailure()));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<IPayrollRecordRepository, PayrollRecordRepository>();
        services.AddScoped<IAttendanceLogRepository, AttendanceLogRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IDashboardReadModel, DashboardReadModel>();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(o => o.SigningKey.Length >= JwtOptions.MinSigningKeyLength, $"Jwt:SigningKey must be at least {JwtOptions.MinSigningKeyLength} characters.")
            .Validate(o => o.ExpiryMinutes > 0, "Jwt:ExpiryMinutes must be positive.")
            .ValidateOnStart();
        services.AddSingleton<IAccessTokenGenerator, JwtAccessTokenGenerator>();
        services.AddSingleton<IPasswordHasher, IdentityPasswordHasher>();

        services.Configure<DemoDataOptions>(configuration.GetSection(DemoDataOptions.SectionName));
        services.AddScoped<DemoDataSeeder>();

        services.AddSingleton(TimeProvider.System);

        return services;
    }

    /// <summary>Applies pending migrations and, when enabled, seeds demo data.</summary>
    public static async Task InitializeDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SalaryNetDbContext>();
        await db.Database.MigrateAsync(cancellationToken);

        if (scope.ServiceProvider.GetRequiredService<IOptions<DemoDataOptions>>().Value.Enabled)
        {
            await scope.ServiceProvider.GetRequiredService<DemoDataSeeder>().SeedAsync(cancellationToken);
        }
    }
}
