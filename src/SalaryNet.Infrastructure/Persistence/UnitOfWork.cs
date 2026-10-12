using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Common.Exceptions;

namespace SalaryNet.Infrastructure.Persistence;

internal sealed class UnitOfWork(SalaryNetDbContext dbContext) : IUnitOfWork
{
    // SQL Server: 2601 = duplicate key in unique index, 2627 = unique/primary key constraint violation.
    private static readonly int[] UniqueViolationErrors = [2601, 2627];

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sql && UniqueViolationErrors.Contains(sql.Number))
        {
            throw new ConflictException("The change conflicts with an existing record.", ex);
        }
    }
}
