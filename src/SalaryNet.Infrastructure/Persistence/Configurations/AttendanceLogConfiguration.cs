using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Infrastructure.Persistence.Configurations;

internal sealed class AttendanceLogConfiguration : IEntityTypeConfiguration<AttendanceLog>
{
    public void Configure(EntityTypeBuilder<AttendanceLog> builder)
    {
        builder.ToTable("AttendanceLogs", t =>
            t.HasCheckConstraint("CK_AttendanceLogs_CheckOutAfterCheckIn", "[CheckOut] IS NULL OR [CheckOut] > [CheckIn]"));
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Ignore(a => a.IsOpen);

        builder.HasIndex(a => new { a.EmployeeId, a.CheckIn });

        // At most one open shift per employee: the database backs up the application-level check.
        builder.HasIndex(a => a.EmployeeId)
            .IsUnique()
            .HasFilter("[CheckOut] IS NULL")
            .HasDatabaseName("UX_AttendanceLogs_OpenShift");

        builder.HasOne(a => a.Employee)
            .WithMany()
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
