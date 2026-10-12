using FluentValidation;
using Moq;
using SalaryNet.Application.Abstractions.Persistence;
using SalaryNet.Application.Abstractions.Security;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Application.Employees;
using SalaryNet.Domain.Entities;
using SalaryNet.Domain.Enums;
using SalaryNet.Tests.Unit.Domain;

namespace SalaryNet.Tests.Unit.Application;

public class EmployeeServiceTests
{
    private readonly Mock<IEmployeeRepository> _employees = new();
    private readonly Mock<IDepartmentRepository> _departments = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly SaveEmployeeRequest ValidRequest =
        new("Dana", "Levi", "Dana.Levi@salarynet.test", Guid.NewGuid(), 15_000m, EmploymentType.FullTime);

    private EmployeeService CreateSut(ICurrentUser? user = null) =>
        new(_employees.Object, _departments.Object, _unitOfWork.Object, user ?? FakeCurrentUser.Hr(), TestData.Clock());

    [Fact]
    public async Task CreateAsync_WithValidRequest_AddsAndSaves()
    {
        Employee? added = null;
        _departments.Setup(d => d.ExistsAsync(ValidRequest.DepartmentId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _employees.Setup(e => e.Add(It.IsAny<Employee>())).Callback<Employee>(e => added = e);
        _employees.Setup(e => e.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(() => added);

        var result = await CreateSut().CreateAsync(ValidRequest, CancellationToken.None);

        result.Email.Should().Be("dana.levi@salarynet.test");
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateEmail_ChecksNormalizedEmailAndThrowsConflict()
    {
        _departments.Setup(d => d.ExistsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _employees.Setup(e => e.EmailExistsAsync("dana.levi@salarynet.test", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var act = () => CreateSut().CreateAsync(ValidRequest, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithUnknownDepartment_ThrowsValidationException()
    {
        _departments.Setup(d => d.ExistsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var act = () => CreateSut().CreateAsync(ValidRequest, CancellationToken.None);

        (await act.Should().ThrowAsync<ValidationException>())
            .Which.Errors.Should().ContainSingle(e => e.PropertyName == nameof(SaveEmployeeRequest.DepartmentId));
    }

    [Fact]
    public async Task GetByIdAsync_AsEmployeeForAnotherEmployee_ThrowsNotFoundWithoutQuerying()
    {
        var sut = CreateSut(FakeCurrentUser.EmployeeAccount(Guid.NewGuid()));

        var act = () => sut.GetByIdAsync(Guid.NewGuid(), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
        _employees.Verify(e => e.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetByIdAsync_AsEmployeeForSelf_ReturnsEmployee()
    {
        var employee = TestData.CreateEmployee();
        _employees.Setup(e => e.GetByIdAsync(employee.Id, It.IsAny<CancellationToken>())).ReturnsAsync(employee);

        var result = await CreateSut(FakeCurrentUser.EmployeeAccount(employee.Id)).GetByIdAsync(employee.Id, CancellationToken.None);

        result.Id.Should().Be(employee.Id);
    }

    [Fact]
    public async Task SetActiveAsync_False_DeactivatesAndSaves()
    {
        var employee = TestData.CreateEmployee();
        _employees.Setup(e => e.GetByIdAsync(employee.Id, It.IsAny<CancellationToken>())).ReturnsAsync(employee);

        await CreateSut().SetActiveAsync(employee.Id, isActive: false, CancellationToken.None);

        employee.IsActive.Should().BeFalse();
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
