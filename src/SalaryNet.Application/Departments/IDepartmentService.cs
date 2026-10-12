namespace SalaryNet.Application.Departments;

public interface IDepartmentService
{
    Task<IReadOnlyList<DepartmentDto>> ListAsync(CancellationToken cancellationToken);

    Task<DepartmentDto> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<DepartmentDto> CreateAsync(SaveDepartmentRequest request, CancellationToken cancellationToken);

    Task<DepartmentDto> UpdateAsync(Guid id, SaveDepartmentRequest request, CancellationToken cancellationToken);

    /// <summary>Only empty departments can be deleted, so payroll history never loses its context.</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
