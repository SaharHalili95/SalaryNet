import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { LocaleService, provideLocalization } from './locale.service';
import { TranslatedTitleStrategy } from './title.strategy';

@Component({ template: '' })
class Blank {}

describe('TranslatedTitleStrategy', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideLocalization(),
        provideRouter([{ path: 'payroll', component: Blank, title: 'nav.payroll' }, { path: '', component: Blank }]),
        { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
      ],
    });
  });

  it('uses the translated page name', async () => {
    await TestBed.inject(Router).navigateByUrl('/payroll');
    expect(TestBed.inject(Title).getTitle()).toBe('Payroll · SalaryNet');
  });

  it('updates the title when the language changes', async () => {
    await TestBed.inject(Router).navigateByUrl('/payroll');
    TestBed.inject(LocaleService).toggle();
    expect(TestBed.inject(Title).getTitle()).not.toBe('Payroll · SalaryNet');
  });

  it('falls back to the product name', async () => {
    await TestBed.inject(Router).navigateByUrl('/');
    expect(TestBed.inject(Title).getTitle()).toBe('SalaryNet');
  });
});
