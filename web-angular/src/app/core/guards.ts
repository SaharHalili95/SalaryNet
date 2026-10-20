import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import type { UserRole } from '@shared/api/types';
import { AuthService } from './auth.service';

const home = (auth: AuthService) => (auth.isStaff() ? '/dashboard' : '/me');

/** Signed-out visitors go to the sign-in page and come back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/** Pages for some roles only; anyone else lands on their own home page. Access is still enforced by the API. */
export const roleGuard =
  (roles: UserRole[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    return auth.hasRole(roles) || inject(Router).parseUrl(home(auth));
  };

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).parseUrl(home(auth));
};

/** Resolves the landing page only after sign-in, so staff are not sent to the employee page. */
export const homeRedirect: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).parseUrl(auth.isAuthenticated() ? home(auth) : '/login');
};
