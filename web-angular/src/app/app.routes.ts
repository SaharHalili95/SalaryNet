import type { Routes } from '@angular/router';
import { authGuard, homeRedirect, loginGuard, roleGuard } from './core/guards';

const staff = roleGuard(['Admin', 'HR']);

// Feature routes are added to the shell's children as each page is built; each one is lazy-loaded.
export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [homeRedirect], children: [] },
  {
    path: 'login',
    title: 'login.title',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: 'me',
        title: 'nav.myOverview',
        canActivate: [roleGuard(['Employee'])],
        loadComponent: () => import('./features/me/me').then((m) => m.Me),
      },
      {
        path: 'dashboard',
        title: 'nav.dashboard',
        canActivate: [staff],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'employees',
        title: 'nav.employees',
        canActivate: [staff],
        loadComponent: () => import('./features/employees/employees').then((m) => m.Employees),
      },
      {
        path: 'payroll',
        title: 'nav.payroll',
        loadComponent: () => import('./features/payroll/payroll').then((m) => m.Payroll),
      },
      {
        path: 'attendance',
        title: 'nav.attendance',
        loadComponent: () => import('./features/attendance/attendance').then((m) => m.Attendance),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
