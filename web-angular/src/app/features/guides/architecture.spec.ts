import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LocaleService } from '../../core/locale.service';
import { Architecture } from './architecture';

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({ imports: [Architecture], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Architecture);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

const detailTitle = (el: HTMLElement) => el.querySelector('.detail h3')!.textContent!.trim();

describe('Architecture (How it works)', () => {
  it('describes the Angular browser side, not the Vue one', () => {
    const { el } = setup();
    expect(el.querySelector('.lane-title')!.textContent).toContain('Angular');
    expect(el.querySelectorAll('.feature')).toHaveLength(8);
    expect(el.textContent).toContain('web-angular/src/app/core/guards.ts');
    expect(el.textContent).not.toContain('Vue 3 · TypeScript · PrimeVue');
  });

  it('walks a flow step by step and follows it on the detail card', () => {
    const { el, fixture } = setup();
    expect(detailTitle(el)).toBe('Component (view)');
    el.querySelectorAll<HTMLButtonElement>('.controls button')[2]!.click();
    fixture.detectChanges();
    expect(detailTitle(el)).toBe('Services + HttpClient');
    expect(el.querySelector('.step-count')!.textContent).toContain('2');
    expect(el.querySelector('.edge')).not.toBeNull();
  });

  it('switches flow and starts it from the first step', () => {
    const { el, fixture } = setup();
    el.querySelectorAll<HTMLButtonElement>('.controls button')[2]!.click();
    const search = [...el.querySelectorAll<HTMLButtonElement>('.flow-picker button')].find((b) => b.textContent!.includes('Search employees'))!;
    search.click();
    fixture.detectChanges();
    expect(search.getAttribute('aria-checked')).toBe('true');
    expect(el.querySelector('.steps li.current .step-text')!.textContent).toContain('debounceTime(300)');
  });

  it('pins a clicked box on the detail card', () => {
    const { el, fixture } = setup();
    const database = [...el.querySelectorAll<SVGGElement>('g.node')].find((g) => g.getAttribute('aria-label') === 'Tables + indexes')!;
    database.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(detailTitle(el)).toBe('Tables + indexes');
  });

  it('plays the flow on a timer and stops at the last step', () => {
    vi.useFakeTimers();
    try {
      const { el, fixture } = setup();
      el.querySelector<HTMLButtonElement>('.controls .play')!.click();
      vi.advanceTimersByTime(2200 * 20);
      fixture.detectChanges();
      expect(el.querySelector('.steps li:last-child')!.classList).toContain('current');
      expect(el.querySelector('.controls .play')!.textContent).toContain('Play');
    } finally {
      vi.useRealTimers();
    }
  });

  it('is fully translated in Hebrew', () => {
    const { el, fixture } = setup();
    TestBed.inject(LocaleService).toggle();
    fixture.detectChanges();
    expect(el.querySelector('h1')!.textContent).toBe('איך זה עובד');
    expect(el.querySelector('.lane-title')!.textContent).toContain('Angular');
    expect(detailTitle(el)).toBe('רכיב (Component)');
  });
});
