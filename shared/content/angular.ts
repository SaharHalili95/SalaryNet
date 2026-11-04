import { componentDetails, type ComponentDetail } from './components'
import { flows, lanes, nodes, type DiagramNode, type Flow, type Lane, type NodeId } from './architecture'
import type { Localized } from './localized'

/*
 * The Angular guides reuse the shared diagram, flows and component catalog. Only the browser side differs,
 * so this file overrides the browser lane, its two boxes and the flow steps that describe Vue code.
 */

const browserLane: Lane = {
  ...lanes[0]!,
  title: { en: 'Browser · Angular', he: 'דפדפן · Angular' },
}

const browserNodes: Partial<Record<NodeId, Partial<DiagramNode>>> = {
  view: {
    label: { en: 'Component (view)', he: 'רכיב (Component)' },
    code: 'web-angular/src/app/features',
  },
  client: {
    label: { en: 'Services + HttpClient', he: 'שירותים ו-HttpClient' },
    plain: { en: 'Keeps who is signed in and sends requests to the server through interceptors.', he: 'זוכר מי מחובר ושולח בקשות לשרת דרך Interceptors.' },
    code: 'web-angular/src/app/core/http-api.ts',
  },
}

const browserDetails: Partial<Record<NodeId, ComponentDetail>> = {
  view: {
    tech: 'Angular 22 · standalone components · Angular Material',
    job: { en: 'Show data clearly and turn clicks and typing into actions.', he: 'להציג נתונים בצורה ברורה ולהפוך לחיצות והקלדות לפעולות.' },
    from: { en: 'The user (clicks, forms) and data returned through the SALARYNET_API token.', he: 'מהמשתמש (לחיצות וטפסים) ומהנתונים שחוזרים דרך ה-Token ‏SALARYNET_API.' },
    to: { en: 'Asks injected services to load or change data.', he: 'מבקש משירותים מוזרקים לטעון או לשנות נתונים.' },
    how: { en: 'Each screen is a lazy-loaded standalone component. State lives in signals, so only what changed is redrawn; Angular Material supplies tables, dialogs and form fields, and Reactive Forms hold the inputs and their validation.', he: 'כל מסך הוא רכיב Standalone שנטען רק כשצריך. המצב נשמר ב-Signals, כך שרק מה שהשתנה מצויר מחדש. Angular Material מספק טבלאות, חלונות ושדות טופס, ו-Reactive Forms מחזיקים את הקלט ואת הוולידציה שלו.' },
  },
  client: {
    tech: 'Signals · HttpClient · functional interceptors · DI token',
    job: { en: 'Remember who is signed in and talk to the server in one consistent way.', he: 'לזכור מי מחובר ולדבר עם השרת בצורה אחידה.' },
    from: { en: 'Components that need data or want to save something.', he: 'מרכיבים שצריכים נתונים או רוצים לשמור משהו.' },
    to: { en: 'HTTP requests with the token to the API; typed results or an ApiError back to the component.', he: 'בקשות HTTP עם הטוקן אל ה-API, ובחזרה לרכיב תוצאות עם טיפוסים או ApiError.' },
    how: { en: 'Components inject the SALARYNET_API token, never an implementation: HttpClient for the real server, or the shared in-browser demo. One interceptor adds the Bearer token, another turns ProblemDetails into the shared ApiError.', he: 'הרכיבים מזריקים את ה-Token ‏SALARYNET_API ולעולם לא מימוש מסוים: HttpClient לשרת האמיתי, או הדמו המשותף שרץ בדפדפן. Interceptor אחד מוסיף את טוקן ה-Bearer, ואחר הופך ProblemDetails ל-ApiError המשותף.' },
  },
}

