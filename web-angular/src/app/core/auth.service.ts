import { computed, inject, Injectable } from '@angular/core';
import type { UserRole } from '@shared/api/types';
import { SALARYNET_API } from './api';
import { SessionStore } from './session.store';

export { SESSION_KEY } from './session.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(SALARYNET_API);
  private readonly store = inject(SessionStore);

  readonly session = this.store.session;
  readonly token = this.store.token;
  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isStaff = computed(() => this.user()?.role === 'Admin' || this.user()?.role === 'HR');
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');

  async login(email: string, password: string): Promise<void> {
    const response = await this.api.login(email, password);
    this.store.set({ token: response.accessToken, expiresAt: response.expiresAt, user: response.user });
  }

  logout(): void {
    this.store.set(null);
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.user();
    return !!user && roles.includes(user.role);
  }
}
