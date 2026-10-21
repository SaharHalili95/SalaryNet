import { computed, Injectable, signal } from '@angular/core';
import type { User } from '@shared/api/types';

/** Same storage key and shape as the Vue app, so a visitor who switches versions stays signed in. */
export const SESSION_KEY = 'salarynet.session';

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as Session) : null;
    return session && new Date(session.expiresAt) > new Date() ? session : null;
  } catch {
    return null;
  }
}

/**
 * Holds the signed-in session and nothing else. It has no dependencies, so the API provider and the HTTP
 * interceptor can read the token without creating a cycle through AuthService.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly current = signal<Session | null>(readSession());

  readonly session = this.current.asReadonly();
  readonly token = computed(() => this.current()?.token ?? null);

  set(session: Session | null): void {
    this.current.set(session);
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage can be unavailable (private mode); the session then lasts for this tab.
    }
  }
}
