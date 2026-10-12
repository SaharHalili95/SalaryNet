using SalaryNet.Domain.Enums;

namespace SalaryNet.Domain.Services;

public interface IPayrollCalculator
{
    PayrollBreakdown Calculate(EmploymentType employmentType, decimal baseSalary, decimal bonus);
}
