using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SalaryNet.Application.Attendance;
using SalaryNet.Application.Auth;
using SalaryNet.Application.Dashboard;
using SalaryNet.Application.Departments;
using SalaryNet.Application.Employees;
using SalaryNet.Application.Payroll;
using SalaryNet.Application.Users;
using SalaryNet.Domain.Services;

namespace SalaryNet.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly, includeInternalTypes: true);

        services.AddSingleton<IPayrollCalculator, PayrollCalculator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IPayrollService, PayrollService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}
