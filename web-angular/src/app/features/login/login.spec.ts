import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { ApiError } from '@shared/api/errors';
import { AuthService } from '../../core/auth.service';
import { Login } from './login';

async function setup(login: (email: string, password: string) => Promise<void>, redirect?: string) {
  localStorage.clear();
  TestBed.configureTestingModule({
    imports: [Login],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { login: vi.fn(login) } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(redirect ? { redirect } : {}) } },
      },
    ],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Login);
  fixture.detectChanges();
  const auth = TestBed.inject(AuthService) as unknown as { login: ReturnType<typeof vi.fn> };
  return { fixture, el: fixture.nativeElement as HTMLElement, auth, navigate };
}

const type = (el: HTMLElement, selector: string, value: string) => {
  const input = el.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('Login', () => {
  it('signs in as HR with one tap on the demo card', async () => {
    const { el, auth, fixture } = await setup(async () => undefined);
    el.querySelectorAll<HTMLButtonElement>('.demo-account')[1]!.click();
    await fixture.whenStable();
    expect(auth.login).toHaveBeenCalledWith('hr@salarynet.demo', 'Demo123!');
  });

  it('does not submit an empty form and marks the fields', async () => {
    const { el, auth, fixture } = await setup(async () => undefined);
    el.querySelector<HTMLFormElement>('form.card')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(auth.login).not.toHaveBeenCalled();
    // Material omits aria-invalid on empty required fields by design; the field itself shows the error state.
    expect(el.querySelectorAll('mat-form-field.mat-form-field-invalid')).toHaveLength(2);
  });

  it('shows the translated server message and the lockout hint when sign-in fails', async () => {
    const { el, fixture } = await setup(async () => {
      throw new ApiError(401, 'Unauthorized', 'Invalid email or password.');
    });
    type(el, '#email', 'hr@salarynet.demo');
    type(el, '#password', 'wrong');
    el.querySelector<HTMLFormElement>('form.card')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    const error = el.querySelector('.form-error')!.textContent!;
    expect(error).toContain('Invalid email or password.');
    expect(error).toContain('5 failed attempts');
  });

  it('fills the form from a credentials row', async () => {
    const { el, fixture } = await setup(async () => undefined);
    el.querySelectorAll<HTMLElement>('.credentials tbody tr')[2]!.click();
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('#email')!.value).toBe('noa.cohen@salarynet.demo');
    expect(el.querySelector<HTMLInputElement>('#password')!.value).toBe('Demo123!');
  });

  it('returns to the page the visitor came from', async () => {
    const { el, fixture, navigate } = await setup(async () => undefined, '/payroll');
    el.querySelectorAll<HTMLButtonElement>('.demo-account')[2]!.click();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith('/payroll');
  });

  it('toggles password visibility', async () => {
    const { el, fixture } = await setup(async () => undefined);
    const password = el.querySelector<HTMLInputElement>('#password')!;
    expect(password.type).toBe('password');
    el.querySelector<HTMLButtonElement>('.password-toggle')!.click();
    fixture.detectChanges();
    expect(password.type).toBe('text');
  });
});
