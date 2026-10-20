import { TestBed } from '@angular/core/testing';
import { HoursPipe, MoneyPipe, PeriodPipe, TermPipe } from './format.pipes';
import { LocaleService, provideLocalization } from './locale.service';
import { TranslatePipe } from './translate.pipe';

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideLocalization(), TranslatePipe, MoneyPipe, HoursPipe, PeriodPipe, TermPipe],
  });
  return TestBed.inject(LocaleService);
}

describe('pipes', () => {
  it('translates with parameters and follows a language switch', () => {
    const locale = setup();
    const t = TestBed.inject(TranslatePipe);
    expect(t.transform('employees.subtitle', { count: 5 })).toContain('5');
    const english = t.transform('nav.payroll');
    locale.toggle();
    expect(t.transform('nav.payroll')).not.toBe(english);
  });

  it('formats money, hours and periods in the current language', () => {
    const locale = setup();
    expect(TestBed.inject(MoneyPipe).transform(31900)).toBe('₪31,900.00');
    expect(TestBed.inject(PeriodPipe).transform(2026, 1)).toBe('Jan 2026');
    locale.toggle();
    expect(TestBed.inject(HoursPipe).transform(8.5)).toBe('8 ש׳ 30 ד׳');
  });

  it('shows demo department names in Hebrew and typed text as entered', () => {
    const locale = setup();
    const term = TestBed.inject(TermPipe);
    expect(term.transform('Engineering')).toBe('Engineering');
    locale.toggle();
    expect(term.transform('Engineering')).toBe('הנדסה');
    expect(term.transform('My own team')).toBe('My own team');
  });
});
