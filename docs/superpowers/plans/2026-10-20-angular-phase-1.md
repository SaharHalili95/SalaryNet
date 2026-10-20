# Angular Front End, Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the core of SalaryNet as a second, Angular front end next to Vue, sharing the same rules, demo engine and translations, and deployed at `/SalaryNet/angular/`.

**Architecture:**
- **Shared core:** framework-free TypeScript (API contract and types, demo engine, payroll calculator, translations, guide content, formatting) moves from `web/src` to a top-level `shared/` folder. Both apps import it through the alias `@shared/*`.
- **Vue (`web/`):** keeps its own thin, Vue-specific wrappers.
- **Angular (`web-angular/`):** standalone components with Signals. It implements the shared `SalaryNetApi` contract with `HttpClient` in HTTP mode and uses the shared demo engine in demo mode.

**Tech Stack:**
- **Angular:** latest stable major (22), standalone components, Signals, functional guards and interceptors, Reactive Forms, RxJS.
- **UI:** PrimeNG with the `@primeuix/themes` Aura preset, Chart.js.
- **Tests:** Vitest through `ng test` (the CLI default), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-angular-frontend-design.md`

## Global Constraints

- **Vue stays green after every task:** `web/` must build (`npm run build` and `npm run build:demo`), pass `npm test` (54 tests) and pass `npm run test:e2e` (303 runs). The live Vue URL `https://saharhalili95.github.io/SalaryNet/` does not change.
- **Pinned versions:** exact versions only, each published at least two weeks before it is installed. `npm audit --omit=dev` must be clean in `web-angular/`.
- **TypeScript strict:** no `any`. CI fails on lint, type or test errors.
- **One copy of the rules:** business rules, demo data, payroll calculation, translations and guide content exist once, in `shared/`.
- **Language of code and docs:** English for code, comments and docs. Hebrew appears only in translation and content files.
- **Commits:** many small commits, each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never use `git add -A`, never amend, never pass `--no-verify`. Prose uses no em dashes.
- **Storage keys:** the same as Vue (`salarynet.session`, `salarynet.locale`). Both apps are served from the same origin, so a visitor who switches versions keeps their language and sign-in.
- **Phase 1 pages only:** login, dashboard, my overview, employees, payroll (with payslip), attendance. The Angular navigation lists only these. No dead links and no "coming soon" text.
- **Mobile rules for Angular:**
  - No horizontal scroll down to 320px.
  - Inputs at least 16px on screens up to 900px wide.
  - Icon buttons at least 40px.
  - The drawer menu closes on a backdrop tap and locks page scroll while open.
  - RTL must not shift the page. This bug was fixed in Vue, so don't use direction rules that apply to `html` itself.
- **Study notes:** after each task, add a section to `~/Desktop/SalaryNet-Angular-notes.md` (outside the repo, in Hebrew). It covers what was built, the Angular concept involved, why it was built that way, and 3-4 likely interview questions with short answers.

## Review Focus

1. **The shared-code move:** this is the most likely place to break Vue silently, through wrong import paths, the content test that checks cited file paths, or Vite failing to resolve files outside `web/`. Task 1 must end with the full Vue suite green, including e2e.
2. **Expired or foreign sessions:** a session written by Vue, or expired, must not crash Angular or loop between redirects. An expired session is treated as signed out, and an unknown demo token leads to the login page.
3. **Language switch:** the switch must update `dir`, `lang`, every translated string, Intl formats and PrimeNG's built-in texts without a reload. Hebrew must not move the layout.
4. **Server validation errors (400 ProblemDetails):** these must land on the matching form fields in the employee dialog. Other errors show a toast with the translated server message.
5. **Debounced search:** fast typing must send one request after the pause, and an earlier, slower response must never overwrite a newer one (`switchMap`).

---

## File Structure

