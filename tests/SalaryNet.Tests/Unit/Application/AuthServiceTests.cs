using FluentValidation;
using Microsoft.Extensions.Time.Testing;
using Moq;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Auth;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Tests.Unit.Domain;

namespace SalaryNet.Tests.Unit.Application;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IEmployeeRepository> _employees = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IAccessTokenGenerator> _tokens = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly FakeTimeProvider _clock = TestData.Clock();

    public AuthServiceTests()
    {
        _tokens.Setup(t => t.Generate(It.IsAny<User>())).Returns(new AccessToken("jwt", TestData.Now.UtcDateTime.AddHours(1)));
    }

    private AuthService CreateSut(ICurrentUser? user = null) =>
        new(_users.Object, _employees.Object, _hasher.Object, _tokens.Object, _unitOfWork.Object, user ?? FakeCurrentUser.Hr(), _clock);

    private User GivenUser(string password = "secret")
    {
        var user = User.Create("hr@salarynet.test", "stored-hash", UserRole.HR, null, _clock);
        _users.Setup(u => u.GetByEmailAsync("hr@salarynet.test", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _users.Setup(u => u.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("stored-hash", It.IsAny<string>())).Returns<string, string>((_, p) => p == password);
        return user;
    }

    [Fact]
    public async Task LoginAsync_WithCorrectPassword_ReturnsToken()
    {
        GivenUser();

        var result = await CreateSut().LoginAsync(new LoginRequest(" HR@salarynet.test ", "secret"), CancellationToken.None);

        result.AccessToken.Should().Be("jwt");
        result.User.Role.Should().Be(UserRole.HR);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_CountsFailureAndThrowsUnauthorized()
    {
        var user = GivenUser();

        var act = () => CreateSut().LoginAsync(new LoginRequest("hr@salarynet.test", "wrong"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>();
        user.FailedLoginCount.Should().Be(1);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _tokens.Verify(t => t.Generate(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_FiveWrongPasswords_LockAccountEvenForCorrectPassword()
    {
        var user = GivenUser();
        var sut = CreateSut();

        for (var i = 0; i < User.MaxFailedLogins; i++)
        {
            await sut.Invoking(s => s.LoginAsync(new LoginRequest("hr@salarynet.test", "wrong"), CancellationToken.None))
                .Should().ThrowAsync<UnauthorizedException>();
        }

        user.IsLockedOut(_clock).Should().BeTrue();
        await sut.Invoking(s => s.LoginAsync(new LoginRequest("hr@salarynet.test", "secret"), CancellationToken.None))
            .Should().ThrowAsync<UnauthorizedException>();

        _clock.Advance(User.LockoutDuration);
        (await sut.LoginAsync(new LoginRequest("hr@salarynet.test", "secret"), CancellationToken.None)).AccessToken.Should().Be("jwt");
    }

    [Fact]
    public async Task LoginAsync_InactiveAccount_ThrowsUnauthorizedWithCorrectPassword()
    {
        GivenUser().Deactivate();

        var act = () => CreateSut().LoginAsync(new LoginRequest("hr@salarynet.test", "secret"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task LoginAsync_SuccessAfterFailures_ResetsCounter()
    {
        var user = GivenUser();
        var sut = CreateSut();
        await sut.Invoking(s => s.LoginAsync(new LoginRequest("hr@salarynet.test", "wrong"), CancellationToken.None))
            .Should().ThrowAsync<UnauthorizedException>();

        await sut.LoginAsync(new LoginRequest("hr@salarynet.test", "secret"), CancellationToken.None);

        user.FailedLoginCount.Should().Be(0);
    }

    [Fact]
    public async Task LoginAsync_WithUnknownEmail_StillVerifiesAHashToAvoidTimingLeaks()
    {
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("dummy-hash");

        var act = () => CreateSut().LoginAsync(new LoginRequest("nobody@salarynet.test", "pw"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>();
        _hasher.Verify(h => h.Verify("dummy-hash", "pw"), Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_WithWrongCurrentPassword_ThrowsValidation()
    {
        var user = GivenUser();
        var sut = CreateSut(new FakeCurrentUserWithId(user.Id));

        var act = () => sut.ChangePasswordAsync(new ChangePasswordRequest("wrong", "NewPass123"), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
        user.PasswordHash.Should().Be("stored-hash");
    }

    [Fact]
    public async Task ChangePasswordAsync_WithCorrectCurrentPassword_StoresNewHash()
    {
        var user = GivenUser();
        _hasher.Setup(h => h.Hash("NewPass123")).Returns("new-hash");
        var sut = CreateSut(new FakeCurrentUserWithId(user.Id));

        await sut.ChangePasswordAsync(new ChangePasswordRequest("secret", "NewPass123"), CancellationToken.None);

        user.PasswordHash.Should().Be("new-hash");
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private sealed class FakeCurrentUserWithId(Guid userId) : ICurrentUser
    {
        public Guid UserId { get; } = userId;

        public UserRole Role => UserRole.HR;

        public Guid? EmployeeId => null;
    }
}
