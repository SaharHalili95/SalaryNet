import { inject, Injectable, type Provider } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { LocaleService } from './locale.service';

/** Material's paginator texts, translated and refreshed on every language switch. */
@Injectable()
export class LocalizedPaginatorIntl extends MatPaginatorIntl {
  private readonly i18n = inject(LocaleService);

  constructor() {
    super();
    this.update();
    this.i18n.changes.subscribe(() => this.update());
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return this.i18n.t('paginator.empty', { total: 0 });
    const start = page * pageSize + 1;
    const end = Math.min(length, (page + 1) * pageSize);
    return this.i18n.t('paginator.range', { start, end, total: length });
  };

  private update(): void {
    this.itemsPerPageLabel = this.i18n.t('paginator.itemsPerPage');
    this.firstPageLabel = this.i18n.t('paginator.firstPage');
    this.previousPageLabel = this.i18n.t('paginator.previousPage');
    this.nextPageLabel = this.i18n.t('paginator.nextPage');
    this.lastPageLabel = this.i18n.t('paginator.lastPage');
    this.changes.next();
  }
}

export function providePaginatorIntl(): Provider[] {
  return [{ provide: MatPaginatorIntl, useClass: LocalizedPaginatorIntl }];
}
