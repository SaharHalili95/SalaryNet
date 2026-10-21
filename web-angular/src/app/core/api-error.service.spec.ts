import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { ApiError } from '@shared/api/errors';
import { ApiErrorService } from './api-error.service';
import { AuthService } from './auth.service';

function setup() {
  localStorage.clear();
  const logout = vi.fn();
  const open = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { logout, isAuthenticated: () => true } },
      { provide: MatSnackBar, useValue: { open } },
    ],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  return { errors: TestBed.inject(ApiErrorService), logout, open, navigate };
}

describe('ApiErrorService', () => {
  it('returns translated field errors for a 400 without a toast', () => {
    const { errors, open } = setup();
    const fields = errors.handle(new ApiError(400, 'Validation', undefined, { Email: ['Email already exists'] }));
    expect(fields).toEqual({ email: 'Email already exists' });
    expect(open).not.toHaveBeenCalled();
  });

  it('shows other errors as a toast', () => {
    const { errors, open } = setup();
    expect(errors.handle(new ApiError(409, 'Conflict', 'A payslip already exists for this period.'))).toEqual({});
    expect(open).toHaveBeenCalledOnce();
  });

  it('signs out once on 401, in demo and HTTP mode alike', () => {
    const { errors, logout, navigate } = setup();
    errors.handle(new ApiError(401, 'Unauthorized', 'Please sign in again.'));
    errors.handle(new ApiError(401, 'Unauthorized', 'Please sign in again.'));
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
