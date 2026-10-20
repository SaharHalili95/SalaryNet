# Angular front end for SalaryNet

## Intent

SalaryNet is Sahar's main portfolio project for junior .NET / full-stack roles. Several target job ads list Angular as a requirement (for example "Angular/React"), while others list Vue as an advantage. Today the project has only a Vue 3 front end.

We are adding a second front end in Angular, **next to Vue, not instead of it**. Both talk to the same ASP.NET Core API. The message for a recruiter or interviewer is: "the same backend serves two independent front ends, and the author is fluent in both Vue and Angular."

Sahar's condition: it must stay professional and make sense to a recruiter. Nothing that looks like a toy, a copy-paste, or a half-finished experiment.

## Goals

- **Committed scope is Phase 1 only** (see Phases): the core of the product in Angular, shipped, deployed and tested. Phases 2 and 3 are a later, separate decision Sahar makes after seeing Phase 1. Nothing in Phase 1 may depend on them happening.
- Idiomatic, current Angular that an Angular interviewer recognizes as good practice: standalone components, Signals, functional route guards, `HttpClient` with interceptors, Reactive Forms, RxJS where it is natural (debounced search), lazy-loaded routes.
- Same business behavior as Vue: roles (Admin/HR/Employee), IDOR scoping, lockout and admin unlock, payroll calculation, attendance, English and Hebrew with RTL.
- Runs on the live demo site with no server (demo mode), like Vue, and against the real API locally and in Docker.
- Tested and in CI with the same standard as Vue: unit tests for services and components, and the Playwright mobile suite on iPhone, iPhone SE and Pixel (in Phase 1, the tests that cover Phase 1 pages).
- Sahar can explain every part in an interview. After each part of the work, a short Hebrew explainer for Sahar: what was built, which Angular concept it shows (signal, interceptor, guard, Reactive Forms, RxJS), why it was done that way, and three or four likely interview questions with answers. These notes are personal study material and live outside the repository (for example on the Desktop), not in the public repo.
- Recruiter-facing clarity: the live site, README, About page, CV and portfolio explain the two front ends and let a visitor switch between them.

## Non-goals

- Replacing or rewriting the Vue app. Vue stays as is; changes to it are limited to what sharing code and the version switch require.
- Any backend changes. The API is already client-agnostic.
- Making the two apps pixel-identical. They should feel like the same product (same colors, layout, content), but each uses its own framework's idioms.

## Anti-goals (would be a failure even if it works)

- Business rules duplicated in two places that can drift apart. The demo engine, API client, payroll calculator and translations must exist once.
- An Angular app that looks generated or shallow: one giant component, `any` everywhere, logic in templates, no tests.
- Breaking the Vue app, its 54 Vitest tests, its 101 Playwright tests, or the current live URL `https://saharhalili95.github.io/SalaryNet/`.
- Claims in the README or CV that the code does not back up.

## Constraints

- Monorepo: everything lives in the existing `SalaryNet` repository.
- New folder `web-angular/` next to `web/`.
- Latest stable Angular major (22 at the time of writing). As with every dependency in this project, pin exact versions that have been published for at least two weeks.
- `npm audit` clean for production dependencies, as in the Vue app.
- TypeScript strict mode. CI fails on lint, type or test errors.
- Follow the repo's existing conventions: commit style, no em dashes in prose, English code and comments, Hebrew only in translation files.

## Decisions

### Decided with Sahar

- Angular is an addition alongside Vue, not a replacement.
- Build Phase 1 now (the core pages). Decide on Phases 2 and 3 after seeing it.
- Sahar gets a Hebrew explainer after each part so he can defend the code in interviews.
- Shared, framework-free code (rules, demo data, translations) is written once and used by both apps.

### My calls (Sahar can override)

