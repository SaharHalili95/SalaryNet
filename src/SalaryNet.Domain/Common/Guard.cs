using System.Net.Mail;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.Domain.Common;

internal static class Guard
{
    public static string RequiredText(string? value, string paramName, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainValidationException(paramName, $"{paramName} is required.");
        }

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
        {
            throw new DomainValidationException(paramName, $"{paramName} must not exceed {maxLength} characters.");
        }

        return trimmed;
    }

    public static string OptionalText(string? value, string paramName, int maxLength)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        if (trimmed.Length > maxLength)
        {
            throw new DomainValidationException(paramName, $"{paramName} must not exceed {maxLength} characters.");
        }

        return trimmed;
    }

    public static string Email(string? value, string paramName, int maxLength)
    {
        var normalized = RequiredText(value, paramName, maxLength).ToLowerInvariant();

        // MailAddress also accepts display-name forms such as "John <a@b.com>"; require the bare address.
        if (!MailAddress.TryCreate(normalized, out var address) || address.Address != normalized)
        {
            throw new DomainValidationException(paramName, $"{paramName} is not a valid email address.");
        }

        return normalized;
    }

    public static void NotEmpty(Guid value, string paramName)
    {
        if (value == Guid.Empty)
        {
            throw new DomainValidationException(paramName, $"{paramName} must not be empty.");
        }
    }

    public static void Positive(decimal value, string paramName)
    {
        if (value <= 0)
        {
            throw new DomainValidationException(paramName, $"{paramName} must be greater than zero.");
        }
    }

    public static void NotNegative(decimal value, string paramName)
    {
        if (value < 0)
        {
            throw new DomainValidationException(paramName, $"{paramName} must not be negative.");
        }
    }

    public static void Defined<TEnum>(TEnum value, string paramName)
        where TEnum : struct, Enum
    {
        if (!Enum.IsDefined(value))
        {
            throw new DomainValidationException(paramName, $"{paramName} has an unsupported value '{value}'.");
        }
    }

    public static void Utc(DateTime value, string paramName)
    {
        if (value.Kind != DateTimeKind.Utc)
        {
            throw new DomainValidationException(paramName, $"{paramName} must be expressed in UTC.");
        }
    }
}
