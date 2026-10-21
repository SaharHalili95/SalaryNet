import { TestBed } from '@angular/core/testing';
import type { LoginResponse } from '@shared/api/types';
import { SALARYNET_API } from './api';
import { AuthService, SESSION_KEY } from './auth.service';

const hrUser = { id: 'u1', email: 'hr@salarynet.demo', displayName: 'Michal Barak', role: 'HR' as const, employeeId: null };
const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();

function setup(stored: string | null, login?: (email: string, password: string) => Promise<LoginResponse>) {
  localStorage.clear();
  if (stored !== null) localStorage.setItem(SESSION_KEY, stored);
  TestBed.configureTestingModule({ providers: [{ provide: SALARYNET_API, useValue: { login } }] });
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  it('reads an expired session as signed out', () => {
    const auth = setup(JSON.stringify({ token: 't', expiresAt: '2000-01-01T00:00:00Z', user: hrUser }));
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('reads malformed storage as signed out', () => {
    expect(setup('{not json').isAuthenticated()).toBe(false);
  });

  it('restores a valid session written by either app', () => {
    const auth = setup(JSON.stringify({ token: 't', expiresAt: inOneHour(), user: hrUser }));
    expect(auth.user()?.email).toBe('hr@salarynet.demo');
    expect(auth.isStaff()).toBe(true);
  });

  it('stores the session after login and clears it on logout', async () => {
    const auth = setup(null, async () => ({ accessToken: 'demo.u1', expiresAt: inOneHour(), user: hrUser }));
    await auth.login('hr@salarynet.demo', 'Demo123!');
    expect(auth.token()).toBe('demo.u1');
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!).token).toBe('demo.u1');
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('checks roles', () => {
    const auth = setup(JSON.stringify({ token: 't', expiresAt: inOneHour(), user: hrUser }));
    expect(auth.hasRole(['Admin'])).toBe(false);
    expect(auth.hasRole(['Admin', 'HR'])).toBe(true);
    expect(auth.isAdmin()).toBe(false);
  });
});
