import { inject, Pipe, type PipeTransform } from '@angular/core';
import { LocaleService } from './locale.service';

/** `{{ 'nav.payroll' | t }}` or `{{ 'employees.subtitle' | t: { count } }}`. Impure so it follows a language switch. */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
