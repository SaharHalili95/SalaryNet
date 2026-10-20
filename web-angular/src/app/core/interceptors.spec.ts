import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@shared/api/errors';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from './session.store';
import { authInterceptor, problemDetailsInterceptor } from './interceptors';

function setup(token: string | null) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor, problemDetailsInterceptor])),
      provideHttpClientTesting(),
      { provide: SessionStore, useValue: { token: () => token } },
    ],
  });
  return { http: TestBed.inject(HttpClient), backend: TestBed.inject(HttpTestingController) };
}

describe('interceptors', () => {
  it('adds the bearer token when signed in', () => {
    const { http, backend } = setup('abc');
    http.get('/api/auth/me').subscribe();
    expect(backend.expectOne('/api/auth/me').request.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('sends no Authorization header when signed out', () => {
    const { http, backend } = setup(null);
    http.get('/api/auth/me').subscribe();
    expect(backend.expectOne('/api/auth/me').request.headers.has('Authorization')).toBe(false);
  });

  it('turns ProblemDetails into an ApiError with field errors', async () => {
    const { http, backend } = setup('abc');
    const call = firstValueFrom(http.post('/api/employees', {}));
    backend.expectOne('/api/employees').flush(
      { title: 'Validation', errors: { FirstName: ['Required'] } },
      { status: 400, statusText: 'Bad Request' },
    );
    const error = await call.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors['firstName']).toBe('Required');
  });

  it('keeps the HTTP status text when the body is not ProblemDetails', async () => {
    const { http, backend } = setup(null);
    const call = firstValueFrom(http.get('/api/dashboard/summary'));
    backend.expectOne('/api/dashboard/summary').flush('boom', { status: 502, statusText: 'Bad Gateway' });
    const error = (await call.catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(502);
    expect(error.title).toBe('Bad Gateway');
  });
});
