import { inject, Pipe, type PipeTransform } from '@angular/core';
import * as format from '@shared/format/format';
import { localizeName, localizeTerm } from '@shared/i18n/dataGlossary';
import { LocaleService } from './locale.service';

// The formatting itself lives in shared/format so both apps print money and dates identically.
// The pipes are impure because their output depends on the current language as well as the input.

@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);
  transform(value: number, compact = false): string {
    return compact ? format.formatMoneyCompact(value, this.i18n.locale()) : format.formatMoney(value, this.i18n.locale());
  }
}

@Pipe({ name: 'period', pure: false })
export class PeriodPipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);
  transform(year: number, month: number): string {
    return format.formatPeriod(year, month, this.i18n.locale());
  }
}

@Pipe({ name: 'shortDate', pure: false })
export class ShortDatePipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);
  transform(iso: string): string {
    return format.formatDate(iso, this.i18n.locale());
  }
}

@Pipe({ name: 'clock', pure: false })
export class ClockPipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);
  transform(iso: string): string {
    return format.formatTime(iso, this.i18n.locale());
  }
}

@Pipe({ name: 'hours', pure: false })
export class HoursPipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);
  transform(hours: number): string {
    return format.formatHours(hours, this.i18n.locale());
  }
}

/** Department and other demo-data names in the current language. */
@Pipe({ name: 'term', pure: false })
export class TermPipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);
  transform(text: string | null | undefined): string {
    return localizeTerm(text, this.i18n.locale());
  }
}

/** People's names from the demo data in the current language. */
@Pipe({ name: 'person', pure: false })
export class PersonPipe implements PipeTransform {
  private readonly i18n = inject(LocaleService);
  transform(name: string | null | undefined): string {
    return localizeName(name, this.i18n.locale());
  }
}