/** Flow steps whose wording is about Vue code, keyed by flow id and step index. */
const stepTexts: Record<string, Record<number, Localized>> = {
  login: {
    1: { en: 'AuthService calls the API through HttpClient, which sends the JSON request.', he: 'AuthService קורא ל-API דרך HttpClient, ששולח את הבקשה כ-JSON.' },
    9: { en: 'The token is kept in the SessionStore signal, and the auth interceptor adds it as a Bearer header to every later request.', he: 'הטוקן נשמר ב-Signal של SessionStore, וה-Interceptor של ההתחברות מוסיף אותו ככותרת Bearer לכל בקשה בהמשך.' },
  },
  'list-employees': {
    0: { en: 'The search box is a signal turned into an RxJS stream: debounceTime(300) waits for typing to stop, and switchMap drops a late older answer.', he: 'תיבת החיפוש היא Signal שהופך לזרם RxJS: ‏debounceTime(300) ממתין שההקלדה תיעצר, ו-switchMap זורק תשובה ישנה שמגיעה באיחור.' },
  },
  errors: {
    3: { en: 'The problemDetails interceptor turns the body into the shared ApiError.', he: 'ה-Interceptor של problemDetails הופך את גוף התשובה ל-ApiError המשותף.' },
  },
}

export const angularLanes: Lane[] = [browserLane, ...lanes.slice(1)]

export const angularNodes: DiagramNode[] = nodes.map((node) => ({ ...node, ...browserNodes[node.id] }))

export const angularComponentDetails: Record<NodeId, ComponentDetail> = { ...componentDetails, ...browserDetails }

export const angularFlows: Flow[] = flows.map((flow) => ({
  ...flow,
  steps: flow.steps.map((step, i) => ({ ...step, text: stepTexts[flow.id]?.[i] ?? step.text })),
}))

export interface AngularFeature {
  id: string
  icon: string
  title: Localized
  text: Localized
  code: string
}

