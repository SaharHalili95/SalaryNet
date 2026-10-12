using SalaryNet.Application.Dashboard;

namespace SalaryNet.Application.Abstractions.Persistence;

/// <summary>Read-only aggregate queries for the dashboard, implemented directly against the database.</summary>
public interface IDashboardReadModel
{
    Task<DashboardSummaryDto> GetSummaryAsync(int trendMonths, CancellationToken cancellationToken);
}
