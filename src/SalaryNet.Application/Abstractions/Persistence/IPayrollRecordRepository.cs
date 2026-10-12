using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Payroll;
using SalaryNet.Domain.Entities;

namespace SalaryNet.Application.Abstractions.Persistence;

public interface IPayrollRecordRepository
{
    /// <summary>Loads the record together with its employee.</summary>
    Task<PayrollRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(Guid employeeId, int year, int month, CancellationToken cancellationToken);

    Task<IReadOnlySet<Guid>> GetEmployeeIdsWithPayrollAsync(int year, int month, CancellationToken cancellationToken);

    Task<PagedResult<PayrollRecord>> SearchAsync(PayrollQuery query, CancellationToken cancellationToken);

    void Add(PayrollRecord record);
}
