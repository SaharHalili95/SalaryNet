using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalaryNet.API.Security;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Users;

namespace SalaryNet.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = Policies.AdminOnly)]
public sealed class UsersController(IUserService users) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<UserAccountDto>> Search([FromQuery] UserQuery query, CancellationToken cancellationToken) =>
        users.SearchAsync(query, cancellationToken);

    [HttpPost]
    [ProducesResponseType<UserAccountDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserAccountDto>> Create(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var created = await users.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPut("{id:guid}/role")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public Task<UserAccountDto> ChangeRole(Guid id, ChangeRoleRequest request, CancellationToken cancellationToken) =>
        users.ChangeRoleAsync(id, request, cancellationToken);

    [HttpPost("{id:guid}/deactivate")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public Task<UserAccountDto> Deactivate(Guid id, CancellationToken cancellationToken) =>
        users.SetActiveAsync(id, isActive: false, cancellationToken);

    [HttpPost("{id:guid}/activate")]
    public Task<UserAccountDto> Activate(Guid id, CancellationToken cancellationToken) =>
        users.SetActiveAsync(id, isActive: true, cancellationToken);

    [HttpPost("{id:guid}/unlock")]
    public Task<UserAccountDto> Unlock(Guid id, CancellationToken cancellationToken) =>
        users.UnlockAsync(id, cancellationToken);

    [HttpPost("{id:guid}/reset-password")]
    public Task<UserAccountDto> ResetPassword(Guid id, ResetPasswordRequest request, CancellationToken cancellationToken) =>
        users.ResetPasswordAsync(id, request, cancellationToken);
}