```
shared/                         moved from web/src with git mv (history kept)
  api/client.ts types.ts errors.ts httpApi.ts
  api/demo/demoApi.ts demoData.ts payrollCalculator.ts __tests__/
  i18n/locale.ts                NEW: type Locale = 'en' | 'he'
  i18n/en.ts he.ts dataGlossary.ts serverMessages.ts __tests__/
  content/*.ts __tests__/
  format/format.ts              NEW: locale-parameter versions of web/src/utils/format.ts
  format/__tests__/format.spec.ts
web/                            Vue, now importing @shared/*
web-angular/
  angular.json package.json tsconfig.json eslint.config.js
  src/main.ts index.html styles.css environments/
  src/app/app.config.ts app.routes.ts app.ts
  src/app/core/  api.ts http-api.ts interceptors.ts auth.service.ts guards.ts
                 locale.service.ts translate.pipe.ts api-error.service.ts format.pipes.ts demo-simulation.ts
  src/app/layout/shell.ts (sidebar, topbar, drawer, version switch)
  src/app/shared/stat-tile.ts chart-canvas.ts payslip-dialog.ts
  src/app/features/login/ dashboard/ me/ employees/ payroll/ attendance/
```

---

### Task 1: Move the framework-free code into `shared/`, Vue stays green

**Files:**
- Move (`git mv`) from `web/src` to `shared/`:
  - `api/client.ts`, `api/types.ts`, `api/errors.ts`, `api/httpApi.ts`
  - `api/demo/*` (with its `__tests__`)
  - `i18n/en.ts`, `i18n/he.ts`, `i18n/dataGlossary.ts`, `i18n/serverMessages.ts`
  - `i18n/__tests__/*`, `content/*` (with its `__tests__`)
- Create: `shared/i18n/locale.ts`, `shared/format/format.ts`, `shared/format/__tests__/format.spec.ts`, `shared/tsconfig.json`
- Modify:
  - `web/vite.config.ts`: add the `@shared` alias, `server.fs.allow: ['..']`, and `test.include` covering `../shared/**/*.spec.ts`
  - `web/tsconfig.json`: add `paths "@shared/*": ["../shared/*"]` and include `../shared/**/*.ts`
  - `web/src/i18n/index.ts`: re-export `Locale` from `@shared/i18n/locale`, import `en`/`he` from shared
  - `web/src/utils/format.ts`: turn it into a thin wrapper
  - `web/src/api/index.ts`, plus every Vue file importing a moved module
  - `shared/content/architecture.ts:58`: `code: 'web/src/api/httpApi.ts'` becomes `'shared/api/httpApi.ts'`
  - `shared/content/troubleshooting.ts:132`: `'web/src/api/demo/demoApi.ts'` becomes `'shared/api/demo/demoApi.ts'`
  - `shared/content/__tests__/content.spec.ts`: `repoRoot = resolve(__dirname, '../../..')`
  - `web/Dockerfile`: the build context must include `shared/`; change compose `context` to `.` with `dockerfile: web/Dockerfile` if needed
  - `.github/workflows/ci.yml` and `pages.yml`: add `shared/**` to any path filters

**Interfaces:**
- Produces, `shared/i18n/locale.ts`: `export type Locale = 'en' | 'he'` and `export const intlLocale = (l: Locale) => (l === 'he' ? 'he-IL' : 'en-GB')`.
- Produces, `shared/format/format.ts`, each with the same output as today's Vue function for that locale:
  - `formatMoney(value: number, locale: Locale): string`
  - `formatMoneyCompact(value: number, locale: Locale): string`
  - `formatPeriod(year: number, month: number, locale: Locale): string`
  - `formatMonthShort(year: number, month: number, locale: Locale): string`
  - `formatDate(iso: string, locale: Locale): string`
  - `formatTime(iso: string, locale: Locale): string`
  - `formatHours(hours: number, locale: Locale): string`
  - `monthOptions(locale: Locale): { label: string; value: number }[]`
- Vue keeps its current call sites, for example `formatMoney(v)` in `web/src/utils/format.ts` becomes `(v: number) => shared.formatMoney(v, currentLocale())`.
- `dataGlossary.ts` and `serverMessages.ts` import `Locale` from `./locale`, not from `.`.

- [ ] **Step 1: Write `shared/format/__tests__/format.spec.ts`**

```ts
it('formats money per locale', () => {
  expect(formatMoney(21102.6, 'en')).toBe('₪21,102.60')
  expect(formatMoney(21102.6, 'he')).toContain('21,102.6')
})
it('formats hours in each language', () => {
  expect(formatHours(8.5, 'en')).toBe('8h 30m')
  expect(formatHours(8.5, 'he')).toBe('8 ש׳ 30 ד׳')
})
it('formats a period in UTC so the month never shifts', () => {
  expect(formatPeriod(2026, 1, 'en')).toBe('Jan 2026')
})
it('lists twelve months starting with January', () => {
  expect(monthOptions('en')[0]).toEqual({ label: 'January', value: 1 })
  expect(monthOptions('he')).toHaveLength(12)
})
```

