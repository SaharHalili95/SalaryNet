using SalaryNet.Domain.Enums;

namespace SalaryNet.Application.Auth;

public sealed record LoginRequest(string Email, string Password);

public sealed record LoginResponse(string AccessToken, DateTime ExpiresAt, UserDto User);

public sealed record UserDto(Guid Id, string Email, string DisplayName, UserRole Role, Guid? EmployeeId);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
