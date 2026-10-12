using Microsoft.EntityFrameworkCore;
using SalaryNet.Domain.Entities;
using SalaryNet.Infrastructure.Persistence.Converters;

namespace SalaryNet.Infrastructure.Persistence;

public sealed class SalaryNetDbContext(DbContextOptions<SalaryNetDbContext> options) : DbContext(options)
{
    public DbSet<Department> Departments => Set<Department>();

    public DbSet<Employee> Employees => Set<Employee>();

    public DbSet<PayrollRecord> PayrollRecords => Set<PayrollRecord>();

    public DbSet<AttendanceLog> AttendanceLogs => Set<AttendanceLog>();

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SalaryNetDbContext).Assembly);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // All timestamps are written as UTC; this restores DateTimeKind.Utc on read so API clients receive "Z" suffixes.
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<NullableUtcDateTimeConverter>();
    }
}
