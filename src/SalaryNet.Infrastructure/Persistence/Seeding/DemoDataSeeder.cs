using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Services;

namespace SalaryNet.Infrastructure.Persistence.Seeding;

/// <summary>
/// Fills an empty database with a fictional, deterministic company whose history looks lived-in:
/// hires spread over several years, recent joiners and leavers, an annual raise and a quarter-end bonus round.
/// </summary>
public sealed partial class DemoDataSeeder(
    SalaryNetDbContext db,
    IPasswordHasher passwordHasher,
    IPayrollCalculator calculator,
    IOptions<DemoDataOptions> options,
    TimeProvider clock,
    ILogger<DemoDataSeeder> logger)
{
    public const string AdminEmail = "admin@salarynet.demo";
    public const string HrEmail = "hr@salarynet.demo";
    public const string EmployeeEmail = "noa.cohen@salarynet.demo";

    private const int PayrollMonths = 6;
    private const int AttendanceDays = 14;
    private const int RecentHires = 5;
    private const decimal AnnualRaise = 0.04m;

    /// <summary>The annual raise took effect this many months before the current month.</summary>
    private const int RaiseMonthsAgo = 3;

    private static readonly (string Name, string Description, decimal MinSalary, decimal MaxSalary)[] Departments =
    [
        ("Engineering", "Product development, platform and QA", 18_000m, 42_000m),
        ("Finance", "Accounting, payroll control and reporting", 14_000m, 30_000m),
        ("Human Resources", "Recruiting, people operations and benefits", 12_000m, 26_000m),
        ("Sales", "New business and account management", 11_000m, 28_000m),
        ("Customer Success", "Onboarding, support and retention", 9_000m, 18_000m),
        ("Operations", "IT, facilities and procurement", 9_500m, 20_000m),
    ];

    private static readonly string[] FirstNames =
    [
        "Noa", "Yonatan", "Maya", "Itai", "Tamar", "Omer", "Shira", "Eitan", "Yael", "Amit",
        "Lior", "Roni", "Daniel", "Michal", "Ariel", "Hila", "Gal", "Nadav", "Dana", "Tomer",
        "Adi", "Ido", "Keren", "Yuval", "Sivan", "Ofir", "Rotem", "Alon", "Inbar", "Elad",
    ];

    private static readonly string[] LastNames =
    [
        "Cohen", "Levi", "Mizrahi", "Peretz", "Biton", "Friedman", "Avraham", "Dahan", "Shapiro", "Katz",
        "Azoulay", "Golan", "Ben-David", "Rosen", "Halevi", "Segal", "Weiss", "Navon", "Amar", "Tal",
    ];

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        if (await db.Departments.AnyAsync(cancellationToken))
        {
            LogSkipped(logger);
            return;
        }

        var random = new Random(2026);
        var now = clock.GetUtcNow();
        var currentMonth = new DateOnly(now.Year, now.Month, 1);
        var founded = At(currentMonth.AddYears(-6).ToDateTime(TimeOnly.MinValue));

        var departments = Departments.Select(d => Department.Create(d.Name, d.Description, founded)).ToList();
        db.Departments.AddRange(departments);

        var staff = CreateEmployees(departments, currentMonth, random);
        db.Employees.AddRange(staff.Select(s => s.Employee));

        CreatePayroll(staff, currentMonth, random);
        CreateAttendance(staff, random);

        foreach (var leaver in staff.Where(s => s.LeftMonth is not null))
        {
            leaver.Employee.Deactivate();
        }

        CreateUsers(staff[0].Employee, founded);

        await db.SaveChangesAsync(cancellationToken);
        LogSeeded(logger, departments.Count, staff.Count);
    }

    private static List<SeedEmployee> CreateEmployees(List<Department> departments, DateOnly currentMonth, Random random)
    {
        var staff = new List<SeedEmployee>();
        var count = FirstNames.Length * 4 / 3;

        for (var i = 0; i < count; i++)
        {
            var departmentIndex = i % departments.Count;
            var spec = Departments[departmentIndex];
            var first = FirstNames[i % FirstNames.Length];
            var last = LastNames[(i * 7) % LastNames.Length];
            var email = i == 0 ? EmployeeEmail : $"{first}.{last}{i}@salarynet.demo".ToLowerInvariant();

            var salary = RoundToHundreds(spec.MinSalary + ((spec.MaxSalary - spec.MinSalary) * (decimal)random.NextDouble()));
            var type = random.Next(10) switch
            {
                < 7 => EmploymentType.FullTime,
                < 9 => EmploymentType.PartTime,
                _ => EmploymentType.Contractor,
            };

            if (i == 0)
            {
                type = EmploymentType.FullTime;
            }

            if (type == EmploymentType.PartTime)
            {
                salary = RoundToHundreds(salary * 0.6m);
            }

            // The last entries are this year's joiners and two people who left two months ago; everyone else
            // joined at some point over the past five years (the demo employee three years ago).
            var isRecentHire = i >= count - 2 - RecentHires && i < count - 2;
            var isLeaver = i >= count - 2;
            var hiredMonth = i == 0 ? currentMonth.AddYears(-3)
                : isRecentHire ? currentMonth.AddMonths(-random.Next(0, PayrollMonths))
                : currentMonth.AddMonths(-random.Next(PayrollMonths + 1, 60));
            var hiredOn = hiredMonth.AddDays(random.Next(0, 27));

            var employee = Employee.Create(
                first, last, email, departments[departmentIndex].Id, salary, type, At(hiredOn.ToDateTime(new TimeOnly(9, 0))));

            staff.Add(new SeedEmployee(employee, hiredMonth, isLeaver ? currentMonth.AddMonths(-2) : null));
        }

        return staff;
    }

    /// <summary>Generates each past month as it would have been issued at the time, on the 1st of the following month.</summary>
    private void CreatePayroll(List<SeedEmployee> staff, DateOnly currentMonth, Random random)
    {
        var raiseMonth = currentMonth.AddMonths(-RaiseMonthsAgo);

        foreach (var member in staff)
        {
            var employee = member.Employee;
            var currentSalary = employee.BaseSalary;
            var salaryBeforeRaise = RoundToHundreds(currentSalary / (1 + AnnualRaise));

            for (var offset = PayrollMonths; offset >= 1; offset--)
            {
                var period = currentMonth.AddMonths(-offset);
                if (period < member.HiredMonth || (member.LeftMonth is { } left && period > left))
                {
                    continue;
                }

                // Payroll for a month uses the salary in force that month.
                var salary = period < raiseMonth && member.HiredMonth < raiseMonth ? salaryBeforeRaise : currentSalary;
                employee.ChangeEmploymentTerms(salary, employee.EmploymentType);

                var issuedAt = At(period.AddMonths(1).ToDateTime(new TimeOnly(8, 0)));
                db.PayrollRecords.Add(PayrollRecord.Generate(employee, period.Year, period.Month, Bonus(period, random), calculator, issuedAt));
            }

            employee.ChangeEmploymentTerms(currentSalary, employee.EmploymentType);
        }
    }

    private static decimal Bonus(DateOnly period, Random random)
    {
        var quarterEnd = period.Month % 3 == 0;
        return random.Next(10) switch
        {
            < 4 when quarterEnd => random.Next(15, 61) * 100m,
            0 => random.Next(5, 16) * 100m,
            _ => 0m,
        };
    }

    private void CreateAttendance(List<SeedEmployee> staff, Random random)
    {
        var today = clock.GetUtcNow().UtcDateTime.Date;

        foreach (var employee in staff
            .Where(s => s.LeftMonth is null && s.Employee.EmploymentType != EmploymentType.Contractor)
            .Select(s => s.Employee))
        {
            for (var day = AttendanceDays; day >= 1; day--)
            {
                var date = today.AddDays(-day);

                // Israeli work week: Sunday to Thursday; no shifts before the employee joined.
                if (date.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday || date < employee.CreatedAt.Date)
                {
                    continue;
                }

                var checkIn = DateTime.SpecifyKind(date.AddHours(5).AddMinutes(random.Next(0, 120)), DateTimeKind.Utc);
                var shiftMinutes = employee.EmploymentType == EmploymentType.PartTime
                    ? random.Next(240, 330)
                    : random.Next(480, 600);

                var log = AttendanceLog.CheckInFor(employee, checkIn, clock);
                log.CheckOutAt(checkIn.AddMinutes(shiftMinutes), clock);
                db.AttendanceLogs.Add(log);
            }
        }
    }

    private void CreateUsers(Employee demoEmployee, TimeProvider createdAt)
    {
        var demoHash = passwordHasher.Hash(options.Value.Password);

        db.Users.AddRange(
            User.Create(AdminEmail, passwordHasher.Hash(options.Value.AdminPassword), UserRole.Admin, null, createdAt, "Eyal Shamir"),
            User.Create(HrEmail, demoHash, UserRole.HR, null, createdAt, "Michal Barak"),
            User.Create(EmployeeEmail, demoHash, UserRole.Employee, demoEmployee.Id, createdAt));
    }

    private static decimal RoundToHundreds(decimal amount) => Math.Round(amount / 100m, MidpointRounding.AwayFromZero) * 100m;

    private static FixedTimeProvider At(DateTime utc) => new(new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)));

    [LoggerMessage(Level = LogLevel.Information, Message = "Database already contains data; demo seeding skipped.")]
    private static partial void LogSkipped(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information, Message = "Seeded demo data: {Departments} departments, {Employees} employees.")]
    private static partial void LogSeeded(ILogger logger, int departments, int employees);

    private sealed record SeedEmployee(Employee Employee, DateOnly HiredMonth, DateOnly? LeftMonth);

    /// <summary>Lets entities be created "in the past" through their normal factories.</summary>
    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
