import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from '@shared/api/errors';
import { SALARYNET_API } from '../../core/api';
import { provideLocalization } from '../../core/locale.service';
import { noa } from '../../shared/testing';
import { GenerateDialog } from './generate-dialog';

describe('GenerateDialog', () => {
  it('keeps the dialog open and reports a conflict when the period already exists', async () => {
    const close = vi.fn();
    const open = vi.fn();
    TestBed.configureTestingModule({
      imports: [GenerateDialog],
      providers: [
        provideLocalization(),
        { provide: MAT_DIALOG_DATA, useValue: { employees: [noa] } },
        { provide: MatDialogRef, useValue: { close } },
        { provide: MatSnackBar, useValue: { open } },
        { provide: SALARYNET_API, useValue: { payroll: { generate: async () => { throw new ApiError(409, 'Already exists'); } } } },
      ],
    });
    const fixture = TestBed.createComponent(GenerateDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance as unknown as { form: { controls: { employeeId: { setValue: (id: string) => void } } }; generate: () => Promise<void> };
    component.form.controls.employeeId.setValue(noa.id);
    await component.generate();
    expect(close).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalled();
  });
});
