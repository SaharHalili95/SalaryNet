using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Configurations;

internal sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees", t => t.HasCheckConstraint("CK_Employees_BaseSalary_Positive", "[BaseSalary] > 0"));
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        builder.Property(e => e.FirstName).HasMaxLength(Employee.NameMaxLength).IsRequired();
        builder.Property(e => e.LastName).HasMaxLength(Employee.NameMaxLength).IsRequired();
        builder.Property(e => e.Email).HasMaxLength(Employee.EmailMaxLength).IsRequired();
        builder.Property(e => e.BaseSalary).HasPrecision(18, 2);
        builder.Property(e => e.EmploymentType).HasConversion<string>().HasMaxLength(20);
        builder.Property(e => e.CreatedAt).IsRequired();

        builder.HasIndex(e => e.Email).IsUnique();
        builder.HasIndex(e => new { e.LastName, e.FirstName });
        builder.HasIndex(e => e.IsActive);
    }
}
