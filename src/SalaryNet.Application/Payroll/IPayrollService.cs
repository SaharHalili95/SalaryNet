using SalaryNet.Application.Common.Models;

namespace SalaryNet.Application.Payroll;

public interface IPayrollService
{
    /// <summary>For employee accounts the employee filter is always forced to the caller.</summary>
    Task<PagedResult<PayrollRecordDto>> SearchAsync(PayrollQuery query, CancellationToken cancellationToken);

    /// <summary>Employees may only read their own payslips; other ids are reported as not found.</summary>
    Task<PayrollRecordDto> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<PayrollRecordDto> GenerateAsync(GeneratePayrollRequest request, CancellationToken cancellationToken);

    Task<MonthlyPayrollResult> GenerateMonthAsync(GenerateMonthlyPayrollRequest request, CancellationToken cancellationToken);
}
