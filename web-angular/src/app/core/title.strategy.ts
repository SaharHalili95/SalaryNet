import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, type RouterStateSnapshot } from '@angular/router';
import { LocaleService } from './locale.service';

/** Route titles are translation keys; the browser tab shows them in the current language. */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(LocaleService);
  private key: string | undefined;

  constructor() {
    super();
    this.i18n.changes.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    this.title.setTitle(this.key ? `${this.i18n.t(this.key)} · SalaryNet` : 'SalaryNet');
  }
}
