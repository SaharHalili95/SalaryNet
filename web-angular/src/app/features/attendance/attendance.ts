import { Component, computed, inject, PendingTasks, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import type { AttendanceLog } from '@shared/api/types';
import { formatHours, formatTime } from '@shared/format/format';
import { EMPTY, interval, map, startWith, switchMap } from 'rxjs';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { AuthService } from '../../core/auth.service';
import { ClockPipe, HoursPipe, PersonPipe, ShortDatePipe } from '../../core/format.pipes';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-attendance',
  imports: [MatButtonModule, MatIconModule, MatPaginatorModule, MatTableModule, TranslatePipe, ClockPipe, HoursPipe, PersonPipe, ShortDatePipe],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css',
})
export class Attendance {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly pending = inject(PendingTasks);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(LocaleService);
  protected readonly current = signal<AttendanceLog | null>(null);
  protected readonly rows = signal<AttendanceLog[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly busy = signal(false);
  protected readonly minutes = signal(0);
  protected readonly columns = this.auth.isStaff() ? ['employee', 'checkIn', 'checkOut', 'hours'] : ['checkIn', 'checkOut', 'hours'];
  protected readonly elapsed = computed(() => formatHours(this.minutes() / 60, this.i18n.locale()));

  constructor() {
    void this.pending.run(() => this.load());
    toObservable(this.current).pipe(
      switchMap((shift) => shift?.isOpen
        ? interval(60_000).pipe(startWith(0), map(() => Math.max(0, Math.floor((Date.now() - Date.parse(shift.checkIn)) / 60_000))))
        : EMPTY),
      takeUntilDestroyed(),
    ).subscribe((minutes) => this.minutes.set(minutes));
  }

  protected async toggle(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const shift = this.current()?.isOpen ? await this.api.attendance.checkOut() : await this.api.attendance.checkIn();
      this.current.set(shift);
      this.snackBar.open(this.i18n.t(shift.isOpen ? 'attendance.checkedInToast' : 'attendance.checkedOutToast'), undefined, { duration: 3000 });
      await this.loadRows();
    } catch (e) { this.errors.handle(e); }
    finally { this.busy.set(false); }
  }

  protected page(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.loadRows();
  }

  protected time(iso: string): string { return formatTime(iso, this.i18n.locale()); }

  private async load(): Promise<void> {
    if (!this.auth.isStaff()) {
      try { this.current.set(await this.api.attendance.current()); } catch (e) { this.errors.handle(e); }
    }
    await this.loadRows();
  }

  private async loadRows(): Promise<void> {
    try {
      const result = await this.api.attendance.search({ page: this.pageIndex() + 1, pageSize: this.pageSize() });
      this.rows.set(result.items);
      this.total.set(result.totalCount);
    } catch (e) { this.errors.handle(e); }
  }
}
