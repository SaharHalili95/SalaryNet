import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { payslip } from './testing';
import { PayslipDialog } from './payslip-dialog';

describe('PayslipDialog', () => {
  it('shows the gross pay for salary and bonus', async () => {
    localStorage.setItem('salarynet.locale', 'en');
    TestBed.configureTestingModule({
      imports: [PayslipDialog],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { record: payslip } }, { provide: MatDialogRef, useValue: { close: vi.fn() } }],
    });
    const fixture = TestBed.createComponent(PayslipDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('₪31,900.00');
  });
});
