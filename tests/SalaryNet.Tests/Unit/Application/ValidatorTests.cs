using SalaryNet.Application.Auth;
using SalaryNet.Application.Employees;
using SalaryNet.Application.Users;
using SalaryNet.Application.Payroll;
using SalaryNet.Domain.Enums;

namespace SalaryNet.Tests.Unit.Application;

public class ValidatorTests
{
    private static SaveEmployeeRequest Valid() =>
        new("Dana", "Levi", "dana@salarynet.test", Guid.NewGuid(), 15_000m, EmploymentType.FullTime);

    [Fact]
    public void SaveEmployeeRequest_Valid_Passes()
    {
        new SaveEmployeeRequestValidator().Validate(Valid()).IsValid.Should().BeTrue();
    }

    public static TheoryData<SaveEmployeeRequest, string> InvalidEmployees => new()
    {
        { Valid() with { FirstName = "" }, nameof(SaveEmployeeRequest.FirstName) },
        { Valid() with { LastName = new string('x', 101) }, nameof(SaveEmployeeRequest.LastName) },
        { Valid() with { Email = "not-an-email" }, nameof(SaveEmployeeRequest.Email) },
        { Valid() with { DepartmentId = Guid.Empty }, nameof(SaveEmployeeRequest.DepartmentId) },
        { Valid() with { BaseSalary = 0m }, nameof(SaveEmployeeRequest.BaseSalary) },
        { Valid() with { BaseSalary = 100.123m }, nameof(SaveEmployeeRequest.BaseSalary) },
        { Valid() with { BaseSalary = 2_000_000m }, nameof(SaveEmployeeRequest.BaseSalary) },
        { Valid() with { EmploymentType = (EmploymentType)42 }, nameof(SaveEmployeeRequest.EmploymentType) },
    };

    [Theory]
    [MemberData(nameof(InvalidEmployees))]
    public void SaveEmployeeRequest_Invalid_FailsOnExpectedProperty(SaveEmployeeRequest request, string property)
    {
        var result = new SaveEmployeeRequestValidator().Validate(request);

        result.Errors.Should().Contain(e => e.PropertyName == property);
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void EmployeeQuery_InvalidPaging_Fails(int page, int pageSize)
    {
        var result = new EmployeeQueryValidator().Validate(new EmployeeQuery { Page = page, PageSize = pageSize });

        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(2026, 0, 0)]
    [InlineData(2026, 13, 0)]
    [InlineData(1999, 5, 0)]
    [InlineData(2026, 5, -1)]
    public void GeneratePayrollRequest_Invalid_Fails(int year, int month, decimal bonus)
    {
        var result = new GeneratePayrollRequestValidator().Validate(new GeneratePayrollRequest(Guid.NewGuid(), year, month, bonus));

        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("Short1", false)]
    [InlineData("alllowercase1", false)]
    [InlineData("ALLUPPERCASE1", false)]
    [InlineData("NoDigitsHere", false)]
    [InlineData("Valid123", true)]
    public void ResetPasswordRequest_EnforcesPasswordPolicy(string password, bool expectedValid)
    {
        new ResetPasswordRequestValidator().Validate(new ResetPasswordRequest(password)).IsValid.Should().Be(expectedValid);
    }

    [Fact]
    public void ChangePasswordRequest_SameAsCurrent_Fails()
    {
        var result = new ChangePasswordRequestValidator().Validate(new ChangePasswordRequest("Valid123", "Valid123"));

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateUserRequest_EmployeeRoleWithoutEmployee_Fails()
    {
        var result = new CreateUserRequestValidator().Validate(new CreateUserRequest("a@salarynet.test", "Valid123", UserRole.Employee, null));

        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateUserRequest.EmployeeId));
    }
}