- [ ] **Step 2:** Run `cd web && npx vitest run ../shared/format`. Expected: FAIL, the module is not found.
- [ ] **Step 3:** Run the `git mv` moves. Add `locale.ts` and `format.ts`, update the aliases and config, then rewrite the Vue imports:
  - `@/api/types`, `@/api/errors`, `@/api/demo/demoData`, `@/content/*` and `@/i18n/serverMessages` become `@shared/...`
  - `@/api`, `@/i18n`, `@/i18n/useLocalizedData` and `@/utils/format` stay as Vue wrappers
  - Relative imports inside moved files keep working because the folders move together
- [ ] **Step 4:** Run, from `web`:

  ```bash
  npm run typecheck && npm test && npm run build && npm run build:demo && npm run test:e2e
  ```

  Expected: all green. Vitest shows 54 old tests plus the new format tests. Playwright shows 303 passed.
- [ ] **Step 5:** Run `docker compose --profile full build web` (only if Docker is running; otherwise note it in the commit message as not verified locally) and confirm CI passes after the push.
- [ ] **Step 6: Commit**, in separate commits:
  1. "Move framework-free code into shared/" (the `git mv` moves plus the import updates)
  2. "Make formatting functions take the locale as a parameter"
- [ ] **Step 7:** Add a study-notes section: why the shared core exists, and the interview line "same rules, two UIs".

---

### Task 2: Scaffold `web-angular/` with theme, aliases, lint, tests and CI

**Files:**
- Create: `web-angular/` via `npx @angular/cli@<pinned> new salarynet --directory web-angular --style=css --routing --ssr=false --skip-git`, which gives standalone components and the Vitest runner by default
- Create: `web-angular/eslint.config.js` (via `ng add angular-eslint`), plus `src/environments/environment.ts`, `environment.demo.ts` and `environment.http.ts`
- Modify:
  - `web-angular/angular.json`:
    - build configurations `demo` (file replacement to `environment.demo.ts`, `baseHref: "/SalaryNet/angular/"`) and `e2e` (demo with `baseHref: "/"`)
    - dev server port `4200` with `proxy.conf.json` sending `/api` to `http://localhost:5080`
  - `web-angular/tsconfig.json`: `paths "@shared/*": ["../shared/*"]`, and include `../shared/**/*.ts` minus `__tests__`
  - `.github/workflows/ci.yml`: a job named `Angular lint, unit tests and build` that runs `npm ci && npm run lint && npm test -- --watch=false && npm run build -- --configuration demo` in `web-angular`
- Test: `web-angular/src/app/app.spec.ts`

**Interfaces:**
- Produces, `environment`: `{ demoMode: boolean; apiUrl: string; vueUrl: string | null }`
  - demo: `{ demoMode: true, apiUrl: '/api', vueUrl: '../' }`
  - http: `{ demoMode: false, apiUrl: '/api', vueUrl: null }`
- Produces, `app.config.ts`:
  - `provideRouter(routes, ...(environment.demoMode ? [withHashLocation()] : []))`
  - `provideHttpClient(withInterceptors([...]))`
  - `providePrimeNG({ theme: { preset: SalaryNetPreset, options: { darkModeSelector: 'system' } } })`, where `SalaryNetPreset` is the same `definePreset(Aura, …blue primary…)` as `web/src/main.ts:16-22`
  - `MessageService` and `ConfirmationService`
- Produces, `src/styles.css`: the same tokens and global rules as `web/src/styles/main.css`, including the mobile block. Copy it, because it is styling, not business rules.

- [ ] **Step 1:** Write `app.spec.ts`. Assertions:
  - the root component renders a `<router-outlet>`
  - importing a shared module works: `expect(calculatePayroll('FullTime', 10000, 0).net).toBeGreaterThan(0)` imported from `@shared/api/demo/payrollCalculator`
- [ ] **Step 2:** Run `npm test -- --watch=false`. Expected: FAIL before the alias exists, PASS after.
- [ ] **Step 3:** Scaffold the project and add the configuration. Pin every version in `package.json`, and check `npm audit --omit=dev`.
- [ ] **Step 4:** Run `npm run lint && npm test -- --watch=false && npx ng build --configuration demo`. Expected: all pass, with output in `dist/salarynet/browser`.
- [ ] **Step 5: Commit** "Scaffold Angular app with PrimeNG, shared alias and CI".
- [ ] **Step 6:** Study notes: standalone components, `app.config.ts`, and environments compared with Vue's `import.meta.env`.

