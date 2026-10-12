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
}
