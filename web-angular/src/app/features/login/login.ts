import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD, DEMO_PASSWORD } from '@shared/api/demo/demoData';
import { ApiError } from '@shared/api/errors';
import { translateServerMessage } from '@shared/i18n/serverMessages';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';

interface DemoAccount {
  role: 'Admin' | 'HR' | 'Employee';
  icon: string;
  email: string;
  password: string;
  hint: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly i18n = inject(LocaleService);

  protected readonly vueUrl = environment.vueUrl;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly accounts: DemoAccount[] = [
    { role: 'Admin', icon: 'shield', email: DEMO_ACCOUNTS.admin, password: DEMO_ADMIN_PASSWORD, hint: 'login.adminHint' },
    { role: 'HR', icon: 'work', email: DEMO_ACCOUNTS.hr, password: DEMO_PASSWORD, hint: 'login.hrHint' },
    { role: 'Employee', icon: 'person', email: DEMO_ACCOUNTS.employee, password: DEMO_PASSWORD, hint: 'login.employeeHint' },
  ];

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected fill(account: DemoAccount): void {
    this.form.setValue({ email: account.email, password: account.password });
    this.error.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    void this.signIn(email, password);
  }

  protected async signIn(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(email, password);
      await this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirect') ?? '/');
    } catch (e) {
      this.error.set(
        e instanceof ApiError
          ? (translateServerMessage(e.detail, this.i18n.locale()) ?? e.title)
          : this.i18n.t('login.unreachable'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected async copy(text: string, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      this.snackBar.open(`${this.i18n.t('login.copied')}: ${text}`, undefined, { duration: 2000 });
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the value is visible on screen anyway.
    }
  }
}
