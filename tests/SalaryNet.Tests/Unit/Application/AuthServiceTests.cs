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

    private AuthService CreateSut() =>
        new(_users.Object, _employees.Object, _hasher.Object, _tokens.Object, FakeCurrentUser.Hr());

    [Fact]
    public async Task LoginAsync_WithCorrectPassword_ReturnsToken()
    {
        var user = User.Create("hr@salarynet.test", "stored-hash", UserRole.HR, null, TestData.Clock());
        _users.Setup(u => u.GetByEmailAsync("hr@salarynet.test", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("stored-hash", "secret")).Returns(true);
        _tokens.Setup(t => t.Generate(user)).Returns(new AccessToken("jwt", TestData.Now.UtcDateTime.AddHours(1)));

        var result = await CreateSut().LoginAsync(new LoginRequest(" HR@salarynet.test ", "secret"), CancellationToken.None);

        result.AccessToken.Should().Be("jwt");
        result.User.Role.Should().Be(UserRole.HR);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsUnauthorized()
    {
        var user = User.Create("hr@salarynet.test", "stored-hash", UserRole.HR, null, TestData.Clock());
        _users.Setup(u => u.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        var act = () => CreateSut().LoginAsync(new LoginRequest("hr@salarynet.test", "wrong"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>();
        _tokens.Verify(t => t.Generate(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_WithUnknownEmail_StillVerifiesAHashToAvoidTimingLeaks()
    {
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("dummy-hash");

        var act = () => CreateSut().LoginAsync(new LoginRequest("nobody@salarynet.test", "pw"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>();
        _hasher.Verify(h => h.Verify("dummy-hash", "pw"), Times.Once);
    }
}
