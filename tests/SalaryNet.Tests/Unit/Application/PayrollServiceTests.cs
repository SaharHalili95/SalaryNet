using Moq;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Application.Common.Models;
using SalaryNet.Application.Payroll;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Services;
using SalaryNet.Tests.Unit.Domain;

namespace SalaryNet.Tests.Unit.Application;

public class PayrollServiceTests
{
    private readonly Mock<IPayrollRecordRepository> _payroll = new();
    private readonly Mock<IEmployeeRepository> _employees = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    public PayrollServiceTests()
    {
        _payroll
            .Setup(p => p.SearchAsync(It.IsAny<PayrollQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<PayrollRecord>([], 1, 20, 0));
    }

    private PayrollService CreateSut(ICurrentUser? user = null) =>
        new(_payroll.Object, _employees.Object, new PayrollCalculator(), _unitOfWork.Object, user ?? FakeCurrentUser.Hr(), TestData.Clock());

    [Fact]
    public async Task SearchAsync_AsEmployee_ForcesOwnEmployeeIdEvenWhenAnotherIsRequested()
    {
        var ownId = Guid.NewGuid();
        var sut = CreateSut(FakeCurrentUser.EmployeeAccount(ownId));

        await sut.SearchAsync(new PayrollQuery { EmployeeId = Guid.NewGuid() }, CancellationToken.None);

        _payroll.Verify(p => p.SearchAsync(It.Is<PayrollQuery>(q => q.EmployeeId == ownId), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task SearchAsync_AsStaff_KeepsRequestedFilter()
    {
        var requested = Guid.NewGuid();

        await CreateSut().SearchAsync(new PayrollQuery { EmployeeId = requested }, CancellationToken.None);

        _payroll.Verify(p => p.SearchAsync(It.Is<PayrollQuery>(q => q.EmployeeId == requested), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task GetByIdAsync_AsEmployeeForOthersPayslip_ThrowsNotFound()
    {
        var other = TestData.CreateEmployee();
        var record = PayrollRecord.Generate(other, 2026, 5, 0m, new PayrollCalculator(), TestData.Clock());
        _payroll.Setup(p => p.GetByIdAsync(record.Id, It.IsAny<CancellationToken>())).ReturnsAsync(record);

        var act = () => CreateSut(FakeCurrentUser.EmployeeAccount(Guid.NewGuid())).GetByIdAsync(record.Id, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GenerateAsync_WhenPeriodAlreadyExists_ThrowsConflict()
    {
        var employee = TestData.CreateEmployee();
        _employees.Setup(e => e.GetByIdAsync(employee.Id, It.IsAny<CancellationToken>())).ReturnsAsync(employee);
        _payroll.Setup(p => p.ExistsAsync(employee.Id, 2026, 5, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var act = () => CreateSut().GenerateAsync(new GeneratePayrollRequest(employee.Id, 2026, 5, 0m), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        _payroll.Verify(p => p.Add(It.IsAny<PayrollRecord>()), Times.Never);
    }

    [Fact]
    public async Task GenerateMonthAsync_SkipsEmployeesThatAlreadyHavePayroll()
    {
        var paid = TestData.CreateEmployee();
        var unpaid = TestData.CreateEmployee();
        _employees.Setup(e => e.ListActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync([paid, unpaid]);
        _payroll.Setup(p => p.GetEmployeeIdsWithPayrollAsync(2026, 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid> { paid.Id });

        var result = await CreateSut().GenerateMonthAsync(new GenerateMonthlyPayrollRequest(2026, 5), CancellationToken.None);

        result.Should().Be(new MonthlyPayrollResult(2026, 5, Generated: 1, Skipped: 1));
        _payroll.Verify(p => p.Add(It.Is<PayrollRecord>(r => r.EmployeeId == unpaid.Id)), Times.Once);
        _payroll.Verify(p => p.Add(It.Is<PayrollRecord>(r => r.EmployeeId == paid.Id)), Times.Never);
    }
}
