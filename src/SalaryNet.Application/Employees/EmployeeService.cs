using FluentValidation;
using FluentValidation.Results;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Common;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Employees;

internal sealed class EmployeeService(
    IEmployeeRepository employees,
    IDepartmentRepository departments,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    TimeProvider clock) : IEmployeeService
{
    public async Task<PagedResult<EmployeeDto>> SearchAsync(EmployeeQuery query, CancellationToken cancellationToken)
    {
        var page = await employees.SearchAsync(query, cancellationToken);
        return page.Map(EmployeeDto.From);
    }

    public async Task<EmployeeDto> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!currentUser.IsStaff && currentUser.EmployeeId != id)
        {
            throw new NotFoundException(nameof(Employee), id);
        }

        return EmployeeDto.From(await LoadAsync(id, cancellationToken));
    }

    public async Task<EmployeeDto> GetCurrentAsync(CancellationToken cancellationToken)
    {
        var employeeId = currentUser.EmployeeId
            ?? throw new NotFoundException(nameof(Employee), "current user");

        return EmployeeDto.From(await LoadAsync(employeeId, cancellationToken));
    }

    public async Task<EmployeeDto> CreateAsync(SaveEmployeeRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        await EnsureDepartmentExistsAsync(request.DepartmentId, cancellationToken);
        await EnsureEmailIsFreeAsync(request.Email, excludingId: null, cancellationToken);

        var employee = Employee.Create(
            request.FirstName,
            request.LastName,
            request.Email,
            request.DepartmentId,
            request.BaseSalary,
            request.EmploymentType,
            clock);

        employees.Add(employee);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return EmployeeDto.From(await LoadAsync(employee.Id, cancellationToken));
    }

    public async Task<EmployeeDto> UpdateAsync(Guid id, SaveEmployeeRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var employee = await LoadAsync(id, cancellationToken);

        if (employee.DepartmentId != request.DepartmentId)
        {
            await EnsureDepartmentExistsAsync(request.DepartmentId, cancellationToken);
            employee.TransferTo(request.DepartmentId);
        }

        await EnsureEmailIsFreeAsync(request.Email, excludingId: id, cancellationToken);
        employee.UpdatePersonalDetails(request.FirstName, request.LastName, request.Email);
        employee.ChangeEmploymentTerms(request.BaseSalary, request.EmploymentType);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return EmployeeDto.From(await LoadAsync(id, cancellationToken));
    }

    public async Task SetActiveAsync(Guid id, bool isActive, CancellationToken cancellationToken)
    {
        var employee = await LoadAsync(id, cancellationToken);

        if (isActive)
        {
            employee.Activate();
        }
        else
        {
            employee.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Employee> LoadAsync(Guid id, CancellationToken cancellationToken) =>
        await employees.GetByIdAsync(id, cancellationToken)
        ?? throw new NotFoundException(nameof(Employee), id);

    private async Task EnsureDepartmentExistsAsync(Guid departmentId, CancellationToken cancellationToken)
    {
        if (!await departments.ExistsAsync(departmentId, cancellationToken))
        {
            // A dangling reference in the payload is a client input error (400), not a missing resource (404).
            throw new ValidationException(
                [new ValidationFailure(nameof(SaveEmployeeRequest.DepartmentId), $"Department '{departmentId}' does not exist.")]);
        }
    }

    private async Task EnsureEmailIsFreeAsync(string email, Guid? excludingId, CancellationToken cancellationToken)
    {
        if (await employees.EmailExistsAsync(EmailNormalizer.Normalize(email), excludingId, cancellationToken))
        {
            throw new ConflictException($"An employee with email '{email.Trim()}' already exists.");
        }
    }
}