- **Component library: PrimeNG.** It is the Angular sibling of PrimeVue, which the Vue app uses, and both share the `@primeuix/themes` design tokens. The two apps then look like one product with little styling work, and the parallel is easy to explain ("PrimeVue in one, PrimeNG in the other"). Angular Material was the alternative. It is better known, but it would make the two apps look unrelated and add theming work.
- **State: Signals plus small injectable services** (`AuthService`, `LocaleService`). No NgRx. The app's state is small, and a junior portfolio with NgRx for this size would look over-engineered. The design doc and README should say this was a deliberate choice.
- **Translations: a small `TranslateService` built on Signals** that reads the existing `en.ts` / `he.ts` dictionaries, with a `translate` pipe. The dictionaries use `{name}` placeholders and no plural forms, so this is a few dozen lines. `@angular/localize` compiles one build per language, which does not fit a runtime toggle. `ngx-translate` would mean converting the dictionaries to JSON and maintaining them twice.
- **Live demo URL:** the Angular build is deployed to `https://saharhalili95.github.io/SalaryNet/angular/` by the existing Pages workflow, in the same artifact as Vue. The Vue URL does not change.
- **Version switch:** a small, consistent control in both apps (topbar, plus a link on the login page): "Vue version / Angular version". The About page in each app explains the two front ends.
- **Ports:** Angular dev server on `4200`, proxying `/api` to `5080` like Vue. The Docker `full` profile gets a second nginx service on `8081` serving the Angular build.

## Sharing code

These files under `web/src` have no Vue dependency (at most a type-only import of `Locale`) and are the shared core:

- `api/client.ts`, `api/types.ts`, `api/errors.ts`, `api/httpApi.ts`
- `api/demo/demoApi.ts`, `api/demo/demoData.ts`, `api/demo/payrollCalculator.ts` (and their tests)
- `i18n/en.ts`, `i18n/he.ts`, `i18n/dataGlossary.ts`, `i18n/serverMessages.ts`
- `content/*.ts` (architecture, components, glossary, troubleshooting, project summary)

Not shared, because they depend on Vue, Pinia or `import.meta.env`: `api/index.ts`, `stores/*`, `i18n/index.ts`, `i18n/useLocalizedData.ts`, `utils/useApiError.ts`, and `utils/format.ts` (depends on the Vue i18n runtime).

**Required approach:** move the shared files into a new top-level `shared/` folder (for example `shared/api`, `shared/i18n`, `shared/content`), move `Locale` into a shared types file, and import that folder from both apps through a path alias. This happens with `git mv` so history is kept, and it is done first, as its own step: Vue must build and pass all of its tests after the move, before any Angular code exists. A workspace package is acceptable if it turns out simpler, as long as there is one copy of the code.

`format.ts` (money, dates, periods) should become a framework-free function that takes the locale as a parameter and lives in `shared/`. Vue's version then becomes a thin wrapper.

The shared folder's existing tests (payroll calculator pinned to the C# results, demo API, translation completeness) keep running in CI exactly once.

## The Angular app

### Structure

Feature-based layout under `web-angular/src/app/`: `core/` (auth, API provider, interceptors, guards, translate, locale), `layout/` (shell, sidebar, topbar), `features/<area>/` for each page, `shared/` for small reusable components (stat tile, chart canvas, payslip dialog). Every component is standalone. Routes are lazy-loaded per feature.

### Behavior that must match Vue

- **Routes and access:** the same routes, titles and role rules. Public pages are login, architecture, troubleshooting and about. Admin and HR see the dashboard, employees and departments. Users are Admin only. Payroll and attendance are for everyone, with employees scoped to themselves. A signed-in user opening `/login` is sent home. Hash routing in demo mode, as Vue does for GitHub Pages.
- **Auth:** the session is stored the same way, expires on time, and a 401 from the API signs the user out. In HTTP mode an interceptor attaches the JWT. In demo mode the shared demo API is used, as in Vue.
- **Demo mode:** a build-time flag (Angular environment or `define`) selects the demo API or the HTTP API, like `VITE_DEMO_MODE`. The random hire/leave simulation runs in demo mode.
- **Pages:** login with one-tap demo accounts and the credentials table; role-specific dashboards (HR focus panel, admin focus panel, charts with a table toggle); my overview; employees (search with debounce, filters, sort, paging, create/edit dialog with validation); departments; payroll (filters, payslip dialog, single and monthly run); attendance (check in/out); users (role, activate/deactivate, unlock, reset password); change password; architecture, troubleshooting and about pages built from the shared content.
- **Forms:** Reactive Forms. Client validation mirrors the server rules (password policy and so on), and server validation errors (ProblemDetails) map onto fields, as in Vue.
- **Language:** English default and a Hebrew toggle that persists. `dir="rtl"` and `lang` are set on `<html>`. Data names and server messages are translated through the shared glossary and server-message map.
- **Mobile:** it must pass the same rules the Vue app was fixed for. No horizontal scroll down to 320px, inputs at least 16px on phones, tap targets of at least 40px, a drawer menu that closes on backdrop tap and locks page scroll, and RTL that does not shift the page.
- **Charts:** Chart.js, sized responsively, with the same theme tokens for light and dark.

