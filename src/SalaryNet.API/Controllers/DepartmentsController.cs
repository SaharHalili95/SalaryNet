using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalaryNet.API.Security;
using SalaryNet.Application.Departments;

namespace SalaryNet.API.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize(Policy = Policies.Staff)]
public sealed class DepartmentsController(IDepartmentService departments) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<DepartmentDto>> List(CancellationToken cancellationToken) =>
        departments.ListAsync(cancellationToken);

    [HttpGet("{id:guid}")]
    public Task<DepartmentDto> GetById(Guid id, CancellationToken cancellationToken) =>
        departments.GetByIdAsync(id, cancellationToken);

    [HttpPost]
    [Authorize(Policy = Policies.AdminOnly)]
    [ProducesResponseType<DepartmentDto>(StatusCodes.Status201Created)]
    public async Task<ActionResult<DepartmentDto>> Create(SaveDepartmentRequest request, CancellationToken cancellationToken)
    {
        var created = await departments.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public Task<DepartmentDto> Update(Guid id, SaveDepartmentRequest request, CancellationToken cancellationToken) =>
        departments.UpdateAsync(id, request, cancellationToken);

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.AdminOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await departments.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
