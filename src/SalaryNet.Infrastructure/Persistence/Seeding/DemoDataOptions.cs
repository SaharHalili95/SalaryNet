namespace SalaryNet.Infrastructure.Persistence.Seeding;

public sealed class DemoDataOptions
{
    public const string SectionName = "DemoData";

    public bool Enabled { get; init; }

    /// <summary>Shared password for the demo accounts. Demo data is fictional and never used in production.</summary>
    public string Password { get; init; } = "Demo123!";
}
