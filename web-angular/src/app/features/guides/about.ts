import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { angularFeatures, angularScope } from '@shared/content/angular';
import { pick, type Localized } from '@shared/content/localized';
import { summarySections } from '@shared/content/projectSummary';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { GuideHeader } from './guide-header';

/** The shared summary names PrimeIcons (Vue); this app uses Material icons, keyed by section. */
const ICONS: Record<string, string> = {
  backend: 'dns',
  frontend: 'desktop_windows',
  quality: 'task_alt',
  delivery: 'cloud_upload',
  bugs: 'bug_report',
  next: 'fast_forward',
};

@Component({
  selector: 'app-about',
  imports: [MatIconModule, TranslatePipe, GuideHeader],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  private readonly i18n = inject(LocaleService);
  protected readonly scope = angularScope;
  protected readonly features = angularFeatures;
  protected readonly sections = summarySections;
  protected readonly icons = ICONS;

  protected text(value: Localized): string {
    return pick(value, this.i18n.locale());
  }
}
