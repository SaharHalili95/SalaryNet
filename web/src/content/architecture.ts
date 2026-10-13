import type { Localized } from './localized'

export type NodeId =
  | 'view' | 'client'
  | 'auth' | 'policy' | 'filter' | 'controller' | 'errors'
  | 'service'
  | 'entity' | 'calculator'
  | 'repository' | 'unitOfWork' | 'jwt' | 'hasher'
  | 'database'

export interface Lane {
  id: string
  title: Localized
  /** Restaurant analogy for readers without a software background. */
  analogy: Localized
}

export interface DiagramNode {
  id: NodeId
  lane: number
  row: number
  label: Localized
  /** What this part is, in plain words. */
  plain: Localized
  code: string
}

export interface FlowStep {
  node: NodeId
  text: Localized
}

export interface Flow {
  id: string
  title: Localized
  request: string
  summary: Localized
  steps: FlowStep[]
}

export const lanes: Lane[] = [
  { id: 'browser', title: { en: 'Browser · Vue 3', he: 'דפדפן · Vue 3' },
    analogy: { en: 'The table and the menu: everything the guest sees and touches.', he: 'השולחן והתפריט: כל מה שהאורח רואה ונוגע בו.' } },
  { id: 'api', title: { en: 'API · ASP.NET Core', he: 'שרת · ASP.NET Core' },
    analogy: { en: 'The waiter at the door: checks who you are, whether you may order this, and that the order makes sense.', he: 'המלצר בכניסה: בודק מי אתה, אם מותר לך להזמין את זה, ושההזמנה הגיונית.' } },
  { id: 'application', title: { en: 'Application', he: 'שכבת האפליקציה' },
    analogy: { en: 'The shift manager: decides which steps fulfil the order and in what order.', he: 'מנהל המשמרת: מחליט אילו צעדים ממלאים את ההזמנה ובאיזה סדר.' } },
  { id: 'domain', title: { en: 'Domain', he: 'ליבה (Domain)' },
    analogy: { en: "The house rules and recipes: what is allowed, how pay and tax are calculated. They never change because of the kitchen's equipment.", he: 'כללי הבית והמתכונים: מה מותר, ואיך מחשבים שכר ומס. הם לא משתנים בגלל הציוד במטבח.' } },
  { id: 'infrastructure', title: { en: 'Infrastructure', he: 'תשתית' },
    analogy: { en: 'The kitchen equipment: the tools that talk to the storeroom, lock the safe and print the ID badges.', he: 'הציוד במטבח: הכלים שמדברים עם המחסן, נועלים את הכספת ומדפיסים תגי זיהוי.' } },
  { id: 'database', title: { en: 'SQL Server', he: 'SQL Server' },
    analogy: { en: 'The storeroom and the ledger: where everything is kept, with locks that stop mistakes such as paying someone twice.', he: 'המחסן ופנקס החשבונות: כאן הכול נשמר, עם מנעולים שמונעים טעויות כמו לשלם למישהו פעמיים.' } },
]

