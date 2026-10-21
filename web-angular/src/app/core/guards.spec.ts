import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import type { UserRole } from '@shared/api/types';
import { AuthService } from './auth.service';
import { authGuard, homeRedirect, loginGuard, roleGuard } from './guards';

function setup(role: UserRole | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          isAuthenticated: () => role !== null,
          isStaff: () => role === 'Admin' || role === 'HR',
          hasRole: (roles: UserRole[]) => role !== null && roles.includes(role),
        },
      },
    ],
  });
  return TestBed.inject(Router);
}

const state = (url: string) => ({ url }) as RouterStateSnapshot;
const route = {} as ActivatedRouteSnapshot;
const run = (guard: typeof authGuard, url: string) => TestBed.runInInjectionContext(() => guard(route, state(url)));

describe('guards', () => {
  it('sends a signed-out visitor to login with a redirect back', () => {
    const router = setup(null);
    const result = run(authGuard, '/payroll') as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?redirect=%2Fpayroll');
  });

  it('lets a signed-in user through', () => {
    setup('Employee');
    expect(run(authGuard, '/payroll')).toBe(true);
  });

  it('sends an employee away from staff pages', () => {
    const router = setup('Employee');
    const result = run(roleGuard(['Admin', 'HR']), '/employees') as UrlTree;
    expect(router.serializeUrl(result)).toBe('/me');
  });

  it('sends a signed-in user from login to home', () => {
    const router = setup('HR');
    expect(router.serializeUrl(run(loginGuard, '/login') as UrlTree)).toBe('/dashboard');
  });

  it('picks the landing page by role', () => {
    const router = setup('Employee');
    expect(router.serializeUrl(run(homeRedirect, '/') as UrlTree)).toBe('/me');
  });
});
