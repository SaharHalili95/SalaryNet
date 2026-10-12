using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SalaryNet.Application.Common.Exceptions;
using SalaryNet.Domain.Exceptions;

namespace SalaryNet.API.Errors;

/// <summary>Translates every unhandled exception into an RFC 7807 problem response.</summary>
internal sealed partial class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var problem = exception switch
        {
            ValidationException ex => Validation(ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())),
            DomainValidationException ex => Validation(new Dictionary<string, string[]> { [ex.PropertyName] = [ex.Message] }),
            NotFoundException ex => Problem(StatusCodes.Status404NotFound, "Resource not found", ex.Message),
            ConflictException ex => Problem(StatusCodes.Status409Conflict, "Conflict", ex.Message),
            BusinessRuleViolationException ex => Problem(StatusCodes.Status422UnprocessableEntity, "Business rule violated", ex.Message),
            UnauthorizedException ex => Problem(StatusCodes.Status401Unauthorized, "Unauthorized", ex.Message),
            ForbiddenAccessException ex => Problem(StatusCodes.Status403Forbidden, "Forbidden", ex.Message),
            _ => null,
        };

        if (problem is null)
        {
            LogUnhandled(logger, exception, httpContext.Request.Method, httpContext.Request.Path);

            // Internal details never reach the client; the traceId links the response to the log entry.
            problem = Problem(StatusCodes.Status500InternalServerError, "An unexpected error occurred", detail: null);
        }

        httpContext.Response.StatusCode = problem.Status!.Value;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception,
        });
    }

    private static ProblemDetails Problem(int status, string title, string? detail) =>
        new() { Status = status, Title = title, Detail = detail };

    private static ValidationProblemDetails Validation(IDictionary<string, string[]> errors) =>
        new(errors) { Status = StatusCodes.Status400BadRequest, Title = "One or more validation errors occurred." };

    [LoggerMessage(Level = LogLevel.Error, Message = "Unhandled exception while processing {Method} {Path}")]
    private static partial void LogUnhandled(ILogger logger, Exception exception, string method, string path);
}
