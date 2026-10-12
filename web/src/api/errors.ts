/** Mirrors the RFC 7807 ProblemDetails body the API returns for every error. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail?: string,
    readonly errors: Record<string, string[]> = {},
  ) {
    super(detail ?? title)
    this.name = 'ApiError'
  }

  /** Validation messages keyed by camelCase field name, ready to show next to form inputs. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(this.errors).map(([key, messages]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        messages[0] ?? '',
      ]),
    )
  }
}

export const notFound = (what: string) => new ApiError(404, 'Resource not found', `${what} was not found.`)
export const conflict = (detail: string) => new ApiError(409, 'Conflict', detail)
export const forbidden = () => new ApiError(403, 'Forbidden', 'You do not have access to this resource.')
export const businessRule = (detail: string) => new ApiError(422, 'Business rule violated', detail)
export const validation = (errors: Record<string, string[]>) =>
  new ApiError(400, 'One or more validation errors occurred.', undefined, errors)
