using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Employees;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Abstractions.Persistence;

public interface IEmployeeRepository
{
    /// <summary>Loads the employee together with its department.</summary>
    Task<Employee?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(string normalizedEmail, Guid? excludingId, CancellationToken cancellationToken);

    Task<PagedResult<Employee>> SearchAsync(EmployeeQuery query, CancellationToken cancellationToken);

    Task<IReadOnlyList<Employee>> ListActiveAsync(CancellationToken cancellationToken);

    void Add(Employee employee);
}
