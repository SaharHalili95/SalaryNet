namespace SalaryNet.Application.Abstractions.Persistence;

public interface IUnitOfWork
{
    /// <summary>Persists all pending changes in one transaction.</summary>
    /// <exception cref="Common.Exceptions.ConflictException">A unique constraint was violated.</exception>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
