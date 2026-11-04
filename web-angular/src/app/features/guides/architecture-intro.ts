import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { angularFeatures, angularLanes } from '@shared/content/angular';
import { pick, type Localized } from '@shared/content/localized';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';

/** The opening of How it works: what is Angular-specific, the restaurant analogy and the layers. */
@Component({
  selector: 'app-architecture-intro',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './architecture-intro.html',
  styleUrl: './architecture-intro.css',
})
export class ArchitectureIntro {
  private readonly i18n = inject(LocaleService);
  protected readonly features = angularFeatures;
  protected readonly lanes = angularLanes;
  // The flex row already mirrors in RTL, so the order stays Browser → API → Application → Domain in both languages.
  protected readonly layerChain = angularLanes.slice(0, 4);
  protected readonly rtl = computed(() => this.i18n.locale() === 'he');

  protected text(value: Localized): string {
    return pick(value, this.i18n.locale());
  }
}
