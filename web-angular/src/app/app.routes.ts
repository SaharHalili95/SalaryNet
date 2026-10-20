import type { Routes } from '@angular/router';
import { authGuard, homeRedirect, loginGuard } from './core/guards';

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
    children: [],
  },
  { path: '**', redirectTo: '' },
];
