using FluentValidation;
using SalaryNet.Application.Common.Models;

namespace SalaryNet.Application.Common;

internal static class PageQueryValidator
{
    public static void AddPagingRules<T>(this AbstractValidator<T> validator)
        where T : PageQuery
    {
        validator.RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        validator.RuleFor(q => q.PageSize).InclusiveBetween(1, PageQuery.MaxPageSize);
    }
}
