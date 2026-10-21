import { TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { LocaleService, LOCALE_KEY } from './locale.service';
import { providePaginatorIntl } from './paginator-intl';

function setup(saved: string | null = null) {
  localStorage.clear();
  if (saved) localStorage.setItem(LOCALE_KEY, saved);
  TestBed.configureTestingModule({ providers: [providePaginatorIntl()] });
  return TestBed.inject(LocaleService);
}

describe('LocaleService', () => {
  it('translates keys with placeholders', () => {
    expect(setup().t('employees.subtitle', { count: 38 })).toContain('38');
  });

  it('returns the key when a translation is missing', () => {
    expect(setup().t('no.such.key')).toBe('no.such.key');
  });

  it('starts in the saved language', () => {
    const locale = setup('he');
    expect(locale.locale()).toBe('he');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('switches the page to Hebrew and remembers it', () => {
    const locale = setup();
    locale.toggle();
    expect(locale.locale()).toBe('he');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
    expect(localStorage.getItem(LOCALE_KEY)).toBe('he');
    expect(locale.t('nav.payroll')).not.toBe('Payroll');
  });

  it('translates the Material paginator with the page', () => {
    const locale = setup();
    const intl = TestBed.inject(MatPaginatorIntl);
    const english = intl.itemsPerPageLabel;
    locale.toggle();
    expect(intl.itemsPerPageLabel).not.toBe(english);
    expect(intl.getRangeLabel(0, 10, 38)).toContain('38');
  });
});
