using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Configurations;

internal sealed class PayrollRecordConfiguration : IEntityTypeConfiguration<PayrollRecord>
{
    public const string EmployeePeriodIndexName = "UX_PayrollRecords_Employee_Period";

    public void Configure(EntityTypeBuilder<PayrollRecord> builder)
    {
        builder.ToTable("PayrollRecords", t =>
        {
            t.HasCheckConstraint("CK_PayrollRecords_Month", "[Month] BETWEEN 1 AND 12");
            t.HasCheckConstraint("CK_PayrollRecords_Totals", "[GrossSalary] - [Deductions] = [NetSalary]");
        });
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.Property(p => p.GrossSalary).HasPrecision(18, 2);
        builder.Property(p => p.Bonus).HasPrecision(18, 2);
        builder.Property(p => p.IncomeTax).HasPrecision(18, 2);
        builder.Property(p => p.SocialSecurity).HasPrecision(18, 2);
        builder.Property(p => p.Deductions).HasPrecision(18, 2);
        builder.Property(p => p.NetSalary).HasPrecision(18, 2);
        builder.Property(p => p.GeneratedAt).IsRequired();

        // One payslip per employee per month, enforced by the database even under concurrent requests.
        builder.HasIndex(p => new { p.EmployeeId, p.Year, p.Month })
            .IsUnique()
            .HasDatabaseName(EmployeePeriodIndexName);
        builder.HasIndex(p => new { p.Year, p.Month });

        builder.HasOne(p => p.Employee)
            .WithMany()
            .HasForeignKey(p => p.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
