using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Tests.Unit.Domain;

public class EmployeeTests
{
    [Fact]
    public void Create_WithValidInput_IsActiveAndNormalizesEmail()
    {
        var departmentId = Guid.NewGuid();

        var employee = Employee.Create(
            " Dana ", " Levi ", "  Dana.Levi@SalaryNet.TEST ", departmentId, 12_500m, EmploymentType.PartTime, TestData.Clock());

        employee.Id.Should().NotBeEmpty();
        employee.FirstName.Should().Be("Dana");
        employee.LastName.Should().Be("Levi");
        employee.Email.Should().Be("dana.levi@salarynet.test");
        employee.DepartmentId.Should().Be(departmentId);
        employee.BaseSalary.Should().Be(12_500m);
        employee.EmploymentType.Should().Be(EmploymentType.PartTime);
        employee.IsActive.Should().BeTrue();
        employee.CreatedAt.Should().Be(TestData.Now.UtcDateTime);
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("a@")]
    [InlineData("Dana <dana@salarynet.test>")]
    public void Create_WithInvalidEmail_Throws(string email)
    {
        var act = () => Employee.Create("Dana", "Levi", email, Guid.NewGuid(), 10_000m, EmploymentType.FullTime, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(Employee.Email));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Create_WithNonPositiveSalary_Throws(decimal salary)
    {
        var act = () => TestData.CreateEmployee(baseSalary: salary);

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(Employee.BaseSalary));
    }

    [Fact]
    public void Create_WithEmptyDepartment_Throws()
    {
        var act = () => Employee.Create("Dana", "Levi", "d@salarynet.test", Guid.Empty, 10_000m, EmploymentType.FullTime, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(Employee.DepartmentId));
    }

    [Fact]
    public void Create_WithUndefinedEmploymentType_Throws()
    {
        var act = () => TestData.CreateEmployee(employmentType: (EmploymentType)99);

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(Employee.EmploymentType));
    }

    [Fact]
    public void UpdatePersonalDetails_ReplacesValues()
    {
        var employee = TestData.CreateEmployee();

        employee.UpdatePersonalDetails("Noa", "Cohen", "NOA@salarynet.test");

        employee.FirstName.Should().Be("Noa");
        employee.LastName.Should().Be("Cohen");
        employee.Email.Should().Be("noa@salarynet.test");
    }

    [Fact]
    public void ChangeEmploymentTerms_UpdatesSalaryAndType()
    {
        var employee = TestData.CreateEmployee();

        employee.ChangeEmploymentTerms(15_000m, EmploymentType.Contractor);

        employee.BaseSalary.Should().Be(15_000m);
        employee.EmploymentType.Should().Be(EmploymentType.Contractor);
    }

    [Fact]
    public void TransferTo_ChangesDepartment()
    {
        var employee = TestData.CreateEmployee();
        var target = Guid.NewGuid();

        employee.TransferTo(target);

        employee.DepartmentId.Should().Be(target);
    }

    [Fact]
    public void Deactivate_ThenActivate_TogglesState()
    {
        var employee = TestData.CreateEmployee();

        employee.Deactivate();
        employee.IsActive.Should().BeFalse();

        employee.Activate();
        employee.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Deactivate_WhenAlreadyInactive_Throws()
    {
        var employee = TestData.CreateEmployee();
        employee.Deactivate();

        var act = employee.Deactivate;

        act.Should().Throw<BusinessRuleViolationException>();
    }

    [Fact]
    public void Activate_WhenAlreadyActive_Throws()
    {
        var employee = TestData.CreateEmployee();

        var act = employee.Activate;

        act.Should().Throw<BusinessRuleViolationException>();
    }
}
