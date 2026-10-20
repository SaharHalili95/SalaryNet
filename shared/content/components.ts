import type { NodeId } from './architecture'
import type { Localized } from './localized'

/** Everything a reader needs to understand one box on the diagram. */
export interface ComponentDetail {
  tech: string
  job: Localized
  from: Localized
  to: Localized
  how: Localized
}

export const componentDetails: Record<NodeId, ComponentDetail> = {
  view: {
    tech: 'Vue 3 · TypeScript · PrimeVue',
    job: { en: 'Show data clearly and turn clicks and typing into actions.', he: 'להציג נתונים בצורה ברורה ולהפוך לחיצות והקלדות לפעולות.' },
    from: { en: 'The user (clicks, forms) and data returned by the API client.', he: 'מהמשתמש (לחיצות וטפסים) ומהנתונים שלקוח ה-API מחזיר.' },
    to: { en: 'Asks the store or API client to load or change data.', he: 'מבקש מה-Store או מלקוח ה-API לטעון או לשנות נתונים.' },
    how: { en: 'Each screen is a Vue component. Reactive state redraws only what changed; PrimeVue supplies tables, dialogs and forms.', he: 'כל מסך הוא רכיב Vue. מצב ריאקטיבי מצייר מחדש רק את מה שהשתנה, ו-PrimeVue מספק טבלאות, חלונות וטפסים.' },
  },
  client: {
    tech: 'Pinia · fetch API · TypeScript interface',
    job: { en: 'Remember who is signed in and talk to the server in one consistent way.', he: 'לזכור מי מחובר ולדבר עם השרת בצורה אחידה.' },
    from: { en: 'Screens that need data or want to save something.', he: 'ממסכים שצריכים נתונים או רוצים לשמור משהו.' },
    to: { en: 'HTTP requests with the token to the API; typed results or an ApiError back to the screen.', he: 'בקשות HTTP עם הטוקן אל ה-API, ובחזרה למסך תוצאות עם טיפוסים או ApiError.' },
    how: { en: 'One SalaryNetApi interface with two implementations: HTTP for the real server and an in-browser demo. Screens never know which one runs.', he: 'ממשק SalaryNetApi אחד עם שני מימושים: HTTP לשרת האמיתי, ודמו שרץ בדפדפן. המסכים לא יודעים איזה מהם רץ.' },
  },
  auth: {
    tech: 'ASP.NET Core JWT Bearer middleware',
    job: { en: 'Prove who is calling before any code runs.', he: 'להוכיח מי פונה לפני שקוד כלשהו רץ.' },
    from: { en: 'Every incoming HTTP request with an Authorization: Bearer header.', he: 'מכל בקשת HTTP שנכנסת עם כותרת Authorization: Bearer.' },
    to: { en: 'A signed-in user (id, role, employee id) for the rest of the pipeline, or 401.', he: 'משתמש מזוהה (מזהה, תפקיד, מזהה עובד) לשאר הצינור, או 401.' },
    how: { en: 'Checks the token signature with the server secret, plus issuer, audience and expiry. A changed token fails the signature check.', he: 'בודק את חתימת הטוקן מול הסוד של השרת, וגם את המנפיק, הקהל ותוקף הזמן. טוקן ששונה נכשל בבדיקת החתימה.' },
  },
  policy: {
    tech: 'ASP.NET Core authorization policies',
    job: { en: 'Allow each action only to the roles that may perform it.', he: 'להתיר כל פעולה רק לתפקידים שרשאים לבצע אותה.' },
    from: { en: 'The signed-in user from JWT authentication and the [Authorize] attribute on the endpoint.', he: 'מהמשתמש שזוהה באימות ה-JWT ומהמאפיין [Authorize] על נקודת הקצה.' },
    to: { en: 'Lets the request continue to the controller, or answers 403.', he: 'מאפשר לבקשה להמשיך ל-Controller, או עונה 403.' },
    how: { en: 'Three named policies (Staff, AdminOnly, EmployeeOnly) compare the role claim with the allowed roles.', he: 'שלוש מדיניויות בשם (Staff, AdminOnly, EmployeeOnly) משוות את התפקיד שבטוקן לתפקידים המותרים.' },
  },
  filter: {
    tech: 'MVC action filter · FluentValidation',
    job: { en: 'Reject bad input early, with an error per field.', he: 'לדחות קלט שגוי מוקדם, עם שגיאה לכל שדה.' },
    from: { en: 'The request body or query after model binding.', he: 'מגוף הבקשה או מהפרמטרים, אחרי שהומרו לאובייקט.' },
    to: { en: 'Clean input to the controller, or a 400 with the failed fields.', he: 'קלט תקין ל-Controller, או 400 עם השדות שנכשלו.' },
    how: { en: 'Finds the validator registered for each argument type and runs its rules (required, email, ranges, password policy).', he: 'מוצא את המאמת שרשום לכל סוג פרמטר ומריץ את הכללים שלו (חובה, אימייל, טווחים, מדיניות סיסמה).' },
  },
  controller: {
    tech: 'ASP.NET Core Web API controllers',
    job: { en: 'Map a URL and HTTP verb to one use case and pick the right status code.', he: 'למפות כתובת ופעולת HTTP למקרה שימוש אחד, ולבחור את קוד הסטטוס הנכון.' },
    from: { en: 'A validated, authorized request.', he: 'מבקשה שעברה ולידציה והרשאה.' },
    to: { en: 'Calls one service method; returns JSON with 200, 201 or 204.', he: 'קורא לפעולה אחת בשירות, ומחזיר JSON עם 200, ‏201 או 204.' },
    how: { en: 'Deliberately thin: no business logic, so the same rules work from any caller and are easy to test.', he: 'דק בכוונה: אין בו לוגיקה עסקית, כך שאותם כללים עובדים מכל מקום שקורא להם, וקל לבדוק אותם.' },
  },
  errors: {
    tech: 'IExceptionHandler · ProblemDetails (RFC 7807)',
    job: { en: 'Make every failure a clear, consistent and safe response.', he: 'להפוך כל תקלה לתשובה ברורה, אחידה ובטוחה.' },
    from: { en: 'Any exception thrown anywhere while handling the request.', he: 'מכל חריגה שנזרקת במקום כלשהו בזמן הטיפול בבקשה.' },
    to: { en: 'A JSON error with status, title, detail and traceId to the client.', he: 'שגיאת JSON עם סטטוס, כותרת, פירוט ו-traceId ללקוח.' },
    how: { en: 'Maps exception types to 400/401/403/404/409/422. Unknown errors are logged and returned as 500 without internal details.', he: 'ממפה סוגי חריגות ל-400/401/403/404/409/422. שגיאות לא מוכרות נרשמות ביומן ומוחזרות כ-500 בלי פרטים פנימיים.' },
  },
  service: {
    tech: 'C# application services (dependency injection)',
    job: { en: 'Run one business task from start to finish, in the right order.', he: 'להריץ משימה עסקית אחת מתחילה ועד סוף, בסדר הנכון.' },
    from: { en: 'Controllers, with a request DTO and the current user.', he: 'מה-Controllers, עם DTO של הבקשה והמשתמש הנוכחי.' },
    to: { en: 'Uses repositories and domain objects; returns a DTO to the controller.', he: 'משתמש ב-Repositories ובאובייקטים של הליבה, ומחזיר DTO ל-Controller.' },
    how: { en: 'Depends only on interfaces (repositories, unit of work, clock), so tests replace them with fakes. Also enforces cross-record rules such as unique emails and IDOR scoping.', he: 'תלוי רק בממשקים (Repositories, ‏Unit of Work, שעון), כך שבבדיקות מחליפים אותם בתחליפים. הוא גם אוכף כללים בין רשומות, כמו אימייל ייחודי והגבלת IDOR.' },
  },
  entity: {
    tech: 'Plain C# domain model (no framework)',
    job: { en: 'Guarantee a record can never be in an invalid state.', he: 'להבטיח שרשומה לעולם לא תהיה במצב לא תקין.' },
    from: { en: 'Services that create or change an employee, payslip, shift or user.', he: 'משירותים שיוצרים או משנים עובד, תלוש, משמרת או משתמש.' },
    to: { en: 'A valid object, or a domain exception explaining which rule was broken.', he: 'אובייקט תקין, או חריגה שמסבירה איזה כלל הופר.' },
    how: { en: 'Private setters and factory methods: the only way to change data is through methods that check the rules (Deactivate, CheckOutAt, RegisterFailedLogin).', he: 'Setters פרטיים ומתודות יצירה: הדרך היחידה לשנות נתונים היא דרך מתודות שבודקות את הכללים (Deactivate, ‏CheckOutAt, ‏RegisterFailedLogin).' },
  },
  calculator: {
    tech: 'C# domain service · decimal arithmetic',
    job: { en: 'Calculate gross, tax, social security and net pay exactly.', he: 'לחשב בדיוק ברוטו, מס, ביטוח לאומי ונטו.' },
    from: { en: 'PayrollRecord.Generate, with the employee\'s salary, bonus and contract type.', he: 'מ-PayrollRecord.Generate, עם השכר, הבונוס וסוג ההעסקה של העובד.' },
    to: { en: 'A breakdown that the payslip stores.', he: 'פירוט שהתלוש שומר.' },
    how: { en: 'Applies each tax bracket only to the income inside it, uses decimal (not floating point) and rounds every part, so gross minus deductions always equals net.', he: 'מחיל כל מדרגת מס רק על ההכנסה שבתוכה, משתמש ב-decimal (לא בנקודה צפה) ומעגל כל רכיב, כך שברוטו פחות ניכויים תמיד שווה לנטו.' },
  },
  repository: {
    tech: 'Entity Framework Core 8 · LINQ',
    job: { en: 'Read and write records without exposing SQL to the rest of the code.', he: 'לקרוא ולכתוב רשומות בלי לחשוף SQL לשאר הקוד.' },
    from: { en: 'Services, through repository interfaces defined in the application layer.', he: 'משירותים, דרך ממשקי Repository ששכבת האפליקציה מגדירה.' },
    to: { en: 'Entities or pages of results back to the service.', he: 'ישויות או עמודי תוצאות בחזרה לשירות.' },
    how: { en: 'Builds LINQ queries that EF Core translates to SQL: filters, sorting and paging run in the database, and read-only queries skip change tracking.', he: 'בונה שאילתות LINQ ש-EF Core מתרגם ל-SQL: סינון, מיון וחלוקה לעמודים רצים במסד הנתונים, ושאילתות קריאה בלבד מוותרות על מעקב שינויים.' },
  },
  unitOfWork: {
    tech: 'EF Core DbContext · SQL transaction',
    job: { en: 'Save all changes of one task together, or none at all.', he: 'לשמור את כל השינויים של משימה אחת ביחד, או בכלל לא.' },
    from: { en: 'A service when its task is complete.', he: 'משירות, כשהמשימה שלו הסתיימה.' },
    to: { en: 'Committed data in SQL Server, or a 409 ConflictException.', he: 'נתונים שמורים ב-SQL Server, או ConflictException עם 409.' },
    how: { en: 'Calls SaveChanges once per task and catches SQL errors 2601/2627 (unique index violations) to turn them into a friendly conflict.', he: 'קורא ל-SaveChanges פעם אחת לכל משימה, ותופס את שגיאות SQL ‏2601/2627 (הפרת אינדקס ייחודי) כדי להפוך אותן להודעת התנגשות ברורה.' },
  },
  jwt: {
    tech: 'Microsoft.IdentityModel · HMAC-SHA256',
    job: { en: 'Issue a signed token after a successful sign-in.', he: 'להנפיק טוקן חתום אחרי כניסה מוצלחת.' },
    from: { en: 'AuthService, with the user who just signed in.', he: 'מ-AuthService, עם המשתמש שזה עתה נכנס.' },
    to: { en: 'A token and its expiry time, returned to the browser.', he: 'טוקן ותוקף, שחוזרים לדפדפן.' },
    how: { en: 'Writes the user id, email, role and employee id as claims and signs them with a secret key of at least 256 bits; the token expires after an hour.', he: 'כותב את מזהה המשתמש, האימייל, התפקיד ומזהה העובד כשדות בטוקן, וחותם עליהם במפתח סודי של 256 ביט לפחות. הטוקן פג אחרי שעה.' },
  },
  hasher: {
    tech: 'ASP.NET Core Identity PasswordHasher (PBKDF2)',
    job: { en: 'Store passwords so that a database leak does not reveal them.', he: 'לשמור סיסמאות כך שדליפה ממסד הנתונים לא תחשוף אותן.' },
    from: { en: 'AuthService and UserService when a password is checked or set.', he: 'מ-AuthService ומ-UserService, כשבודקים או קובעים סיסמה.' },
    to: { en: 'A hash to save, or yes/no for a password check.', he: 'גיבוב לשמירה, או כן/לא לבדיקת סיסמה.' },
    how: { en: 'Salts each password and runs PBKDF2 with many iterations; the hash records its version so the strength can be raised later.', he: 'מוסיף מלח לכל סיסמה ומריץ PBKDF2 בהרבה סבבים. הגיבוב שומר את הגרסה שלו, כך שאפשר להקשיח אותו בהמשך.' },
  },
  database: {
    tech: 'SQL Server 2022 · EF Core migrations',
    job: { en: 'Store data durably and enforce the rules that must never break.', he: 'לשמור נתונים לאורך זמן ולאכוף כללים שאסור שיישברו.' },
    from: { en: 'SQL from EF Core.', he: 'משאילתות SQL ש-EF Core שולח.' },
    to: { en: 'Rows back to the repository, or an error when a constraint is violated.', he: 'שורות בחזרה ל-Repository, או שגיאה כשאילוץ מופר.' },
    how: { en: 'Unique indexes (email, one payslip per month, one open shift), check constraints (month 1-12, gross minus deductions equals net) and foreign keys. Schema changes ship as versioned migrations.', he: 'אינדקסים ייחודיים (אימייל, תלוש אחד לחודש, משמרת פתוחה אחת), אילוצי בדיקה (חודש 1 עד 12, ברוטו פחות ניכויים שווה לנטו) ומפתחות זרים. שינויים במבנה מגיעים כמיגרציות עם גרסה.' },
  },
}
