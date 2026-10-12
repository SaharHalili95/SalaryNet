using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Services;

namespace SalaryNet.Infrastructure.Persistence.Seeding;

/// <summary>Fills an empty database with fictional, deterministic demo data.</summary>
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
        var departments = Departments.Select(d => Department.Create(d.Name, d.Description, clock)).ToList();
        db.Departments.AddRange(departments);

        var employees = CreateEmployees(departments, random);
        db.Employees.AddRange(employees);

        CreatePayroll(employees, random);
        CreateAttendance(employees, random);
        CreateUsers(employees[0]);

        await db.SaveChangesAsync(cancellationToken);
        LogSeeded(logger, departments.Count, employees.Count);
    }

    private List<Employee> CreateEmployees(List<Department> departments, Random random)
    {
        var employees = new List<Employee>();

        for (var i = 0; i < FirstNames.Length * 4 / 3; i++)
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

            employees.Add(Employee.Create(first, last, email, departments[departmentIndex].Id, salary, type, clock));
        }

        // A couple of former employees so the "inactive" filter has something to show.
        employees[^1].Deactivate();
        employees[^2].Deactivate();

        return employees;
    }

    private void CreatePayroll(List<Employee> employees, Random random)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var currentMonth = new DateOnly(now.Year, now.Month, 1);

        // Previous months only, so the current month can be generated live in the demo.
        for (var offset = PayrollMonths; offset >= 1; offset--)
        {
            var period = currentMonth.AddMonths(-offset);
            foreach (var employee in employees.Where(e => e.IsActive))
            {
                var bonus = random.Next(6) == 0 ? Math.Round((decimal)random.Next(5, 31) * 100m, 2) : 0m;
                db.PayrollRecords.Add(PayrollRecord.Generate(employee, period.Year, period.Month, bonus, calculator, clock));
            }
        }
    }

    private void CreateAttendance(List<Employee> employees, Random random)
    {
        var today = clock.GetUtcNow().UtcDateTime.Date;

        foreach (var employee in employees.Where(e => e.IsActive && e.EmploymentType != EmploymentType.Contractor))
        {
            for (var day = AttendanceDays; day >= 1; day--)
            {
                var date = today.AddDays(-day);

                // Israeli work week: Sunday to Thursday.
                if (date.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday)
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

    private void CreateUsers(Employee demoEmployee)
    {
        var hash = passwordHasher.Hash(options.Value.Password);

        db.Users.AddRange(
            User.Create(AdminEmail, hash, UserRole.Admin, null, clock),
            User.Create(HrEmail, hash, UserRole.HR, null, clock),
            User.Create(EmployeeEmail, hash, UserRole.Employee, demoEmployee.Id, clock));
    }

    private static decimal RoundToHundreds(decimal amount) => Math.Round(amount / 100m, MidpointRounding.AwayFromZero) * 100m;

    [LoggerMessage(Level = LogLevel.Information, Message = "Database already contains data; demo seeding skipped.")]
    private static partial void LogSkipped(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information, Message = "Seeded demo data: {Departments} departments, {Employees} employees.")]
    private static partial void LogSeeded(ILogger logger, int departments, int employees);
}
