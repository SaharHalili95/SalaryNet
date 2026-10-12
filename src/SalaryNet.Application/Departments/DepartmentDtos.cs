using SalaryNet.Application.Abstractions.Persistence;

namespace SalaryNet.Application.Departments;

public sealed record DepartmentDto(
    Guid Id,
    string Name,
    string Description,
    int EmployeeCount,
    int ActiveEmployeeCount,
    DateTime CreatedAt)
{
    public static DepartmentDto From(DepartmentSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);
        var d = summary.Department;
        return new DepartmentDto(d.Id, d.Name, d.Description, summary.EmployeeCount, summary.ActiveEmployeeCount, d.CreatedAt);
    }
}

public sealed record SaveDepartmentRequest(string Name, string? Description);
