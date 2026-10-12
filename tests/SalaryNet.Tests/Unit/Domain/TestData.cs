using Microsoft.Extensions.Time.Testing;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Tests.Unit.Domain;

internal static class TestData
{
    public static readonly DateTimeOffset Now = new(2026, 6, 15, 12, 0, 0, TimeSpan.Zero);

    public static FakeTimeProvider Clock() => new(Now);

    public static Employee CreateEmployee(
        decimal baseSalary = 10_000m,
        EmploymentType employmentType = EmploymentType.FullTime,
        TimeProvider? clock = null) =>
        Employee.Create(
            "Dana",
            "Levi",
            "dana.levi@salarynet.test",
            Guid.NewGuid(),
            baseSalary,
            employmentType,
            clock ?? Clock());
}
