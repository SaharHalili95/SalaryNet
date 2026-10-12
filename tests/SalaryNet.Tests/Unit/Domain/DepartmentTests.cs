using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Tests.Unit.Domain;

public class DepartmentTests
{
    [Fact]
    public void Create_WithValidInput_SetsTrimmedValuesAndTimestamp()
    {
        var department = Department.Create("  Engineering ", " Builds things ", TestData.Clock());

        department.Id.Should().NotBeEmpty();
        department.Name.Should().Be("Engineering");
        department.Description.Should().Be("Builds things");
        department.CreatedAt.Should().Be(TestData.Now.UtcDateTime);
        department.Employees.Should().BeEmpty();
    }

    [Fact]
    public void Create_WithNullDescription_StoresEmptyString()
    {
        var department = Department.Create("Finance", null, TestData.Clock());

        department.Description.Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_Throws(string name)
    {
        var act = () => Department.Create(name, null, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(Department.Name));
    }

    [Fact]
    public void Create_WithTooLongName_Throws()
    {
        var act = () => Department.Create(new string('x', Department.NameMaxLength + 1), null, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(Department.Name));
    }

    [Fact]
    public void Update_ChangesNameAndDescription()
    {
        var department = Department.Create("HR", "People", TestData.Clock());

        department.Update("Human Resources", "People operations");

        department.Name.Should().Be("Human Resources");
        department.Description.Should().Be("People operations");
    }
}