### Tests

- **Unit tests** for the core services (auth, translate, guards, interceptor) and the key components (login, employee form validation, payslip dialog). Use the runner the current Angular CLI ships with by default (Vitest or Karma/Jasmine), with no extra setup.
- **Mobile end-to-end:** reuse the existing Playwright suite against the Angular build, rather than writing a second suite. The tests rely on PrimeVue class names (`.p-dialog`, `.p-datatable-tbody`, `.p-select-overlay`) and on a few app classes (`.sidebar`, `.topbar`, `.demo-account`). PrimeNG uses the same `p-` class names for most components, so the Angular app should keep the app classes, and most selectors will work unchanged. For the rest, the builder should either move them to stable selectors (roles, labels, `data-testid`) that both apps provide, or parameterize the few selectors that differ. The suite must run against both apps in CI, and both must pass.

### CI and delivery

- `ci.yml`: a new job for Angular lint, type-check, unit tests and build. The mobile e2e job runs against both builds.
- `pages.yml`: build Vue to the site root as today and Angular to `/angular/`, and upload them as one artifact.
- `docker-compose.yml`: add an Angular web service on `8081` in the `full` profile, with an nginx config like Vue's.

### Documentation and recruiter-facing changes

- **README:** state "two front ends" in the intro, add Angular to the architecture diagram, the tech stack and the run instructions, and add a short "Why two front ends" section with the shared-core explanation.
- **In-app:** the About page (`content/projectSummary.ts`) and the architecture content mention both front ends. Both apps show the version switch.
- **After the work ships:** update the SalaryNet entry on the CV, portfolio site, GitHub profile README and repo description to "Vue 3 + Angular". Only claim test counts that CI actually runs.

## Phases

Each phase ends deployed, with CI green and the README describing exactly what exists. **Only Phase 1 is approved for building now.**

While only Phase 1 exists, the Angular app must look finished rather than missing pages: its navigation lists only the pages it has, the README and About page say plainly that the Angular version covers the core flows (sign-in, dashboards, employees, payroll, attendance) while the Vue version is the complete app, and links to Vue for the rest. No dead links, no "coming soon" placeholders.

1. **Shared core and Angular core (approved).**
   - Move the shared code into `shared/` and keep Vue green.
   - Scaffold the Angular app.
   - Build login, shell and navigation, the dashboard, employees, payroll with the payslip, attendance and my overview.
   - Ship English and Hebrew, both demo and HTTP modes, unit tests, the Playwright tests for these pages on Angular, the CI job, the Pages deploy to `/angular/`, the version switch, and README, About and CV wording for what exists.
2. **The rest of the app (later decision).** Departments, users and unlock, change password, admin and HR focus panels, and the Playwright suite passing on Angular.
3. **Guides (later decision).** Architecture, troubleshooting and about pages, Docker service, final README, CV, portfolio and profile updates.

## Left to the builder

- Exact versions within the constraints above.
- The shared-folder mechanics (path alias or workspace package) and the details of making Vite and the Angular builder both resolve it.
- Component breakdown inside each feature.
- How e2e selectors are made app-agnostic.
- Whether PrimeNG's current major pairs with the `@primeuix/themes` version Vue uses, or each app uses the theme version its library needs. Shared colors matter, a shared package version does not.