---

### Task 3: Core services: API, auth, locale and translation, errors

**Files:**
- Create in `web-angular/src/app/core/`:
  - `api.ts`, `http-api.ts`, `interceptors.ts`, `auth.service.ts`, `guards.ts`
  - `locale.service.ts`, `translate.pipe.ts`, `api-error.service.ts`, `format.pipes.ts`, `demo-simulation.ts`
- Test: `core/*.spec.ts` next to each file

**Interfaces:**
- Produces: `export const SALARYNET_API = new InjectionToken<SalaryNetApi>('SalaryNetApi')`. The factory returns `createDemoApi(() => inject(AuthService).token(), demoDatabase())` in demo mode, and `inject(HttpSalaryNetApi)` otherwise.
- Produces: `@Injectable({ providedIn: 'root' }) class HttpSalaryNetApi implements SalaryNetApi` on `HttpClient`. Methods return Promises via `firstValueFrom`. The URLs, methods and query mapping are identical to `shared/api/httpApi.ts` (empty, null and undefined query values are dropped).
- Produces, `interceptors.ts`:
  - `authInterceptor`: adds `Authorization: Bearer <token>` when there is a token
  - `problemDetailsInterceptor`: maps `HttpErrorResponse` to the shared `ApiError(status, title, detail, errors)`, and calls `AuthService.logout()` plus navigates to `/login` on 401 when a token was sent
- Produces, `AuthService`:
  - signals `session`, `token`, `user`, `isAuthenticated`, `isStaff`, `isAdmin`
  - `login(email, password): Promise<void>`, `logout(): void`, `hasRole(roles: UserRole[]): boolean`
  - reads and writes `localStorage['salarynet.session']` with the same shape and expiry check as `web/src/stores/auth.ts`, wrapped in try/catch
- Produces, `guards.ts`:
  - `authGuard: CanActivateFn`: sends a signed-out user to `/login?redirect=<url>`
  - `roleGuard(roles: UserRole[]): CanActivateFn`: sends home on a wrong role
  - `loginGuard`: sends a signed-in user from `/login` to home
  - `homeRedirect`: staff go to `/dashboard`, employees to `/me`
- Produces, `LocaleService`:
  - signal `locale: Signal<Locale>`, `toggle()`, `t(key: string, params?: Record<string, string | number>): string`
  - an effect sets `document.documentElement.lang`/`dir`, writes `localStorage['salarynet.locale']`, and updates PrimeNG translation texts (`PrimeNG.setTranslation`) with the same strings as `web/src/App.vue:20-27`
  - `t` resolves dotted keys in the shared `en`/`he` dictionaries and replaces `{name}` placeholders. Missing keys return the key.
- Produces: `@Pipe({ name: 't', pure: false }) TranslatePipe` (`{{ 'nav.payroll' | t }}`, `{{ 'x' | t: { count: 3 } }}`), and pipes `money`, `period`, `monthShort`, `date`, `time`, `hours`, `term` and `person`. These wrap the shared format and glossary functions with the current locale.
- Produces, `ApiErrorService.handle(error: unknown): Record<string, string>`: the same behavior as `web/src/utils/useApiError.ts`. It returns translated field errors, and shows a toast unless the error is a 400 that has field errors.
- Produces, `startDemoSimulation(onChange)`: an Angular-side copy of the 2-minute timer in `web/src/api/index.ts:28`, calling the shared `randomChange`.

