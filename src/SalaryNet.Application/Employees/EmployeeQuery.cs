using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Employees;

public sealed record EmployeeQuery : PageQuery
{
    /// <summary>Matches first name, last name or email.</summary>
    public string? Search { get; init; }

    public Guid? DepartmentId { get; init; }

    public EmploymentType? EmploymentType { get; init; }

    public bool? IsActive { get; init; }

    public EmployeeSortField SortBy { get; init; } = EmployeeSortField.LastName;

    public SortDirection SortDirection { get; init; } = SortDirection.Asc;
}

public enum EmployeeSortField
{
    LastName,
    BaseSalary,
    CreatedAt,
}
