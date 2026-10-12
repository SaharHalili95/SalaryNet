using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalaryNet.API.Security;
using SalaryNet.Application.Attendance;
using SalaryNet.Application.Common.Models;

namespace SalaryNet.API.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public sealed class AttendanceController(IAttendanceService attendance) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<AttendanceLogDto>> Search([FromQuery] AttendanceQuery query, CancellationToken cancellationToken) =>
        attendance.SearchAsync(query, cancellationToken);

    [HttpGet("current")]
    [Authorize(Policy = Policies.EmployeeOnly)]
    [ProducesResponseType<AttendanceLogDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<AttendanceLogDto>> Current(CancellationToken cancellationToken) =>
        await attendance.GetOpenShiftAsync(cancellationToken) is { } open ? open : NoContent();

    [HttpPost("check-in")]
    [Authorize(Policy = Policies.EmployeeOnly)]
    [ProducesResponseType<AttendanceLogDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<AttendanceLogDto> CheckIn(CancellationToken cancellationToken) =>
        attendance.CheckInAsync(cancellationToken);

    [HttpPost("check-out")]
    [Authorize(Policy = Policies.EmployeeOnly)]
    [ProducesResponseType<AttendanceLogDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<AttendanceLogDto> CheckOut(CancellationToken cancellationToken) =>
        attendance.CheckOutAsync(cancellationToken);
}
