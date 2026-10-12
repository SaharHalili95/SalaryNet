using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Employees;

public sealed record EmployeeDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    Guid DepartmentId,
    string DepartmentName,
    decimal BaseSalary,
    EmploymentType EmploymentType,
    bool IsActive,
    DateTime CreatedAt)
{
    public static EmployeeDto From(Employee employee)
    {
        ArgumentNullException.ThrowIfNull(employee);

        return new EmployeeDto(
            employee.Id,
            employee.FirstName,
            employee.LastName,
            employee.Email,
            employee.DepartmentId,
            employee.Department?.Name ?? string.Empty,
            employee.BaseSalary,
            employee.EmploymentType,
            employee.IsActive,
            employee.CreatedAt);
    }
}

public sealed record SaveEmployeeRequest(
    string FirstName,
    string LastName,
    string Email,
    Guid DepartmentId,
    decimal BaseSalary,
    EmploymentType EmploymentType);
