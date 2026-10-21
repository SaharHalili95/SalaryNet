import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { UserRole } from '@shared/api/types';
import { filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { startDemoSimulation } from '../core/demo-simulation';
import { PersonPipe } from '../core/format.pipes';
import { providePaginatorIntl } from '../core/paginator-intl';
import { LocaleService } from '../core/locale.service';
import { TranslatePipe } from '../core/translate.pipe';
import { localizeName, localizeTerm } from '@shared/i18n/dataGlossary';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}

/** Phase 1 pages only; the navigation never links to a page this app does not have. */
const NAV: NavItem[] = [
  { path: '/me', label: 'nav.myOverview', icon: 'home', roles: ['Employee'] },
  { path: '/dashboard', label: 'nav.dashboard', icon: 'bar_chart', roles: ['Admin', 'HR'] },
  { path: '/employees', label: 'nav.employees', icon: 'group', roles: ['Admin', 'HR'] },
  { path: '/payroll', label: 'nav.payroll', icon: 'payments' },
  { path: '/attendance', label: 'nav.attendance', icon: 'schedule' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, PersonPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  // Provided here rather than at the root so the paginator stays out of the initial bundle.
  providers: [providePaginatorIntl()],
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly demoMode = environment.demoMode;
  protected readonly vueUrl = environment.vueUrl;
  protected readonly menuOpen = signal(false);
  protected readonly nav = computed(() => NAV.filter((item) => !item.roles || this.auth.hasRole(item.roles)));
  protected readonly initials = computed(() =>
    (this.auth.user()?.displayName ?? '?')
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join(''),
  );

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuOpen.set(false));

    // Keep the page behind the open mobile menu from scrolling.
    effect(() => this.document.body.classList.toggle('menu-open', this.menuOpen()));
    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('menu-open'));

    const stop = startDemoSimulation((change) => {
      if (!this.auth.isStaff()) return;
      const locale = this.i18n.locale();
      this.snackBar.open(
        this.i18n.t(`simulation.${change.kind}Detail`, {
          name: localizeName(change.name, locale),
          department: localizeTerm(change.department, locale),
        }),
        '✕',
        { duration: 6000, direction: this.i18n.isRtl() ? 'rtl' : 'ltr' },
      );
    });
    inject(DestroyRef).onDestroy(stop);
  }

  protected toggleMenu(open: boolean): void {
    this.menuOpen.set(open);
    // Apply right away rather than on the next render, so a tap feels instant.
    this.document.body.classList.toggle('menu-open', open);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
