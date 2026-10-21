import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { User, UserRole } from '@shared/api/types';
import { AuthService } from '../core/auth.service';
import { Shell } from './shell';

@Component({ template: '' })
class Blank {}

async function setup(role: UserRole) {
  localStorage.clear();
  const user = signal<User>({ id: 'u', email: 'x@salarynet.demo', displayName: 'Noa Cohen', role, employeeId: null });
  const logout = vi.fn();
  TestBed.configureTestingModule({
    imports: [Shell],
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      {
        provide: AuthService,
        useValue: {
          user,
          isAuthenticated: () => true,
          isStaff: () => role !== 'Employee',
          hasRole: (roles: UserRole[]) => roles.includes(role),
          logout,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement, logout };
}

const hrefs = (el: HTMLElement) => [...el.querySelectorAll('.sidebar nav a')].map((a) => a.getAttribute('href'));

describe('Shell', () => {
  afterEach(() => document.body.classList.remove('menu-open'));

  it('lists only the Phase 1 staff pages for HR', async () => {
    const { el } = await setup('HR');
    expect(hrefs(el)).toEqual(['/dashboard', '/employees', '/payroll', '/attendance']);
  });

  it('lists the employee pages for an employee', async () => {
    const { el } = await setup('Employee');
    expect(hrefs(el)).toEqual(['/me', '/payroll', '/attendance']);
  });

  it('opens the drawer, locks page scroll, and closes on navigation', async () => {
    const { fixture, el } = await setup('HR');
    el.querySelector<HTMLButtonElement>('.menu-toggle')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.sidebar.open')).not.toBeNull();
    expect(document.body.classList.contains('menu-open')).toBe(true);

    await TestBed.inject(Router).navigateByUrl('/payroll');
    fixture.detectChanges();
    expect(el.querySelector('.sidebar.open')).toBeNull();
    expect(document.body.classList.contains('menu-open')).toBe(false);
  });

  it('closes the drawer when the backdrop is tapped', async () => {
    const { fixture, el } = await setup('HR');
    el.querySelector<HTMLButtonElement>('.menu-toggle')!.click();
    fixture.detectChanges();
    el.querySelector<HTMLElement>('.backdrop')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.sidebar.open')).toBeNull();
  });

  it('hides the Vue link when no Vue URL is configured', async () => {
    const { el } = await setup('HR');
    expect(el.querySelector('.version-link')).toBeNull();
  });

  it('signs out from the topbar', async () => {
    const { el, logout } = await setup('HR');
    el.querySelector<HTMLButtonElement>('.topbar [aria-label="Sign out"]')!.click();
    expect(logout).toHaveBeenCalled();
  });
});
