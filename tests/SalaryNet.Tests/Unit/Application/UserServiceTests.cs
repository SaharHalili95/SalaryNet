using Moq;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Application.Users;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;
using SalaryNet.Tests.Unit.Domain;

namespace SalaryNet.Tests.Unit.Application;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IEmployeeRepository> _employees = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly FakeCurrentUser _admin = new(UserRole.Admin);

    public UserServiceTests()
    {
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns<string>(p => $"hash:{p}");
        _users.Setup(u => u.GetListItemAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => _stored is { } s && s.Id == id ? new UserListItem(s, null) : null);
    }

    private User? _stored;

    private UserService CreateSut() =>
        new(_users.Object, _employees.Object, _hasher.Object, _unitOfWork.Object, _admin, TestData.Clock());

    private User Store(User user)
    {
        _stored = user;
        _users.Setup(u => u.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        return user;
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateEmail_ThrowsConflict()
    {
        _users.Setup(u => u.EmailExistsAsync("taken@salarynet.test", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var act = () => CreateSut().CreateAsync(new CreateUserRequest("Taken@salarynet.test", "Passw0rd!", UserRole.HR, null), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_ForEmployeeThatAlreadyHasAccount_ThrowsConflict()
    {
        var employee = TestData.CreateEmployee();
        _employees.Setup(e => e.GetByIdAsync(employee.Id, It.IsAny<CancellationToken>())).ReturnsAsync(employee);
        _users.Setup(u => u.IsEmployeeLinkedAsync(employee.Id, null, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var act = () => CreateSut().CreateAsync(new CreateUserRequest("dana@salarynet.test", "Passw0rd!", UserRole.Employee, employee.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_HashesPasswordBeforeStoring()
    {
        User? added = null;
        _users.Setup(u => u.Add(It.IsAny<User>())).Callback<User>(u => added = Store(u));

        var result = await CreateSut().CreateAsync(new CreateUserRequest("new@salarynet.test", "Passw0rd!", UserRole.HR, null), CancellationToken.None);

        added!.PasswordHash.Should().Be("hash:Passw0rd!");
        result.Email.Should().Be("new@salarynet.test");
        result.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task SetActiveAsync_DeactivatingSelf_IsRejected()
    {
        var act = () => CreateSut().SetActiveAsync(_admin.UserId, isActive: false, CancellationToken.None);

        await act.Should().ThrowAsync<BusinessRuleViolationException>();
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ChangeRoleAsync_OnSelf_IsRejected()
    {
        var act = () => CreateSut().ChangeRoleAsync(_admin.UserId, new ChangeRoleRequest(UserRole.HR, null), CancellationToken.None);

        await act.Should().ThrowAsync<BusinessRuleViolationException>();
    }

    [Fact]
    public async Task UnlockAsync_ReleasesLockout()
    {
        var clock = TestData.Clock();
        var user = Store(User.Create("hr@salarynet.test", "hash", UserRole.HR, null, clock));
        for (var i = 0; i < User.MaxFailedLogins; i++)
        {
            user.RegisterFailedLogin(clock);
        }

        var result = await CreateSut().UnlockAsync(user.Id, CancellationToken.None);

        result.IsLockedOut.Should().BeFalse();
        user.LockoutEndsAt.Should().BeNull();
    }

    [Fact]
    public async Task ResetPasswordAsync_StoresNewHashAndUnlocks()
    {
        var clock = TestData.Clock();
        var user = Store(User.Create("hr@salarynet.test", "old", UserRole.HR, null, clock));
        for (var i = 0; i < User.MaxFailedLogins; i++)
        {
            user.RegisterFailedLogin(clock);
        }

        await CreateSut().ResetPasswordAsync(user.Id, new ResetPasswordRequest("Fresh123"), CancellationToken.None);

        user.PasswordHash.Should().Be("hash:Fresh123");
        user.IsLockedOut(clock).Should().BeFalse();
    }
}
