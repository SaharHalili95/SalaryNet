import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ApiError } from '@shared/api/errors';
import { translateServerMessage } from '@shared/i18n/serverMessages';
import { AuthService } from './auth.service';
import { LocaleService } from './locale.service';

/** Shows any error as a toast and returns field errors so forms can highlight inputs (as useApiError in Vue). */
@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly i18n = inject(LocaleService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private signingOut = false;

  handle(error: unknown): Record<string, string> {
    if (!(error instanceof ApiError)) {
      this.toast(this.i18n.t('errors.unexpected'), String(error));
      return {};
    }
    // 401 from either the API or the in-browser demo engine: the session is no longer valid.
    if (error.status === 401) {
      this.signOut();
      return {};
    }
    const fields = Object.fromEntries(
      Object.entries(error.fieldErrors).map(([field, message]) => [field, this.translate(message) ?? message]),
    );
    if (Object.keys(fields).length === 0 || error.status !== 400) {
      this.toast(this.title(error), this.translate(error.detail));
    }
    return fields;
  }

  private signOut(): void {
    if (this.signingOut) return;
    this.signingOut = true;
    this.auth.logout();
    void this.router.navigate(['/login']).finally(() => (this.signingOut = false));
  }

  private title(error: ApiError): string {
    const key = `errors.${error.status}`;
    const text = this.i18n.t(key);
    return text === key ? error.title : text;
  }

  private translate(message?: string): string | undefined {
    return translateServerMessage(message, this.i18n.locale());
  }

  private toast(title: string, detail?: string): void {
    this.snackBar.open(detail ? `${title}: ${detail}` : title, '✕', {
      duration: 5000,
      direction: this.i18n.isRtl() ? 'rtl' : 'ltr',
    });
  }
}
