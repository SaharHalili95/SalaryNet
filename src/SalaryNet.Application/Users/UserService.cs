using FluentValidation;
using FluentValidation.Results;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Application.Common.Models;
using SalaryNet.Domain.Common;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Application.Users;

internal sealed class UserService(
    IUserRepository users,
    IEmployeeRepository employees,
    IPasswordHasher passwordHasher,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    TimeProvider clock) : IUserService
{
    public async Task<PagedResult<UserAccountDto>> SearchAsync(UserQuery query, CancellationToken cancellationToken)
    {
        var page = await users.SearchAsync(query, cancellationToken);
        return page.Map(item => UserAccountDto.From(item, clock));
    }

    public async Task<UserAccountDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (await users.EmailExistsAsync(EmailNormalizer.Normalize(request.Email), cancellationToken))
        {
            throw new ConflictException($"An account with email '{request.Email.Trim()}' already exists.");
        }

        if (request.EmployeeId is { } employeeId)
        {
            await EnsureEmployeeCanBeLinkedAsync(employeeId, excludingUserId: null, cancellationToken);
        }

        var user = User.Create(request.Email, passwordHasher.Hash(request.Password), request.Role, request.EmployeeId, clock);
        users.Add(user);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await LoadDtoAsync(user.Id, cancellationToken);
    }

    public async Task<UserAccountDto> ChangeRoleAsync(Guid id, ChangeRoleRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        EnsureNotSelf(id, "change your own role");

        var user = await LoadAsync(id, cancellationToken);
        if (request.EmployeeId is { } employeeId)
        {
            await EnsureEmployeeCanBeLinkedAsync(employeeId, excludingUserId: id, cancellationToken);
        }

        user.ChangeRole(request.Role, request.EmployeeId);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await LoadDtoAsync(id, cancellationToken);
    }

    public async Task<UserAccountDto> SetActiveAsync(Guid id, bool isActive, CancellationToken cancellationToken)
    {
        if (!isActive)
        {
            EnsureNotSelf(id, "deactivate your own account");
        }

        var user = await LoadAsync(id, cancellationToken);
        if (isActive)
        {
            user.Activate();
        }
        else
        {
            user.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await LoadDtoAsync(id, cancellationToken);
    }

    public async Task<UserAccountDto> UnlockAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await LoadAsync(id, cancellationToken);
        user.Unlock();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await LoadDtoAsync(id, cancellationToken);
    }

    public async Task<UserAccountDto> ResetPasswordAsync(Guid id, ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var user = await LoadAsync(id, cancellationToken);
        user.ResetPasswordHash(passwordHasher.Hash(request.NewPassword));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await LoadDtoAsync(id, cancellationToken);
    }

    /// <summary>Keeps at least the acting administrator able to manage the system.</summary>
    private void EnsureNotSelf(Guid id, string action)
    {
        if (id == currentUser.UserId)
        {
            throw new BusinessRuleViolationException($"You cannot {action}. Ask another administrator.");
        }
    }

    private async Task EnsureEmployeeCanBeLinkedAsync(Guid employeeId, Guid? excludingUserId, CancellationToken cancellationToken)
    {
        if (await employees.GetByIdAsync(employeeId, cancellationToken) is null)
        {
            throw new ValidationException(
                [new ValidationFailure(nameof(CreateUserRequest.EmployeeId), $"Employee '{employeeId}' does not exist.")]);
        }

        if (await users.IsEmployeeLinkedAsync(employeeId, excludingUserId, cancellationToken))
        {
            throw new ConflictException("This employee already has an account.");
        }
    }

    private async Task<User> LoadAsync(Guid id, CancellationToken cancellationToken) =>
        await users.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException(nameof(User), id);

    private async Task<UserAccountDto> LoadDtoAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await users.GetListItemAsync(id, cancellationToken) ?? throw new NotFoundException(nameof(User), id);
        return UserAccountDto.From(item, clock);
    }
}