export const nodes: DiagramNode[] = [
  { id: 'view', lane: 0, row: 0, label: { en: 'Screen (view)', he: 'מסך (View)' }, plain: { en: 'The screen you click on.', he: 'המסך שעליו לוחצים.' }, code: 'web/src/views' },
  { id: 'client', lane: 0, row: 1.2, label: { en: 'Store + API client', he: 'Store ולקוח API' }, plain: { en: 'Keeps who is signed in and sends requests to the server.', he: 'זוכר מי מחובר ושולח בקשות לשרת.' }, code: 'web/src/api/httpApi.ts' },
  { id: 'auth', lane: 1, row: 0, label: { en: 'JWT authentication', he: 'אימות JWT' }, plain: { en: 'Checks the digital ID card (token) on every request.', he: 'בודק את תעודת הזהות הדיגיטלית (הטוקן) בכל בקשה.' }, code: 'src/SalaryNet.API/Program.cs' },
  { id: 'policy', lane: 1, row: 1, label: { en: 'Role policy', he: 'מדיניות תפקידים' }, plain: { en: 'Decides whether your role may do this action.', he: 'מחליט אם התפקיד שלך רשאי לבצע את הפעולה.' }, code: 'src/SalaryNet.API/Security/Policies.cs' },
  { id: 'filter', lane: 1, row: 2, label: { en: 'Validation filter', he: 'מסנן ולידציה' }, plain: { en: 'Checks the form is filled in correctly before anything else happens.', he: 'בודק שהטופס מולא נכון לפני שקורה משהו אחר.' }, code: 'src/SalaryNet.API/Filters/FluentValidationFilter.cs' },
  { id: 'controller', lane: 1, row: 3, label: { en: 'Controller', he: 'Controller' }, plain: { en: 'The entry point for one kind of request; hands it to the right service.', he: 'נקודת הכניסה לסוג אחד של בקשה, שמעבירה אותה לשירות הנכון.' }, code: 'src/SalaryNet.API/Controllers' },
  { id: 'errors', lane: 1, row: 4, label: { en: 'Error handler', he: 'טיפול בשגיאות' }, plain: { en: 'Turns any failure into a clear, consistent error message.', he: 'הופך כל תקלה להודעת שגיאה ברורה ואחידה.' }, code: 'src/SalaryNet.API/Errors/GlobalExceptionHandler.cs' },
  { id: 'service', lane: 2, row: 1.5, label: { en: 'Service', he: 'שירות (Service)' }, plain: { en: 'Runs the steps of one task, like creating an employee.', he: 'מריץ את השלבים של משימה אחת, למשל יצירת עובד.' }, code: 'src/SalaryNet.Application' },
  { id: 'entity', lane: 3, row: 1, label: { en: 'Entity rules', he: 'כללי הישות' }, plain: { en: 'The business rules every record must follow.', he: 'הכללים העסקיים שכל רשומה חייבת לעמוד בהם.' }, code: 'src/SalaryNet.Domain/Entities' },
  { id: 'calculator', lane: 3, row: 2.4, label: { en: 'Payroll calculator', he: 'מחשבון שכר' }, plain: { en: 'Works out income tax, social security and net pay.', he: 'מחשב מס הכנסה, ביטוח לאומי ושכר נטו.' }, code: 'src/SalaryNet.Domain/Services/PayrollCalculator.cs' },
  { id: 'repository', lane: 4, row: 0, label: { en: 'Repository · EF Core', he: 'Repository · EF Core' }, plain: { en: 'Reads and writes records in the database.', he: 'קורא וכותב רשומות במסד הנתונים.' }, code: 'src/SalaryNet.Infrastructure/Persistence/Repositories' },
  { id: 'unitOfWork', lane: 4, row: 1, label: { en: 'Unit of work', he: 'Unit of Work' }, plain: { en: 'Saves all changes of a task together, or none of them.', he: 'שומר את כל השינויים של משימה ביחד, או אף אחד מהם.' }, code: 'src/SalaryNet.Infrastructure/Persistence/UnitOfWork.cs' },
  { id: 'jwt', lane: 4, row: 2, label: { en: 'JWT issuer', he: 'הנפקת JWT' }, plain: { en: 'Prints the signed digital ID card after sign-in.', he: 'מדפיס את תעודת הזהות הדיגיטלית החתומה אחרי הכניסה.' }, code: 'src/SalaryNet.Infrastructure/Security/JwtAccessTokenGenerator.cs' },
  { id: 'hasher', lane: 4, row: 3, label: { en: 'Password hasher', he: 'גיבוב סיסמאות' }, plain: { en: 'Stores passwords scrambled so even we cannot read them.', he: 'שומר סיסמאות מוצפנות בגיבוב, כך שגם אנחנו לא יכולים לקרוא אותן.' }, code: 'src/SalaryNet.Infrastructure/Security/IdentityPasswordHasher.cs' },
  { id: 'database', lane: 5, row: 1.5, label: { en: 'Tables + indexes', he: 'טבלאות ואינדקסים' }, plain: { en: 'Where the data lives, with locks against duplicates.', he: 'המקום שבו הנתונים נשמרים, עם מנעולים נגד כפילויות.' }, code: 'src/SalaryNet.Infrastructure/Persistence/Configurations' },
]

