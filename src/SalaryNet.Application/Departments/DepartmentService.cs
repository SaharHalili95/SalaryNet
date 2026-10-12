using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Departments;

internal sealed class DepartmentService(
    IDepartmentRepository departments,
    IUnitOfWork unitOfWork,
    TimeProvider clock) : IDepartmentService
{
    public async Task<IReadOnlyList<DepartmentDto>> ListAsync(CancellationToken cancellationToken)
    {
        var summaries = await departments.ListWithHeadcountAsync(cancellationToken);
        return summaries.Select(DepartmentDto.From).ToList();
    }

    public async Task<DepartmentDto> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var summary = await departments.GetSummaryAsync(id, cancellationToken)
            ?? throw new NotFoundException(nameof(Department), id);

        return DepartmentDto.From(summary);
    }

    public async Task<DepartmentDto> CreateAsync(SaveDepartmentRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        await EnsureNameIsFreeAsync(request.Name, excludingId: null, cancellationToken);

        var department = Department.Create(request.Name, request.Description, clock);
        departments.Add(department);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return DepartmentDto.From(new DepartmentSummary(department, 0, 0));
    }

    public async Task<DepartmentDto> UpdateAsync(Guid id, SaveDepartmentRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var department = await LoadAsync(id, cancellationToken);
        await EnsureNameIsFreeAsync(request.Name, excludingId: id, cancellationToken);

        department.Update(request.Name, request.Description);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var department = await LoadAsync(id, cancellationToken);

        if (await departments.HasEmployeesAsync(id, cancellationToken))
        {
            throw new ConflictException($"Department '{department.Name}' still has employees and cannot be deleted.");
        }

        departments.Remove(department);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Department> LoadAsync(Guid id, CancellationToken cancellationToken) =>
        await departments.GetByIdAsync(id, cancellationToken)
        ?? throw new NotFoundException(nameof(Department), id);

    private async Task EnsureNameIsFreeAsync(string name, Guid? excludingId, CancellationToken cancellationToken)
    {
        if (await departments.NameExistsAsync(name.Trim(), excludingId, cancellationToken))
        {
            throw new ConflictException($"A department named '{name.Trim()}' already exists.");
        }
    }
}
