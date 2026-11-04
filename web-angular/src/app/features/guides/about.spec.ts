import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { summarySections } from '@shared/content/projectSummary';
import { About } from './about';

describe('About this project', () => {
  it('opens with the Angular version and keeps the shared project summary', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [About], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(About);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.angular h2')!.textContent).toContain('The Angular version');
    expect(el.querySelectorAll('.feature-list li')).toHaveLength(8);
    expect(el.querySelectorAll('.sections > section')).toHaveLength(summarySections.length);
    expect(el.querySelector<HTMLAnchorElement>('.links a[href*="web-angular"]')).not.toBeNull();
  });
});
