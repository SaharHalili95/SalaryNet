import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { calculatePayroll } from '@shared/api/demo/payrollCalculator';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('uses the payroll rules shared with the Vue app', () => {
    expect(calculatePayroll('FullTime', 10000, 0).netSalary).toBeGreaterThan(0);
  });
});
