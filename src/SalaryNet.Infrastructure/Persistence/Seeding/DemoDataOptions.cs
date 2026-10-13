namespace SalaryNet.Infrastructure.Persistence.Seeding;

public sealed class DemoDataOptions
{
    public const string SectionName = "DemoData";

    public bool Enabled { get; init; }

    /// <summary>Password for the HR and employee demo accounts. Demo data is fictional and never used in production.</summary>
    public string Password { get; init; } = "Demo123!";

    public string AdminPassword { get; init; } = "Admin1234";
}