/** What this front end shows about Angular itself, each point tied to the file that does it. */
export const angularFeatures: AngularFeature[] = [
  {
    id: 'standalone',
    icon: 'widgets',
    title: { en: 'Standalone components and lazy routes', he: 'רכיבי Standalone ונתיבים שנטענים לפי הצורך' },
    text: { en: 'No NgModules. Every page is a standalone component loaded with loadComponent only when it is opened, so the first load stays small.', he: 'בלי NgModules. כל עמוד הוא רכיב Standalone שנטען עם loadComponent רק כשפותחים אותו, כך שהטעינה הראשונה נשארת קטנה.' },
    code: 'web-angular/src/app/app.routes.ts',
  },
  {
    id: 'signals',
    icon: 'bolt',
    title: { en: 'Signals for state', he: 'Signals לניהול מצב' },
    text: { en: 'The session, the language and each page’s data are signals. computed() derives values such as the menu for the current role, and the screen updates only where they are read.', he: 'החיבור, השפה והנתונים של כל עמוד הם Signals. ‏computed() גוזר ערכים כמו התפריט לפי התפקיד, והמסך מתעדכן רק במקום שבו קוראים אותם.' },
    code: 'web-angular/src/app/core/session.store.ts',
  },
  {
    id: 'guards',
    icon: 'verified_user',
    title: { en: 'Functional route guards', he: 'Guards פונקציונליים לנתיבים' },
    text: { en: 'authGuard, loginGuard and roleGuard([…]) are plain functions. An employee who types /dashboard is sent to their own page before anything loads; the server still enforces the same rule.', he: 'authGuard, ‏loginGuard ו-roleGuard הם פונקציות פשוטות. עובד שמקליד ‎/dashboard מועבר לעמוד שלו לפני שמשהו נטען, והשרת עדיין אוכף את אותו כלל.' },
    code: 'web-angular/src/app/core/guards.ts',
  },
  {
    id: 'interceptors',
    icon: 'swap_vert',
    title: { en: 'HTTP interceptors', he: 'HTTP Interceptors' },
    text: { en: 'One interceptor attaches the JWT to every call; another turns RFC 7807 ProblemDetails into the shared ApiError, so components handle the real server and the demo the same way.', he: 'Interceptor אחד מצרף את ה-JWT לכל קריאה, ואחר הופך ProblemDetails לפי RFC 7807 ל-ApiError המשותף, כך שהרכיבים מטפלים בשרת האמיתי ובדמו באותה דרך.' },
    code: 'web-angular/src/app/core/interceptors.ts',
  },
  {
    id: 'di',
    icon: 'hub',
    title: { en: 'Dependency injection with one token', he: 'הזרקת תלויות עם Token אחד' },
    text: { en: 'Components inject SALARYNET_API, an InjectionToken for the contract shared with Vue. Its factory picks HttpClient or the in-browser demo, and tests swap in a fake.', he: 'הרכיבים מזריקים את SALARYNET_API, ‏InjectionToken לחוזה שמשותף עם Vue. ה-Factory שלו בוחר HttpClient או את הדמו שרץ בדפדפן, ובבדיקות מחליפים אותו בתחליף.' },
    code: 'web-angular/src/app/core/api.ts',
  },
  {
    id: 'rxjs',
    icon: 'stream',
    title: { en: 'RxJS where streams fit', he: 'RxJS במקום שבו זרמים מתאימים' },
    text: { en: 'Employee search combines the search signal and filters with debounceTime and switchMap, so fast typing sends few requests and an old answer never overwrites a new one.', he: 'חיפוש העובדים משלב את Signal החיפוש והסינונים עם debounceTime ו-switchMap, כך שהקלדה מהירה שולחת מעט בקשות, ותשובה ישנה לעולם לא דורסת חדשה.' },
    code: 'web-angular/src/app/features/employees/employees.ts',
  },
  {
    id: 'forms',
    icon: 'edit_note',
    title: { en: 'Reactive Forms with server errors', he: 'Reactive Forms עם שגיאות מהשרת' },
    text: { en: 'Forms are typed with NonNullableFormBuilder. When the server rejects a field, its message is set on that control and shown under the matching input.', he: 'הטפסים מוגדרים עם טיפוסים דרך NonNullableFormBuilder. כשהשרת דוחה שדה, ההודעה שלו נקבעת על אותו שדה ומוצגת מתחת לקלט המתאים.' },
    code: 'web-angular/src/app/features/employees/employee-dialog.ts',
  },
  {
    id: 'i18n',
    icon: 'translate',
    title: { en: 'Two languages, one dictionary', he: 'שתי שפות, מילון אחד' },
    text: { en: 'A translate pipe reads the same English and Hebrew dictionaries as Vue. Switching language flips the page to right-to-left, and page titles are translated by a custom TitleStrategy.', he: 'Pipe של תרגום קורא את אותם מילונים באנגלית ובעברית ש-Vue משתמשת בהם. החלפת שפה הופכת את העמוד לימין-לשמאל, וכותרות העמודים מתורגמות ב-TitleStrategy מותאם.' },
    code: 'web-angular/src/app/core/locale.service.ts',
  },
]

/** How the Angular version relates to the Vue one, for the About page. */
export const angularScope: Localized[] = [
  { en: 'Built on the same API contract, demo engine, business rules and translations as the Vue app, from the shared folder.', he: 'בנוי על אותו חוזה API, מנוע דמו, כללים עסקיים ותרגומים כמו אפליקציית Vue, מתוך התיקייה המשותפת.' },
  { en: 'Covers the core flows: sign-in, dashboard, employees, payroll and payslips, attendance and the employee overview.', he: 'מכסה את התהליכים המרכזיים: כניסה, לוח בקרה, עובדים, שכר ותלושים, נוכחות והסקירה של העובד.' },
  { en: 'Departments, users and troubleshooting live in the Vue version, which is the full app.', he: 'מחלקות, משתמשים ופתרון תקלות נמצאים בגרסת Vue, שהיא האפליקציה המלאה.' },
  { en: 'Its own unit tests in Vitest, and the same Playwright mobile tests run against it on iPhone, a small iPhone and Android.', he: 'בדיקות יחידה משלה ב-Vitest, ואותן בדיקות מובייל ב-Playwright רצות גם עליה, על אייפון, אייפון קטן ואנדרואיד.' },
]
