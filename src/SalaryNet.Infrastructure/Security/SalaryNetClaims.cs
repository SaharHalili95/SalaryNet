namespace SalaryNet.Infrastructure.Security;

/// <summary>Claim names written into, and read back from, SalaryNet access tokens.</summary>
public static class SalaryNetClaims
{
    public const string Subject = "sub";
    public const string Email = "email";
    public const string Role = "role";
    public const string EmployeeId = "employee_id";
}