- [ ] **Step 1: Write failing tests**
  - **`auth.service.spec.ts`:**
    - an expired stored session reads as signed out
    - malformed JSON in storage reads as signed out
    - `login()` stores the session
    - `logout()` clears it
    - `hasRole(['Admin'])` is false for HR
  - **`locale.service.spec.ts`:**
    - `t('employees.subtitle', { count: 38 })` returns the English text containing "38"
    - after `toggle()`, `document.documentElement.dir === 'rtl'`, `lang === 'he'`, and the stored locale is `'he'`
    - an unknown key returns the key
    - after `toggle()`, PrimeNG's `emptyMessage` translation is `'אין אפשרויות'`
  - **`http-api.spec.ts`** (HttpTestingController):
    - `employees.search({ search: 'Noa', departmentId: undefined, page: 1 })` sends `GET /api/employees?search=Noa&page=1`
    - `login` sends `POST /api/auth/login` with `{ email, password }`
  - **`interceptors.spec.ts`:**
    - the bearer header is present when signed in
    - a 401 with a token calls `logout()`
    - a 400 body `{ title: 'Validation', errors: { FirstName: ['Required'] } }` arrives as an `ApiError` whose `fieldErrors.firstName === 'Required'`
    - in demo mode, a stored session whose token the fresh demo database does not know makes the first API call fail with 401, which clears the session and navigates to `/login` once (no redirect loop)
  - **`guards.spec.ts`:**
    - signed-out access to `/payroll` returns a UrlTree to `/login?redirect=%2Fpayroll`
    - an Employee opening `/employees` is sent to `/me`
    - a signed-in user opening `/login` is sent home
- [ ] **Step 2:** Run `npm test -- --watch=false`. Expected: FAIL.
- [ ] **Step 3:** Implement each file to the interfaces above.
- [ ] **Step 4:** Run `npm test -- --watch=false && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** one commit per concern: "Add API provider with HttpClient implementation", "Add auth service, guards and interceptors", "Add locale service and translate pipe".
- [ ] **Step 6:** Study notes: `InjectionToken` and why it is used here; signals compared with Vue refs; functional interceptors; guards returning a `UrlTree`. Interview Q&A for each.

---

### Task 4: Shell, routes and version switch

**Files:**
- Create: `web-angular/src/app/app.routes.ts`, `layout/shell.ts` (with template and css), `layout/shell.spec.ts`
- Modify: `web/src/layouts/AppLayout.vue` and `web/src/views/LoginView.vue` to add a "Angular version" link, and `shared/i18n/en.ts` / `he.ts` to add the keys below

**Interfaces:**
- **Routes:**
  - `''` uses `homeRedirect`
  - `login` is public with `loginGuard`
  - inside the shell, with `authGuard`:
    - `me` is for Employee (`roleGuard(['Employee'])`)
    - `dashboard` and `employees` are for Admin and HR
    - `payroll` and `attendance` are for everyone
  - `**` redirects to `''`
  - Features are lazy-loaded with `loadComponent`. Titles come from the same i18n keys as `web/src/router/index.ts`, set through a `TitleStrategy` that uses `LocaleService`.
- **Shell:** the same structure and classes as `web/src/layouts/AppLayout.vue`, so styling and e2e selectors carry over:
  - `.shell`, `.sidebar` (`.open` when open), `.backdrop`, `.topbar`, `.menu-toggle`, `.main`, `main.content`, `.demo-banner`, `.user`, `.user-text`
  - The navigation lists only the Phase 1 routes allowed for the role.
  - The drawer closes on navigation and on a backdrop tap, adds the `menu-open` class to `body` while open, and uses `visibility: hidden` when closed.
  - Topbar buttons: language, sign out, and the version switch.
- **Version switch:**
  - In Angular, a link `{{ 'layout.vueVersion' | t }}` to `environment.vueUrl`, hidden when that is null.
  - In Vue, a link `{{ t('layout.angularVersion') }}` to `import.meta.env.BASE_URL + 'angular/'` in demo mode, or to `VITE_ANGULAR_URL` when set, hidden otherwise.
- **New keys:** `layout.vueVersion` ("Vue version" / "גרסת Vue"), `layout.angularVersion` ("Angular version" / "גרסת Angular"), `layout.angularScope` ("The Angular version covers sign-in, dashboards, employees, payroll and attendance. The full app is in the Vue version." / Hebrew equivalent). The existing translation-completeness test then covers them.
- **Demo banner:** in Angular, the existing `layout.demoBanner` text plus the `layout.angularScope` text.

- [ ] **Step 1:** Write `shell.spec.ts`. Assertions:
  - for an HR user, the nav hrefs are exactly `/dashboard`, `/employees`, `/payroll`, `/attendance`
  - for an Employee, `/me`, `/payroll`, `/attendance`
  - toggling the menu adds `.sidebar.open` and `body.menu-open`, and navigation removes both
  - the version link is absent when `vueUrl` is null
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement the routes and shell. Add the Vue link and the keys. Use `[dir='rtl'] .sidebar` without `:host-context` tricks that could target `html`.
- [ ] **Step 4:** Run `npm test -- --watch=false` in `web-angular`, and `npm test && npm run test:e2e` in `web` (the Vue link must not break the Vue suite). Expected: PASS.
- [ ] **Step 5: Commit** "Add Angular shell, routes and guards" and "Link the Vue and Angular versions to each other".
- [ ] **Step 6:** Study notes: lazy `loadComponent`, `TitleStrategy`, why the class names match Vue.

---

### Task 5: Login page

**Files:**
- Create: `features/login/login.ts` (with template and css), `login.spec.ts`

**Interfaces:**
- Consumes: `AuthService.login`, `LocaleService`, and `DEMO_ACCOUNTS`, `DEMO_PASSWORD`, `DEMO_ADMIN_PASSWORD` from `@shared/api/demo/demoData`
- Produces:
  - The same markup classes as `web/src/views/LoginView.vue`: `.login`, `.hero`, `.guide-link`, `form.card`, `.demo-grid`, `.demo-account`, `.credentials`, `.cred`, `.copy`, `#email`, `#password`, `.p-message-error`
  - The same mobile CSS, including the 520px stacked credentials and the wrapping emails
  - Guide links: in Phase 1, the hero links point to the Vue version's guide pages (`vueUrl + '#/architecture'`, and so on) and say so in their label. When `vueUrl` is null they are hidden.
