using SalaryNet.Domain.Enums;
using SalaryNet.Domain.Exceptions;
using SalaryNet.Domain.Services;

namespace SalaryNet.Tests.Unit.Domain;

public class PayrollCalculatorTests
{
    private readonly PayrollCalculator _sut = new();

    // Expected values are worked out by hand from the brackets documented on PayrollCalculator.
    [Theory]
    [InlineData(5_000, 0, 500.00, 175.00)]
    [InlineData(7_010, 0, 701.00, 245.35)]
    [InlineData(10_000, 0, 1_119.60, 562.50)]
    [InlineData(8_000, 2_000, 1_119.60, 562.50)]
    [InlineData(60_000, 0, 19_039.10, 5_362.50)]
    [InlineData(10_000.05, 0, 1_119.61, 562.51)]
    public void Calculate_ForEmployee_AppliesProgressiveBrackets(
        decimal baseSalary, decimal bonus, decimal expectedIncomeTax, decimal expectedSocialSecurity)
    {
        var result = _sut.Calculate(EmploymentType.FullTime, baseSalary, bonus);

        result.GrossSalary.Should().Be(baseSalary + bonus);
        result.IncomeTax.Should().Be(expectedIncomeTax);
        result.SocialSecurity.Should().Be(expectedSocialSecurity);
        result.TotalDeductions.Should().Be(expectedIncomeTax + expectedSocialSecurity);
        result.NetSalary.Should().Be(result.GrossSalary - result.TotalDeductions);
    }

    [Fact]
    public void Calculate_ForPartTime_UsesSameRulesAsFullTime()
    {
        var partTime = _sut.Calculate(EmploymentType.PartTime, 6_000m, 0m);
        var fullTime = _sut.Calculate(EmploymentType.FullTime, 6_000m, 0m);

        partTime.Should().Be(fullTime);
    }

    [Fact]
    public void Calculate_ForContractor_WithholdsNothing()
    {
        var result = _sut.Calculate(EmploymentType.Contractor, 20_000m, 1_500m);

        result.GrossSalary.Should().Be(21_500m);
        result.TotalDeductions.Should().Be(0m);
        result.NetSalary.Should().Be(21_500m);
    }

    [Fact]
    public void Calculate_WithNegativeBonus_Throws()
    {
        var act = () => _sut.Calculate(EmploymentType.FullTime, 10_000m, -1m);

        act.Should().Throw<DomainValidationException>();
    }

    [Fact]
    public void Calculate_WithNonPositiveSalary_Throws()
    {
        var act = () => _sut.Calculate(EmploymentType.FullTime, 0m, 0m);

        act.Should().Throw<DomainValidationException>();
    }
}