export const flows: Flow[] = [
  {
    id: 'login',
    title: { en: 'Sign in', he: 'כניסה למערכת' },
    request: 'POST /api/auth/login',
    summary: {
      en: 'The password is checked against a salted hash, failures are counted for lockout, and a signed token comes back.',
      he: 'הסיסמה נבדקת מול גיבוב עם מלח, כישלונות נספרים לטובת נעילה, וחוזר טוקן חתום.',
    },
    steps: [
      { node: 'view', text: { en: 'The user submits email and password on the sign-in screen.', he: 'המשתמש שולח אימייל וסיסמה ממסך הכניסה.' } },
      { node: 'client', text: { en: 'The auth store calls the API client, which sends the JSON request.', he: 'ה-Store של ההתחברות קורא ללקוח ה-API, ששולח את הבקשה כ-JSON.' } },
      { node: 'filter', text: { en: 'FluentValidation checks the email format and that a password was sent. Bad input stops here with 400.', he: 'FluentValidation בודק את פורמט האימייל ושנשלחה סיסמה. קלט שגוי נעצר כאן עם 400.' } },
      { node: 'controller', text: { en: 'AuthController passes the request to the auth service. Controllers stay thin.', he: 'AuthController מעביר את הבקשה לשירות ההתחברות. ה-Controllers נשארים דקים.' } },
      { node: 'service', text: { en: 'AuthService loads the account by its normalized email.', he: 'AuthService טוען את החשבון לפי האימייל המנורמל.' } },
      { node: 'repository', text: { en: 'The user repository queries the Users table through EF Core.', he: 'ה-Repository של המשתמשים שולף מטבלת Users דרך EF Core.' } },
      { node: 'hasher', text: { en: 'The PBKDF2 hasher verifies the password. Unknown emails are checked against a dummy hash so timing reveals nothing.', he: 'מנגנון הגיבוב (PBKDF2) מאמת את הסיסמה. גם אימייל לא קיים נבדק מול גיבוב דמה, כדי שזמן התגובה לא יסגיר דבר.' } },
      { node: 'entity', text: { en: 'User.RegisterFailedLogin counts a wrong password; the fifth in a row locks the account for 15 minutes.', he: 'User.RegisterFailedLogin סופר סיסמה שגויה. החמישית ברצף נועלת את החשבון ל-15 דקות.' } },
      { node: 'jwt', text: { en: 'On success a JWT is signed with the user id, role and, for employees, their employee id.', he: 'בהצלחה נחתם JWT עם מזהה המשתמש, התפקיד, ולעובד גם מזהה העובד.' } },
      { node: 'client', text: { en: 'The token is kept in the store and sent as a Bearer header on every later request.', he: 'הטוקן נשמר ב-Store ונשלח ככותרת Bearer בכל בקשה בהמשך.' } },
    ],
  },
  {
    id: 'list-employees',
    title: { en: 'Search employees', he: 'חיפוש עובדים' },
    request: 'GET /api/employees?search=&page=',
    summary: {
      en: 'Filtering, sorting and paging all run in SQL, so only one page of rows ever leaves the database.',
      he: 'הסינון, המיון והחלוקה לעמודים רצים ב-SQL, כך שרק עמוד אחד של שורות יוצא ממסד הנתונים.',
    },
    steps: [
      { node: 'view', text: { en: 'Typing in the search box waits 300 ms (debounce) before asking the server.', he: 'הקלדה בתיבת החיפוש ממתינה 300 מילישניות (debounce) לפני שפונים לשרת.' } },
      { node: 'auth', text: { en: 'The JWT middleware validates the token signature, issuer, audience and expiry.', he: 'רכיב ה-JWT מאמת את חתימת הטוקן, המנפיק, הקהל ותוקף הזמן.' } },
      { node: 'policy', text: { en: 'The Staff policy allows Admin and HR only. An employee gets 403.', he: 'מדיניות Staff מתירה רק למנהל ולמשאבי אנוש. עובד יקבל 403.' } },
      { node: 'filter', text: { en: 'Page size is limited to 100 and enum values are checked.', he: 'גודל העמוד מוגבל ל-100, וערכי ה-enum נבדקים.' } },
      { node: 'service', text: { en: 'EmployeeService maps the result to DTOs, so entities never leave the application layer.', he: 'EmployeeService ממפה את התוצאה ל-DTO, כך שהישויות לא יוצאות משכבת האפליקציה.' } },
      { node: 'repository', text: { en: 'The repository adds WHERE, ORDER BY with a stable tie-breaker, then COUNT and OFFSET/FETCH.', he: 'ה-Repository מוסיף WHERE ו-ORDER BY עם שובר שוויון יציב, ואז COUNT ו-OFFSET/FETCH.' } },
      { node: 'database', text: { en: 'Indexes on name and status keep the query fast.', he: 'אינדקסים על השם ועל הסטטוס שומרים על שאילתה מהירה.' } },
      { node: 'view', text: { en: 'The table shows the page and the total count for the paginator.', he: 'הטבלה מציגה את העמוד ואת הספירה הכוללת עבור הדפדוף.' } },
    ],
  },
  {
    id: 'create-employee',
    title: { en: 'Create an employee', he: 'יצירת עובד' },
    request: 'POST /api/employees',
    summary: {
      en: 'Input is validated twice: by FluentValidation at the edge and by the entity itself, with the database as a final guard.',
      he: 'הקלט נבדק פעמיים: ב-FluentValidation בכניסה ובישות עצמה, ומסד הנתונים משמש שומר אחרון.',
    },
    steps: [
      { node: 'view', text: { en: 'HR fills in the employee form and submits it.', he: 'משאבי אנוש ממלאים את טופס העובד ושולחים.' } },
      { node: 'policy', text: { en: 'Only the Staff roles may create employees.', he: 'רק תפקידי הצוות רשאים ליצור עובדים.' } },
      { node: 'filter', text: { en: 'Rules check names, email format, a positive salary with two decimals and a known contract type. Errors return 400 per field.', he: 'הכללים בודקים שמות, פורמט אימייל, שכר חיובי עם שתי ספרות אחרי הנקודה וסוג העסקה מוכר. שגיאות חוזרות כ-400 לפי שדה.' } },
      { node: 'service', text: { en: 'The service checks the department exists and the email is free (409 if taken).', he: 'השירות בודק שהמחלקה קיימת ושהאימייל פנוי (409 אם תפוס).' } },
      { node: 'entity', text: { en: 'Employee.Create trims and lower-cases the email and guards every invariant again.', he: 'Employee.Create מסיר רווחים, מוריד את האימייל לאותיות קטנות, ובודק שוב כל כלל.' } },
      { node: 'unitOfWork', text: { en: 'The unit of work saves in one transaction and turns a unique-index violation into 409.', he: 'ה-Unit of Work שומר בטרנזקציה אחת, והופך הפרה של אינדקס ייחודי ל-409.' } },
      { node: 'database', text: { en: 'A unique index on Email is the last line of defence against duplicates.', he: 'אינדקס ייחודי על Email הוא קו ההגנה האחרון מפני כפילויות.' } },
      { node: 'controller', text: { en: 'The controller answers 201 Created with a Location header.', he: 'ה-Controller עונה 201 Created עם כותרת Location.' } },
    ],
  },
  {
    id: 'generate-payslip',
    title: { en: 'Generate a payslip', he: 'הפקת תלוש שכר' },
    request: 'POST /api/payroll',
    summary: {
      en: 'The domain calculator computes progressive tax, and a unique index guarantees one payslip per employee per month.',
      he: 'המחשבון בליבה מחשב מס מדורג, ואינדקס ייחודי מבטיח תלוש אחד לעובד בחודש.',
    },
    steps: [
      { node: 'view', text: { en: 'HR picks an employee, month and bonus.', he: 'משאבי אנוש בוחרים עובד, חודש ובונוס.' } },
      { node: 'filter', text: { en: 'Month must be 1-12, year 2000-2100 and the bonus not negative.', he: 'החודש חייב להיות 1 עד 12, השנה 2000 עד 2100, והבונוס לא שלילי.' } },
      { node: 'service', text: { en: 'PayrollService loads the employee and checks this period was not generated yet (409).', he: 'PayrollService טוען את העובד ובודק שהתקופה עוד לא הופקה (409).' } },
      { node: 'entity', text: { en: 'PayrollRecord.Generate refuses future periods and inactive employees (422).', he: 'PayrollRecord.Generate מסרב לתקופה עתידית ולעובד לא פעיל (422).' } },
      { node: 'calculator', text: { en: 'The calculator applies each tax bracket only to the income inside it, adds social security, and rounds every component.', he: 'המחשבון מחיל כל מדרגת מס רק על ההכנסה שבתוכה, מוסיף ביטוח לאומי, ומעגל כל רכיב.' } },
      { node: 'unitOfWork', text: { en: 'The payslip is saved; a concurrent duplicate fails on the index and becomes 409.', he: 'התלוש נשמר. בקשה כפולה שמגיעה במקביל נכשלת על האינדקס והופכת ל-409.' } },
      { node: 'database', text: { en: 'Unique index (EmployeeId, Year, Month) plus a check constraint that gross minus deductions equals net.', he: 'אינדקס ייחודי על (EmployeeId, Year, Month), ואילוץ שבודק שברוטו פחות ניכויים שווה לנטו.' } },
      { node: 'view', text: { en: 'The new payslip opens with the full breakdown.', he: 'התלוש החדש נפתח עם הפירוט המלא.' } },
    ],
  },
  {
    id: 'own-payslips',
    title: { en: 'Employee views payslips', he: 'עובד צופה בתלושים' },
    request: 'GET /api/payroll',
    summary: {
      en: 'The employee id is taken from the signed token, never from the request, which blocks IDOR attacks.',
      he: 'מזהה העובד נלקח מהטוקן החתום ולא מהבקשה, וכך נחסמות התקפות IDOR.',
    },
    steps: [
      { node: 'view', text: { en: 'An employee opens My payslips. A curious user could add ?employeeId=<someone else>.', he: 'עובד פותח את "התלושים שלי". משתמש סקרן עלול להוסיף ‎?employeeId=<מישהו אחר>.' } },
      { node: 'auth', text: { en: 'The validated token carries an employee_id claim that the client cannot forge.', he: 'הטוקן המאומת נושא שדה employee_id שהלקוח לא יכול לזייף.' } },
      { node: 'service', text: { en: 'For employee accounts the service overwrites the filter with the employee id from the token.', he: 'בחשבון עובד, השירות דורס את הסינון במזהה העובד מתוך הטוקן.' } },
      { node: 'repository', text: { en: 'The query can only ever return that employee\'s rows.', he: 'השאילתה יכולה להחזיר רק את השורות של אותו עובד.' } },
      { node: 'controller', text: { en: 'Asking for another payslip by id returns 404, not 403, so its existence is not revealed.', he: 'בקשה לתלוש של מישהו אחר לפי מזהה מחזירה 404 ולא 403, כדי לא לחשוף שהוא קיים.' } },
    ],
  },
  {
    id: 'attendance',
    title: { en: 'Check in and out', he: 'כניסה ויציאה ממשמרת' },
    request: 'POST /api/attendance/check-in · check-out',
    summary: {
      en: 'Hours are calculated by the server at check-out, and the database allows only one open shift per employee.',
      he: 'השעות מחושבות בשרת ביציאה, ומסד הנתונים מתיר משמרת פתוחה אחת בלבד לכל עובד.',
    },
    steps: [
      { node: 'view', text: { en: 'The employee presses Check in.', he: 'העובד לוחץ על "כניסה למשמרת".' } },
      { node: 'policy', text: { en: 'Only employee accounts can record attendance.', he: 'רק חשבונות עובדים יכולים לרשום נוכחות.' } },
      { node: 'service', text: { en: 'The service refuses a second open shift with 409.', he: 'השירות מסרב למשמרת פתוחה שנייה עם 409.' } },
      { node: 'entity', text: { en: 'At check-out AttendanceLog.CheckOutAt sets TotalHours from the two timestamps; nobody can type hours in.', he: 'ביציאה, AttendanceLog.CheckOutAt קובע את TotalHours משני הזמנים. אי אפשר להקליד שעות ידנית.' } },
      { node: 'database', text: { en: 'A filtered unique index (CheckOut IS NULL) backs up the one-open-shift rule.', he: 'אינדקס ייחודי מסונן (CheckOut IS NULL) מגבה את הכלל של משמרת פתוחה אחת.' } },
    ],
  },
  {
    id: 'lockout',
    title: { en: 'Account lockout and unlock', he: 'נעילת חשבון ושחרור' },
    request: 'POST /api/auth/login · POST /api/users/{id}/unlock',
    summary: {
      en: 'Five wrong passwords lock the account; an administrator can unlock it, and every refusal looks the same from outside.',
      he: 'חמש סיסמאות שגויות נועלות את החשבון, מנהל יכול לשחרר אותו, וכל סירוב נראה זהה מבחוץ.',
    },
    steps: [
      { node: 'service', text: { en: 'Each wrong password calls RegisterFailedLogin and saves the counter.', he: 'כל סיסמה שגויה קוראת ל-RegisterFailedLogin ושומרת את המונה.' } },
      { node: 'entity', text: { en: 'On the fifth failure LockoutEndsAt is set 15 minutes ahead. Attempts during a lockout do not extend it.', he: 'בכישלון החמישי נקבע LockoutEndsAt ל-15 דקות קדימה. ניסיונות בזמן הנעילה לא מאריכים אותה.' } },
      { node: 'controller', text: { en: 'Unknown, inactive and locked accounts all receive the same generic 401.', he: 'חשבון לא קיים, מושבת או נעול מקבל אותה תשובת 401 כללית.' } },
      { node: 'policy', text: { en: 'The Users screen and the unlock endpoint require the Admin role.', he: 'מסך המשתמשים ונקודת השחרור דורשים תפקיד מנהל.' } },
      { node: 'entity', text: { en: 'User.Unlock clears the counter and the lockout; a password reset does the same.', he: 'User.Unlock מאפס את המונה ואת הנעילה. איפוס סיסמה עושה אותו דבר.' } },
    ],
  },
  {
    id: 'errors',
    title: { en: 'When something goes wrong', he: 'כשמשהו משתבש' },
    request: 'Any request',
    summary: {
      en: 'One handler turns every exception into an RFC 7807 ProblemDetails response with the right status code.',
      he: 'רכיב אחד הופך כל חריגה לתשובת ProblemDetails לפי RFC 7807, עם קוד הסטטוס הנכון.',
    },
    steps: [
      { node: 'entity', text: { en: 'Domain rules throw DomainValidationException (400) or BusinessRuleViolationException (422).', he: 'כללי הליבה זורקים DomainValidationException (400) או BusinessRuleViolationException (422).' } },
      { node: 'service', text: { en: 'Services throw NotFound (404), Conflict (409), Forbidden (403) or Unauthorized (401).', he: 'השירותים זורקים NotFound (404), Conflict (409), Forbidden (403) או Unauthorized (401).' } },
      { node: 'errors', text: { en: 'GlobalExceptionHandler maps each type to a status and writes ProblemDetails with a traceId. Unknown errors become 500 without internal details.', he: 'GlobalExceptionHandler ממפה כל סוג לסטטוס וכותב ProblemDetails עם traceId. שגיאה לא מוכרת הופכת ל-500 בלי לחשוף פרטים פנימיים.' } },
      { node: 'client', text: { en: 'The API client turns the body into an ApiError.', he: 'לקוח ה-API הופך את גוף התשובה ל-ApiError.' } },
      { node: 'view', text: { en: 'Field errors appear under the matching inputs; anything else is shown as a toast.', he: 'שגיאות שדה מוצגות מתחת לשדות המתאימים, וכל השאר כהודעה קופצת.' } },
    ],
  },
]