- The form is a Reactive Form: `email` uses `Validators.required, Validators.email`, and `password` uses `Validators.required`.
- On submit, it navigates to `route.snapshot.queryParams['redirect'] ?? '/'`.

- [ ] **Step 1:** Write `login.spec.ts`. Assertions:
  - tapping the HR demo card calls `login('hr@salarynet.demo', 'Demo123!')`
  - submitting an empty form does not call `login` and marks both controls touched
  - a rejected login shows `.p-message-error` with the translated server message plus `login.lockoutHint`
  - tapping a credentials row fills both fields
  - a `redirect=/payroll` query param is honored after success
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** "Add Angular sign-in page".
- [ ] **Step 6:** Study notes: Reactive Forms compared with `v-model`, and `FormGroup` validation state.

---

### Task 6: Dashboard and my overview

**Files:**
- Create:
  - `shared/stat-tile.ts`, `shared/chart-canvas.ts`
  - `features/dashboard/dashboard.ts`, `features/me/me.ts`
  - specs next to each file

**Interfaces:**
- Consumes: `SALARYNET_API.dashboard()`, `.employees.mine()`, `.payroll.search()`, `.attendance.current()/checkIn()/checkOut()`
- Produces:
  - **`ChartCanvasComponent`:** inputs `build: (tokens: ChartTokens) => ChartConfiguration`, `label: string`, `height = 280`. It recreates the chart when `build` changes or the color scheme changes, and destroys it on destroy. The CSS is the same as `web/src/components/ChartCanvas.vue` (`min-width: 0`, `canvas { max-width: 100% }`). `ChartTokens` matches the Vue interface.
  - **`StatTileComponent`:** inputs `label`, `value`, `hint?`, `icon`
  - **Dashboard:**
    - stat tiles, a monthly trend line chart, and a payroll-by-department bar chart, each with a chart/table toggle whose table sits in `.table-scroll`
    - the same chart options as `web/src/views/DashboardView.vue`, including RTL axis handling
    - the focus panels are Phase 2 and are not built
  - **My overview:** a shift card (`.shift`, with check in/out), tiles, the net history chart, the profile `dl.profile` with wrapping email, and an "All payslips" button that goes to `/payroll`

- [ ] **Step 1:** Write specs. Assertions:
  - the dashboard renders 4 tiles from a stubbed `DashboardSummary`
  - toggling shows `.data-table`
  - `ChartCanvasComponent` destroys its chart on destroy (spy on `Chart.prototype.destroy`)
  - my overview: check-in calls `attendance.checkIn` and the button label changes to the translated "Check out"
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** "Add Angular dashboard and charts" and "Add Angular employee overview".
- [ ] **Step 6:** Study notes: `input()` signals, `effect` for chart rebuilds, `DestroyRef` cleanup.

---

### Task 7: Employees list and dialog

**Files:**
- Create: `features/employees/employees.ts`, `employee-dialog.ts`, specs

