import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { angularComponentDetails, angularLanes, angularNodes } from '@shared/content/angular';
import { glossary } from '@shared/content/glossary';
import { pick, type Localized } from '@shared/content/localized';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';

/** The reference half of How it works: the live demo, every component and the glossary. */
@Component({
  selector: 'app-architecture-reference',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './architecture-reference.html',
  styleUrl: './architecture-reference.css',
})
export class ArchitectureReference {
  private readonly i18n = inject(LocaleService);
  protected readonly lanes = angularLanes;
  protected readonly nodes = angularNodes;
  protected readonly details = angularComponentDetails;
  protected readonly glossary = glossary;
  protected readonly dockerRows = [
    { key: 'live', needs: false },
    { key: 'local', needs: true },
    { key: 'integration', needs: true },
    { key: 'unit', needs: false },
    { key: 'demo', needs: false },
  ];

  protected text(value: Localized): string {
    return pick(value, this.i18n.locale());
  }
}
