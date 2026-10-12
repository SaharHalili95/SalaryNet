using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Services;

namespace SalaryNet.Application.Payroll;

internal sealed class PayrollService(
    IPayrollRecordRepository payroll,
    IEmployeeRepository employees,
    IPayrollCalculator calculator,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    TimeProvider clock) : IPayrollService
{
    public async Task<PagedResult<PayrollRecordDto>> SearchAsync(PayrollQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);

        // Never trust a client-supplied employee id for employee accounts: this is the IDOR guard.
        var scoped = currentUser.IsStaff ? query : query with { EmployeeId = RequireOwnEmployeeId() };

        var page = await payroll.SearchAsync(scoped, cancellationToken);
        return page.Map(PayrollRecordDto.From);
    }

    public async Task<PayrollRecordDto> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var record = await payroll.GetByIdAsync(id, cancellationToken);

        // Someone else's payslip is reported as missing so its existence is not leaked.
        if (record is null || (!currentUser.IsStaff && record.EmployeeId != currentUser.EmployeeId))
        {
            throw new NotFoundException(nameof(PayrollRecord), id);
        }

        return PayrollRecordDto.From(record);
    }

    public async Task<PayrollRecordDto> GenerateAsync(GeneratePayrollRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var employee = await employees.GetByIdAsync(request.EmployeeId, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), request.EmployeeId);

        if (await payroll.ExistsAsync(employee.Id, request.Year, request.Month, cancellationToken))
        {
            throw DuplicatePeriod(employee, request.Year, request.Month);
        }

        var record = PayrollRecord.Generate(employee, request.Year, request.Month, request.Bonus, calculator, clock);
        payroll.Add(record);

        // The unique (EmployeeId, Year, Month) index still guards against a concurrent request
        // slipping past the check above; the unit of work turns that violation into a ConflictException.
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return PayrollRecordDto.From((await payroll.GetByIdAsync(record.Id, cancellationToken))!);
    }

    public async Task<MonthlyPayrollResult> GenerateMonthAsync(
        GenerateMonthlyPayrollRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var active = await employees.ListActiveAsync(cancellationToken);
        var alreadyPaid = await payroll.GetEmployeeIdsWithPayrollAsync(request.Year, request.Month, cancellationToken);

        var generated = 0;
        foreach (var employee in active.Where(e => !alreadyPaid.Contains(e.Id)))
        {
            payroll.Add(PayrollRecord.Generate(employee, request.Year, request.Month, bonus: 0m, calculator, clock));
            generated++;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new MonthlyPayrollResult(request.Year, request.Month, generated, active.Count - generated);
    }

    private Guid RequireOwnEmployeeId() =>
        currentUser.EmployeeId ?? throw new ForbiddenAccessException("This account is not linked to an employee.");

    private static ConflictException DuplicatePeriod(Employee employee, int year, int month) =>
        new($"Payroll for {employee.FirstName} {employee.LastName} for {month:D2}/{year} has already been generated.");
}
