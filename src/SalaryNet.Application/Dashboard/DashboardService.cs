using SalaryNet.Application.Abstractions.Persistence;

namespace SalaryNet.Application.Dashboard;

internal sealed class DashboardService(IDashboardReadModel readModel) : IDashboardService
{
    private const int TrendMonths = 6;

    public Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken) =>
        readModel.GetSummaryAsync(TrendMonths, cancellationToken);
}
