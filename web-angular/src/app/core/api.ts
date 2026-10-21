import { inject, InjectionToken } from '@angular/core';
import type { SalaryNetApi } from '@shared/api/client';
import { createDemoApi } from '@shared/api/demo/demoApi';
import { createDemoDatabase, type DemoDatabase } from '@shared/api/demo/demoData';
import { environment } from '../../environments/environment';
import { HttpSalaryNetApi } from './http-api';
import { SessionStore } from './session.store';

let database: DemoDatabase | undefined;
/** One in-memory demo company per page load, shared by the API and the hire/leave simulation. */
export const demoDatabase = () => (database ??= createDemoDatabase());

/**
 * The same contract the Vue app uses. In demo mode it runs the shared in-browser rules; otherwise it calls
 * the ASP.NET Core API through HttpClient. Components depend on this token, never on an implementation.
 */
export const SALARYNET_API = new InjectionToken<SalaryNetApi>('SalaryNetApi', {
  providedIn: 'root',
  factory: () => {
    if (!environment.demoMode) return inject(HttpSalaryNetApi);
    const session = inject(SessionStore);
    return createDemoApi(() => session.token(), demoDatabase());
  },
});
