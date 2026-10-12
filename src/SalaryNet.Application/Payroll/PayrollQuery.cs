using SalaryNet.Application.Common.Models;

namespace SalaryNet.Application.Payroll;

public sealed record PayrollQuery : PageQuery
{
    public Guid? EmployeeId { get; init; }

    public Guid? DepartmentId { get; init; }

    public int? Year { get; init; }

    public int? Month { get; init; }
}
