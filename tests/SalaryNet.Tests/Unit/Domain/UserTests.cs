using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Tests.Unit.Domain;

public class UserTests
{
    [Fact]
    public void Create_EmployeeAccount_LinksEmployee()
    {
        var employeeId = Guid.NewGuid();

        var user = User.Create("Dana@SalaryNet.test", "hash", UserRole.Employee, employeeId, TestData.Clock());

        user.Email.Should().Be("dana@salarynet.test");
        user.Role.Should().Be(UserRole.Employee);
        user.EmployeeId.Should().Be(employeeId);
    }

    [Fact]
    public void Create_EmployeeAccountWithoutEmployee_Throws()
    {
        var act = () => User.Create("dana@salarynet.test", "hash", UserRole.Employee, null, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(User.EmployeeId));
    }

    [Theory]
    [InlineData(UserRole.Admin)]
    [InlineData(UserRole.HR)]
    public void Create_StaffAccountLinkedToEmployee_Throws(UserRole role)
    {
        var act = () => User.Create("hr@salarynet.test", "hash", role, Guid.NewGuid(), TestData.Clock());

        act.Should().Throw<DomainValidationException>();
    }

    [Fact]
    public void Create_WithBlankPasswordHash_Throws()
    {
        var act = () => User.Create("hr@salarynet.test", " ", UserRole.HR, null, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(User.PasswordHash));
    }

    [Fact]
    public void RegisterFailedLogin_FourTimes_DoesNotLock()
    {
        var clock = TestData.Clock();
        var user = NewHrUser(clock);

        for (var i = 0; i < User.MaxFailedLogins - 1; i++)
        {
            user.RegisterFailedLogin(clock);
        }

        user.IsLockedOut(clock).Should().BeFalse();
        user.FailedLoginCount.Should().Be(User.MaxFailedLogins - 1);
    }

    [Fact]
    public void RegisterFailedLogin_FifthTime_LocksForLockoutDuration()
    {
        var clock = TestData.Clock();
        var user = NewHrUser(clock);

        FailLoginRepeatedly(user, clock, User.MaxFailedLogins);

        user.IsLockedOut(clock).Should().BeTrue();
        user.LockoutEndsAt.Should().Be(TestData.Now.UtcDateTime.Add(User.LockoutDuration));

        clock.Advance(User.LockoutDuration);
        user.IsLockedOut(clock).Should().BeFalse();
    }

    [Fact]
    public void RegisterFailedLogin_WhileLocked_DoesNotExtendLockout()
    {
        var clock = TestData.Clock();
        var user = NewHrUser(clock);
        FailLoginRepeatedly(user, clock, User.MaxFailedLogins);
        var lockoutEnd = user.LockoutEndsAt;

        clock.Advance(TimeSpan.FromMinutes(10));
        FailLoginRepeatedly(user, clock, User.MaxFailedLogins);

        user.LockoutEndsAt.Should().Be(lockoutEnd);
    }

    [Fact]
    public void RegisterSuccessfulLogin_ResetsFailureCount()
    {
        var clock = TestData.Clock();
        var user = NewHrUser(clock);
        FailLoginRepeatedly(user, clock, User.MaxFailedLogins - 1);

        user.RegisterSuccessfulLogin();
        user.RegisterFailedLogin(clock);

        user.FailedLoginCount.Should().Be(1);
        user.IsLockedOut(clock).Should().BeFalse();
    }

    [Fact]
    public void Unlock_ReleasesActiveLockout()
    {
        var clock = TestData.Clock();
        var user = NewHrUser(clock);
        FailLoginRepeatedly(user, clock, User.MaxFailedLogins);

        user.Unlock();

        user.IsLockedOut(clock).Should().BeFalse();
        user.LockoutEndsAt.Should().BeNull();
    }

    [Fact]
    public void ResetPasswordHash_ReplacesHashAndReleasesLockout()
    {
        var clock = TestData.Clock();
        var user = NewHrUser(clock);
        FailLoginRepeatedly(user, clock, User.MaxFailedLogins);

        user.ResetPasswordHash("new-hash");

        user.PasswordHash.Should().Be("new-hash");
        user.IsLockedOut(clock).Should().BeFalse();
    }

    [Fact]
    public void Deactivate_ThenActivate_TogglesState()
    {
        var user = NewHrUser(TestData.Clock());

        user.Deactivate();
        user.IsActive.Should().BeFalse();
        user.Invoking(u => u.Deactivate()).Should().Throw<BusinessRuleViolationException>();

        user.Activate();
        user.IsActive.Should().BeTrue();
    }

    [Fact]
    public void ChangeRole_ToEmployeeWithoutEmployee_Throws()
    {
        var user = NewHrUser(TestData.Clock());

        var act = () => user.ChangeRole(UserRole.Employee, null);

        act.Should().Throw<DomainValidationException>();
        user.Role.Should().Be(UserRole.HR);
    }

    [Fact]
    public void ChangeRole_ToEmployeeWithEmployee_LinksEmployee()
    {
        var user = NewHrUser(TestData.Clock());
        var employeeId = Guid.NewGuid();

        user.ChangeRole(UserRole.Employee, employeeId);

        user.Role.Should().Be(UserRole.Employee);
        user.EmployeeId.Should().Be(employeeId);
    }

    private static User NewHrUser(TimeProvider clock) =>
        User.Create("hr@salarynet.test", "hash", UserRole.HR, null, clock);

    private static void FailLoginRepeatedly(User user, TimeProvider clock, int times)
    {
        for (var i = 0; i < times; i++)
        {
            user.RegisterFailedLogin(clock);
        }
    }
}
