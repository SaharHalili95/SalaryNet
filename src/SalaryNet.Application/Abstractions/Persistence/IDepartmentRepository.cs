using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Abstractions.Persistence;

public interface IDepartmentRepository
{
    Task<Department?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken);

    Task<IReadOnlyList<DepartmentSummary>> ListWithHeadcountAsync(CancellationToken cancellationToken);

    Task<DepartmentSummary?> GetSummaryAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> HasEmployeesAsync(Guid id, CancellationToken cancellationToken);

    void Add(Department department);

    void Remove(Department department);
}

public sealed record DepartmentSummary(Department Department, int EmployeeCount, int ActiveEmployeeCount);
