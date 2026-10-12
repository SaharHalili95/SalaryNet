using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalaryNet.API.Security;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Payroll;

namespace SalaryNet.API.Controllers;

[ApiController]
[Route("api/payroll")]
[Authorize]
public sealed class PayrollController(IPayrollService payroll) : ControllerBase
{
    /// <summary>Staff see every payslip; employees only ever see their own, whatever filter they send.</summary>
    [HttpGet]
    public Task<PagedResult<PayrollRecordDto>> Search([FromQuery] PayrollQuery query, CancellationToken cancellationToken) =>
        payroll.SearchAsync(query, cancellationToken);

    [HttpGet("{id:guid}")]
    [ProducesResponseType<PayrollRecordDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<PayrollRecordDto> GetById(Guid id, CancellationToken cancellationToken) =>
        payroll.GetByIdAsync(id, cancellationToken);

    [HttpPost]
    [Authorize(Policy = Policies.Staff)]
    [ProducesResponseType<PayrollRecordDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<PayrollRecordDto>> Generate(GeneratePayrollRequest request, CancellationToken cancellationToken)
    {
        var created = await payroll.GenerateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPost("run")]
    [Authorize(Policy = Policies.Staff)]
    public Task<MonthlyPayrollResult> RunMonth(GenerateMonthlyPayrollRequest request, CancellationToken cancellationToken) =>
        payroll.GenerateMonthAsync(request, cancellationToken);
}
