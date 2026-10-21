import type { MatDialogConfig } from '@angular/material/dialog';

/** Same widths as the Vue dialogs: a fixed width on desktop, nearly full width on phones. */
export const dialogSize = (width: string): MatDialogConfig => ({ width, maxWidth: '95vw', autoFocus: 'first-tabbable' });
