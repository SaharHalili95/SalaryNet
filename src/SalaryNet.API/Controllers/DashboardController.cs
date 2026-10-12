using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalaryNet.API.Security;
using SalaryNet.Application.Dashboard;

namespace SalaryNet.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = Policies.Staff)]
public sealed class DashboardController(IDashboardService dashboard) : ControllerBase
{
    [HttpGet("summary")]
    public Task<DashboardSummaryDto> Summary(CancellationToken cancellationToken) =>
        dashboard.GetSummaryAsync(cancellationToken);
}
