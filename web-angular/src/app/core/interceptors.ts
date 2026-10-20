import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiError } from '@shared/api/errors';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from './session.store';

/** Attaches the JWT to every API call made while signed in. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessionStore).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Turns RFC 7807 ProblemDetails responses into the shared ApiError, the same error the demo engine throws. */
export const problemDetailsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const body = (typeof error.error === 'object' && error.error !== null ? error.error : {}) as ProblemDetails;
      return throwError(() => new ApiError(error.status, body.title ?? error.statusText, body.detail, body.errors ?? {}));
    }),
  );
