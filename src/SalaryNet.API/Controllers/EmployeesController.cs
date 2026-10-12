using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalaryNet.API.Security;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Employees;

namespace SalaryNet.API.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public sealed class EmployeesController(IEmployeeService employees) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = Policies.Staff)]
    public Task<PagedResult<EmployeeDto>> Search([FromQuery] EmployeeQuery query, CancellationToken cancellationToken) =>
        employees.SearchAsync(query, cancellationToken);

    [HttpGet("me")]
    public Task<EmployeeDto> GetMine(CancellationToken cancellationToken) =>
        employees.GetCurrentAsync(cancellationToken);

    [HttpGet("{id:guid}")]
    [ProducesResponseType<EmployeeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<EmployeeDto> GetById(Guid id, CancellationToken cancellationToken) =>
        employees.GetByIdAsync(id, cancellationToken);

    [HttpPost]
    [Authorize(Policy = Policies.Staff)]
    [ProducesResponseType<EmployeeDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployeeDto>> Create(SaveEmployeeRequest request, CancellationToken cancellationToken)
    {
        var created = await employees.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.Staff)]
    public Task<EmployeeDto> Update(Guid id, SaveEmployeeRequest request, CancellationToken cancellationToken) =>
        employees.UpdateAsync(id, request, cancellationToken);

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = Policies.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        await employees.SetActiveAsync(id, isActive: false, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/activate")]
    [Authorize(Policy = Policies.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken cancellationToken)
    {
        await employees.SetActiveAsync(id, isActive: true, cancellationToken);
        return NoContent();
    }
}
