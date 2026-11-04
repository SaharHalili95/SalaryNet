import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';

/** Top bar of the public guide pages, which sit outside the signed-in shell. */
@Component({
  selector: 'app-guide-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <header class="guide-bar">
      <a class="brand" routerLink="/"><span class="logo">S</span> SalaryNet <span class="flavor">Angular</span></a>
      <nav [attr.aria-label]="'nav.architecture' | t">
        <a routerLink="/architecture" routerLinkActive="active">{{ 'nav.architecture' | t }}</a>
        <a routerLink="/about" routerLinkActive="active">{{ 'nav.about' | t }}</a>
      </nav>
      <div class="actions">
        <button mat-button type="button" [attr.aria-label]="'nav.switchLanguageLabel' | t" (click)="i18n.toggle()">
          <mat-icon>language</mat-icon> {{ 'nav.switchLanguage' | t }}
        </button>
        <a mat-flat-button routerLink="/">
          <mat-icon>{{ auth.isAuthenticated() ? 'apps' : 'login' }}</mat-icon>
          {{ (auth.isAuthenticated() ? 'angularGuide.backToApp' : 'nav.signIn') | t }}
        </a>
      </div>
    </header>
    @if (vueUrl) {
      <p class="compare">
        <a [href]="vueUrl + '#/' + page()"><mat-icon aria-hidden="true">swap_horiz</mat-icon> {{ 'angularGuide.compareVue' | t }}</a>
      </p>
    }
  `,
  styles: `
    .guide-bar {
      display: flex; align-items: center; gap: 0.75rem 1.25rem; flex-wrap: wrap;
      padding: 0.75rem 0; border-bottom: 1px solid var(--app-border); margin-bottom: 1rem;
    }
    .brand { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--app-text); text-decoration: none; }
    .logo {
      width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center;
      background: var(--app-accent); color: #fff; font-size: 0.875rem;
    }
    .flavor { font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.375rem; border-radius: 4px; background: #c3002f; color: #fff; }
    nav { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    nav a { padding: 0.375rem 0.625rem; border-radius: 8px; color: var(--app-text-muted); text-decoration: none; font-weight: 550; }
    nav a.active, nav a:hover { color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 10%, transparent); }
    .actions { display: flex; gap: 0.5rem; align-items: center; margin-inline-start: auto; flex-wrap: wrap; }
    .compare { margin: 0 0 1rem; }
    .compare a { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--app-accent); text-decoration: none; font-weight: 550; }
    .compare mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `,
})
export class GuideHeader {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(LocaleService);
  protected readonly vueUrl = environment.vueUrl;
  readonly page = input.required<'architecture' | 'about'>();
}