**Interfaces:**
- **List:** a PrimeNG `p-table` with `[lazy]="true"`, paginator, sort by `LastName`, `BaseSalary` or `CreatedAt`, and the filters search, department, employment type and status inside a `.toolbar`.
  - Search runs through `toObservable(searchText).pipe(debounceTime(300), distinctUntilChanged(), switchMap(...))`. Filter, sort and page changes go through the same `switchMap` stream, so only the latest response is applied.
  - The query object is `EmployeeQuery` from `@shared/api/types`.
- **Dialog:**
  - A Reactive Form with `firstName`, `lastName`, `email`, `departmentId`, `employmentType` and `baseSalary`. The validators mirror the server: required fields, a valid email, salary `>= 0`.
  - Element ids match Vue: `#firstName`, `#lastName`, `#email`, `#department`, `#type`, `#salary`.
  - On an `ApiError` 400, `ApiErrorService.handle` field errors are set on the controls (`setErrors({ server: message })`) and shown in `small.error`.
  - Create or update, then close and reload the list.
  - Width `36rem`, and `95vw` below 640px.
- **Deactivate and activate:** through `ConfirmationService`, with the same texts as Vue.

- [ ] **Step 1:** Write specs (with `fakeAsync` or Vitest fake timers). Assertions:
  - typing "N", "No", "Noa" within 300ms triggers exactly one `employees.search` call with `search: 'Noa'`
  - when the first response resolves after the second, the table shows the second
  - submitting an empty dialog shows the required errors and does not call `create`
  - a 400 `ApiError` with `errors: { Email: ['Email already exists'] }` shows that message under `#email`
  - a successful create closes the dialog and reloads page 1
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** "Add Angular employees list with debounced search" and "Add employee dialog with reactive form validation".
- [ ] **Step 6:** Study notes: `debounceTime`/`switchMap` and the race they prevent, `toObservable`, and mapping server errors onto form controls.

---

### Task 8: Payroll and payslip

**Files:**
- Create: `features/payroll/payroll.ts`, `shared/payslip-dialog.ts`, `features/payroll/generate-dialog.ts`, `features/payroll/run-month-dialog.ts`, specs

**Interfaces:**
- **List:**
  - `PayrollQuery` filters: year, month (from `monthOptions(locale)`) and department, where department is shown to staff only
  - lazy paging, and a row click opens the payslip
  - the header actions "Single payslip" and "Run monthly payroll" are for staff only
- **`PayslipDialogComponent`:**
  - input `record: PayrollRecord | null`
  - the same rows and classes as `web/src/components/PayslipDialog.vue`: base salary, bonus, gross, income tax, social security, total deductions, net, and the disclaimer
  - deductions use `.money.neg`
  - width `30rem`, and `95vw` below 640px
- **Generate dialog:**
  - pick an employee, year, month and bonus
  - calls `payroll.generate`
  - a 409 conflict shows the translated message
- **Run-month dialog:** calls `payroll.runMonth(year, month)` and shows `MonthlyPayrollResult` counts.

- [ ] **Step 1:** Write specs. Assertions:
  - an Employee user does not see the staff header buttons or the department filter
  - a row click sets the payslip `record`, and the dialog shows `net` formatted with the `money` pipe
  - the payslip for the stubbed record `{ baseSalary: 28900, bonus: 3000 }` shows gross `₪31,900.00` in English
  - generate with a 409 `ApiError` shows a toast and keeps the dialog open
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** "Add Angular payroll list and payslip" and "Add single and monthly payroll runs".
- [ ] **Step 6:** Study notes: component inputs and outputs for dialogs, and role-based UI compared with server-side enforcement (IDOR is still enforced by the API).

---

### Task 9: Attendance

**Files:**
- Create: `features/attendance/attendance.ts`, spec

**Interfaces:**
- **Employee:**
  - the `.clock` panel with a `.dot` (`.on` when checked in), the elapsed time, and a check in/out button (large, success or danger)
  - the elapsed time is a signal updated by `interval(60_000)` while a shift is open
- **Everyone:** a lazy table of `AttendanceLog`, with hours shown through the `hours` pipe.

- [ ] **Step 1:** Write the spec. Assertions:
  - checking in calls `attendance.checkIn`, shows `.dot.on` and switches the label to "Check out"
  - staff do not see `.clock`
  - the elapsed timer stops on destroy
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** "Add Angular attendance page".
- [ ] **Step 6:** Study notes: RxJS `interval` with `takeUntilDestroyed`.

