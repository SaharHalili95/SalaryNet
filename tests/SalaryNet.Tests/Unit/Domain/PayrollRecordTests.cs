using Moq;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;
using SalaryNet.Domain.Services;

namespace SalaryNet.Tests.Unit.Domain;

public class PayrollRecordTests
{
    private readonly Mock<IPayrollCalculator> _calculator = new();

    public PayrollRecordTests()
    {
        _calculator
            .Setup(c => c.Calculate(It.IsAny<EmploymentType>(), It.IsAny<decimal>(), It.IsAny<decimal>()))
            .Returns(new PayrollBreakdown(BaseSalary: 10_000m, Bonus: 500m, GrossSalary: 10_500m, IncomeTax: 1_200m, SocialSecurity: 600m));
    }

    [Fact]
    public void Generate_CopiesCalculatorBreakdown()
    {
        var employee = TestData.CreateEmployee(baseSalary: 10_000m, employmentType: EmploymentType.PartTime);

        var record = PayrollRecord.Generate(employee, 2026, 5, 500m, _calculator.Object, TestData.Clock());

        record.EmployeeId.Should().Be(employee.Id);
        record.Year.Should().Be(2026);
        record.Month.Should().Be(5);
        record.GrossSalary.Should().Be(10_500m);
        record.Bonus.Should().Be(500m);
        record.IncomeTax.Should().Be(1_200m);
        record.SocialSecurity.Should().Be(600m);
        record.Deductions.Should().Be(1_800m);
        record.NetSalary.Should().Be(8_700m);
        record.GeneratedAt.Should().Be(TestData.Now.UtcDateTime);
        _calculator.Verify(c => c.Calculate(EmploymentType.PartTime, 10_000m, 500m), Times.Once);
    }

    [Fact]
    public void Generate_ForCurrentMonth_IsAllowed()
    {
        var record = PayrollRecord.Generate(TestData.CreateEmployee(), 2026, 6, 0m, _calculator.Object, TestData.Clock());

        record.Month.Should().Be(6);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    public void Generate_WithInvalidMonth_Throws(int month)
    {
        var act = () => PayrollRecord.Generate(TestData.CreateEmployee(), 2026, month, 0m, _calculator.Object, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(PayrollRecord.Month));
    }

    [Theory]
    [InlineData(PayrollRecord.MinYear - 1)]
    [InlineData(PayrollRecord.MaxYear + 1)]
    public void Generate_WithOutOfRangeYear_Throws(int year)
    {
        var act = () => PayrollRecord.Generate(TestData.CreateEmployee(), year, 1, 0m, _calculator.Object, TestData.Clock());

        act.Should().Throw<DomainValidationException>()
            .Which.PropertyName.Should().Be(nameof(PayrollRecord.Year));
    }

    [Fact]
    public void Generate_ForFuturePeriod_Throws()
    {
        var act = () => PayrollRecord.Generate(TestData.CreateEmployee(), 2026, 7, 0m, _calculator.Object, TestData.Clock());

        act.Should().Throw<BusinessRuleViolationException>();
    }

    [Fact]
    public void Generate_ForInactiveEmployee_Throws()
    {
        var employee = TestData.CreateEmployee();
        employee.Deactivate();

        var act = () => PayrollRecord.Generate(employee, 2026, 5, 0m, _calculator.Object, TestData.Clock());

        act.Should().Throw<BusinessRuleViolationException>();
        _calculator.VerifyNoOtherCalls();
    }

    [Fact]
    public void Generate_WithRealCalculator_KeepsTotalsConsistent()
    {
        var employee = TestData.CreateEmployee(baseSalary: 10_000m);

        var record = PayrollRecord.Generate(employee, 2026, 5, 0m, new PayrollCalculator(), TestData.Clock());

        record.GrossSalary.Should().Be(10_000m);
        record.Deductions.Should().Be(1_682.10m);
        record.NetSalary.Should().Be(8_317.90m);
    }
}
