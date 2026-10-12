using SalaryNet.Application.Common.Models;

namespace SalaryNet.Application.Employees;

public interface IEmployeeService
{
    Task<PagedResult<EmployeeDto>> SearchAsync(EmployeeQuery query, CancellationToken cancellationToken);

    /// <summary>Employees may only read their own record; other ids are reported as not found.</summary>
    Task<EmployeeDto> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<EmployeeDto> GetCurrentAsync(CancellationToken cancellationToken);

    Task<EmployeeDto> CreateAsync(SaveEmployeeRequest request, CancellationToken cancellationToken);

    Task<EmployeeDto> UpdateAsync(Guid id, SaveEmployeeRequest request, CancellationToken cancellationToken);

    Task SetActiveAsync(Guid id, bool isActive, CancellationToken cancellationToken);
}
