import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import en from '@shared/i18n/en';
import he from '@shared/i18n/he';
import type { Locale } from '@shared/i18n/locale';
import { Subject } from 'rxjs';

/** Same key as the Vue app, so the chosen language carries over when switching versions. */
export const LOCALE_KEY = 'salarynet.locale';

interface Tree { [key: string]: string | Tree }
const dictionaries: Record<Locale, Tree> = { en, he };

function savedLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_KEY) === 'he' ? 'he' : 'en';
  } catch {
    return 'en';
  }
}

function lookup(tree: Tree, key: string): string | undefined {
  let node: string | Tree | undefined = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Runtime language switch over the dictionaries shared with the Vue app. The locale is a signal, so
 * templates and computed values that read it update when it changes.
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Locale>(savedLocale());
  private readonly changed = new Subject<Locale>();

  readonly locale = this.current.asReadonly();
  readonly isRtl = computed(() => this.current() === 'he');
  /** Emits after every switch, for library services (like the paginator texts) that are not signal-aware. */
  readonly changes = this.changed.asObservable();

  constructor() {
    this.applyToDocument(this.current());
  }

  toggle(): void {
    this.set(this.current() === 'he' ? 'en' : 'he');
  }

  set(locale: Locale): void {
    this.current.set(locale);
    this.applyToDocument(locale);
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Without storage the choice lasts for this visit.
    }
    this.changed.next(locale);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const text = lookup(dictionaries[this.current()], key) ?? lookup(dictionaries.en, key) ?? key;
    return params ? text.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match)) : text;
  }

  private applyToDocument(locale: Locale): void {
    this.document.documentElement.lang = locale;
    this.document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
  }
}