---

### Task 10: Mobile e2e against both apps, CI and Pages

**Files:**
- Modify: `web/playwright.config.ts`, `web/e2e/helpers.ts`, and the e2e specs (tag titles only)
- Modify: `.github/workflows/ci.yml` (the e2e job installs and builds both apps) and `.github/workflows/pages.yml`

**Interfaces:**
- **Playwright projects:**
  - The existing three Vue projects (`iphone-14`, `iphone-se`, `pixel-7`) keep their names.
  - Add `angular-iphone-14`, `angular-iphone-se` and `angular-pixel-7`, with `baseURL: 'http://localhost:4174'`, `metadata: { app: 'angular' }` and `grepInvert: /@full-app/`.
  - The `webServer` array gets a second entry: `cd ../web-angular && npx ng build --configuration e2e && cd ../web && npx vite preview --outDir ../web-angular/dist/salarynet/browser --port 4174 --strictPort`.
- **Helpers:** add `pagesFor(app: 'vue' | 'angular', role: Role): string[]`. Angular returns only the Phase 1 pages and no guides.
- **Tests to tag `@full-app`:** those that need pages Angular does not have yet:
  - departments, users, change password and the lockout/unlock flow
  - guides and the signed-out guide pages
  - the guide links on the login page
  - landscape and dark mode on guide pages
- **Selectors:** keep the existing ones. Where a PrimeNG class differs from PrimeVue (check the dialog close button, select overlay and paginator), switch the test to a role- or label-based locator that works in both apps. Do not add app branches inside tests.
- **`pages.yml`:**
  - after the Vue build, `cd web-angular && npm ci && npx ng build --configuration demo && cp -r dist/salarynet/browser ../web/dist/angular`
  - hash routing means no `404.html` fallback is needed
- **`ci.yml` e2e job:** run `npm ci` in `web-angular` too, then `npm run test:e2e` in `web`. Every project must pass.

- [ ] **Step 1:** Tag the tests and add the projects. Run `npm run test:e2e -- --project='angular-*'`. Expected: failures that point at real Angular mobile issues or selector differences.
- [ ] **Step 2:** Fix the Angular app until it passes. Change a test only when the difference is a library class name, not a behavior.
- [ ] **Step 3:** Run the full `npm run test:e2e`. Expected: all Vue runs still pass (303) and all Angular runs pass, with the count reported in the commit message.
- [ ] **Step 4:** Push, and check that CI is green and that `https://saharhalili95.github.io/SalaryNet/angular/` loads, signs in as each role in English and Hebrew, and has no horizontal scroll at 390px (check in the browser pane).
- [ ] **Step 5: Commit** "Run the mobile suite against the Angular app" and "Deploy the Angular build to /angular/".
- [ ] **Step 6:** Study notes: how the same e2e suite proves both front ends behave the same.

---

### Task 11: Documentation and recruiter-facing updates

**Files:**
- Modify:
  - `README.md`: the intro says "two front ends", plus a mermaid client node for Angular, the tech stack, "Running locally" for `web-angular`, a test section with the real counts, and a "Why two front ends" section
  - `shared/content/projectSummary.ts`: a front-end item stating Vue (full app) and Angular (core flows) on the same API
  - `shared/content/architecture.ts`: the view node text mentions both front ends; keep `code` pointing at an existing path
- Outside the repo, after CI is green:
  - `~/Desktop/Sahar_Halili_CV_updated.html` and the regenerated PDF: the SalaryNet line reads "Vue 3 + Angular front ends", plus an Angular skill chip. The PDF must still be one page; check its height as before.
  - `~/github-updates/html-portfolio` project data and `~/github-updates/SaharHalili95/README.md`: the SalaryNet tech list
  - `gh repo edit SaharHalili95/SalaryNet --description ...` and `--add-topic angular`

- [ ] **Step 1:** Run `cd web && npm test` (the content and translation tests cover the new text in both languages). Expected: PASS.
- [ ] **Step 2:** Update the README and content using only counts printed by CI.
- [ ] **Step 3:** Update the CV, portfolio and profile. Push each repo and check that the portfolio deploy is green.
- [ ] **Step 4: Commit** "Document the Angular front end" (SalaryNet), plus one commit per outside repo.
- [ ] **Step 5:** Final study-notes section: a 60-second spoken pitch for "why two front ends" and the five most likely Angular interview questions about this code.
