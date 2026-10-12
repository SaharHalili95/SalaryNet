namespace SalaryNet.Tests.Integration;

internal sealed record ProblemDetailsResponse(
    string? Type,
    string? Title,
    int Status,
    string? Detail,
    string? TraceId,
    Dictionary<string, string[]>? Errors);
