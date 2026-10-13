import type { Localized } from './localized'

export type IssueCategory = 'accounts' | 'payroll' | 'attendance' | 'employees' | 'development'

export interface Issue {
  id: string
  category: IssueCategory
  /** HTTP status the user sees, when the issue surfaces through the API. */
  status?: number
  title: Localized
  symptom: Localized
  cause: Localized
  fix: Localized[]
  code?: string
}

export const issues: Issue[] = [
  {
    id: 'locked-account',
    category: 'accounts',
    status: 401,
    title: { en: 'A user cannot sign in although the password is right', he: 'משתמש לא מצליח להתחבר למרות שהסיסמה נכונה' },
    symptom: { en: '"Invalid email or password" even with the correct password.', he: 'ההודעה "Invalid email or password" מופיעה גם עם הסיסמה הנכונה.' },
    cause: { en: 'After 5 wrong passwords in a row the account is locked for 15 minutes, or an admin deactivated it. The message is generic on purpose.', he: 'אחרי 5 סיסמאות שגויות ברצף החשבון ננעל ל-15 דקות, או שמנהל השבית אותו. ההודעה כללית בכוונה.' },
    fix: [
      { en: 'Sign in as Admin and open Users.', he: 'להתחבר כמנהל ולפתוח את מסך המשתמשים.' },
      { en: 'If the status is Locked, choose Unlock account (or wait 15 minutes).', he: 'אם הסטטוס "נעול", לבחור "שחרור נעילה" (או לחכות 15 דקות).' },
      { en: 'If it is Inactive, choose Reactivate. If the password is forgotten, use Reset password.', he: 'אם הסטטוס "לא פעיל", לבחור "הפעלה מחדש". אם הסיסמה נשכחה, להשתמש ב"איפוס סיסמה".' },
    ],
    code: 'src/SalaryNet.Domain/Entities/User.cs',
  },
  {
    id: 'weak-password',
    category: 'accounts',
    status: 400,
    title: { en: 'A new password is rejected', he: 'סיסמה חדשה נדחית' },
    symptom: { en: 'Creating an account or changing a password shows an error under the password field.', he: 'ביצירת חשבון או בהחלפת סיסמה מופיעה שגיאה מתחת לשדה הסיסמה.' },
    cause: { en: 'The password policy needs 8+ characters with an uppercase letter, a lowercase letter and a digit, and a new password must differ from the current one.', he: 'מדיניות הסיסמה דורשת לפחות 8 תווים, עם אות גדולה, אות קטנה וספרה, וסיסמה חדשה חייבת להיות שונה מהנוכחית.' },
    fix: [{ en: 'Choose a password such as Spring2026 that meets every rule.', he: 'לבחור סיסמה כמו Spring2026 שעומדת בכל הכללים.' }],
    code: 'src/SalaryNet.Application/Users/PasswordPolicy.cs',
  },
  {
    id: 'admin-self',
    category: 'accounts',
    status: 422,
    title: { en: 'An admin cannot deactivate their own account', he: 'מנהל לא יכול להשבית את החשבון של עצמו' },
    symptom: { en: 'Deactivate and Change role are disabled on your own row.', he: 'האפשרויות "השבתה" ו"שינוי תפקיד" חסומות בשורה שלך.' },
    cause: { en: 'A deliberate rule so the system can never be left without an administrator.', he: 'כלל מכוון, כדי שהמערכת לעולם לא תישאר בלי מנהל.' },
    fix: [{ en: 'Ask another administrator to make the change.', he: 'לבקש ממנהל אחר לבצע את השינוי.' }],
    code: 'src/SalaryNet.Application/Users/UserService.cs',
  },
  {
    id: 'forbidden',
    category: 'accounts',
    status: 403,
    title: { en: '"Access denied" on a screen or action', he: '"אין הרשאה" במסך או בפעולה' },
    symptom: { en: 'A 403 toast, or the menu item is missing.', he: 'הודעת 403, או שהפריט חסר בתפריט.' },
    cause: { en: 'Each role has its own permissions: Users and department changes are Admin only, employees see only their own data.', he: 'לכל תפקיד יש הרשאות משלו: משתמשים ושינוי מחלקות למנהל בלבד, ועובד רואה רק את הנתונים שלו.' },
    fix: [{ en: 'Sign in with an account that has the right role, or have an admin change your role.', he: 'להתחבר עם חשבון בתפקיד המתאים, או לבקש ממנהל לשנות את התפקיד.' }],
    code: 'src/SalaryNet.API/Security/Policies.cs',
  },
  {
    id: 'duplicate-payslip',
    category: 'payroll',
    status: 409,
    title: { en: 'A payslip cannot be generated twice', he: 'אי אפשר להפיק תלוש פעמיים' },
    symptom: { en: '"Payroll for … has already been generated."', he: 'ההודעה "Payroll for … has already been generated".' },
    cause: { en: 'One payslip per employee per month, enforced by the service and by a unique database index.', he: 'תלוש אחד לעובד בחודש, נאכף בשירות ובאינדקס ייחודי במסד הנתונים.' },
    fix: [
      { en: 'Open the existing payslip from the Payroll list instead.', he: 'לפתוח את התלוש הקיים מרשימת השכר.' },
      { en: 'To pay everyone at once, use Run monthly payroll: it skips people who already have a payslip.', he: 'כדי לשלם לכולם בבת אחת, להשתמש ב"הרצת שכר חודשית": היא מדלגת על מי שכבר יש לו תלוש.' },
    ],
    code: 'src/SalaryNet.Infrastructure/Persistence/Configurations/PayrollRecordConfiguration.cs',
  },
  {
    id: 'future-period',
    category: 'payroll',
    status: 422,
    title: { en: 'Payroll for next month is refused', he: 'שכר לחודש הבא נדחה' },
    symptom: { en: '"Payroll cannot be generated for a future period."', he: 'ההודעה "Payroll cannot be generated for a future period".' },
    cause: { en: 'Payroll is generated for the current or a past month only.', he: 'שכר מופק רק לחודש הנוכחי או לחודש שעבר.' },
    fix: [{ en: 'Pick the current month or an earlier one.', he: 'לבחור את החודש הנוכחי או חודש קודם.' }],
    code: 'src/SalaryNet.Domain/Entities/PayrollRecord.cs',
  },
  {
    id: 'inactive-payroll',
    category: 'payroll',
    status: 422,
    title: { en: 'No payslip for a deactivated employee', he: 'אין תלוש לעובד מושבת' },
    symptom: { en: 'The employee is missing from the payslip list, and generating one returns 422.', he: 'העובד לא מופיע ברשימת התלושים, והפקה ידנית מחזירה 422.' },
    cause: { en: 'Inactive employees are excluded from payroll; their history stays.', he: 'עובדים לא פעילים לא נכללים בשכר, וההיסטוריה שלהם נשמרת.' },
    fix: [{ en: 'If the employee returned, reactivate them on the Employees screen first.', he: 'אם העובד חזר, להפעיל אותו מחדש במסך העובדים קודם.' }],
  },
  {
    id: 'double-check-in',
    category: 'attendance',
    status: 409,
    title: { en: '"You are already checked in"', he: '"You are already checked in"' },
    symptom: { en: 'Check in fails, or Check out says you are not checked in.', he: 'הכניסה למשמרת נכשלת, או שהיציאה אומרת שאינך במשמרת.' },
    cause: { en: 'Only one open shift per employee is allowed, and you can only close a shift that is open.', he: 'מותרת משמרת פתוחה אחת לכל עובד, ואפשר לסגור רק משמרת פתוחה.' },
    fix: [{ en: 'Refresh the Attendance screen to see the real state, then check out (or in).', he: 'לרענן את מסך הנוכחות כדי לראות את המצב האמיתי, ואז לצאת (או להיכנס).' }],
    code: 'src/SalaryNet.Application/Attendance/AttendanceService.cs',
  },
  {
    id: 'duplicate-email',
    category: 'employees',
    status: 409,
    title: { en: '"An employee with this email already exists"', he: '"An employee with this email already exists"' },
    symptom: { en: 'Saving a new or edited employee fails.', he: 'שמירת עובד חדש או ערוך נכשלת.' },
    cause: { en: 'Emails are unique and compared without regard to case: Dana@ and dana@ are the same.', he: 'כתובות האימייל ייחודיות, ומושוות בלי הבדל בין אותיות גדולות לקטנות: Dana@ ו-dana@ הן אותה כתובת.' },
    fix: [{ en: 'Search for the email on the Employees screen; the person may already exist, possibly as Inactive.', he: 'לחפש את האימייל במסך העובדים. ייתכן שהעובד כבר קיים, אולי כלא פעיל.' }],
  },
  {
    id: 'delete-department',
    category: 'employees',
    status: 409,
    title: { en: 'A department cannot be deleted', he: 'אי אפשר למחוק מחלקה' },
    symptom: { en: '"Department … still has employees and cannot be deleted."', he: 'ההודעה "Department … still has employees and cannot be deleted".' },
    cause: { en: 'Deleting it would orphan employees and their payroll history.', he: 'מחיקה הייתה משאירה עובדים והיסטוריית שכר בלי מחלקה.' },
    fix: [{ en: 'Move the employees to another department first (edit each employee), then delete.', he: 'להעביר את העובדים למחלקה אחרת קודם (עריכת כל עובד), ואז למחוק.' }],
  },
  {
    id: 'api-down',
    category: 'development',
    title: { en: '"Could not reach the server" when running locally', he: '"אין חיבור לשרת" בהרצה מקומית' },
    symptom: { en: 'The sign-in screen cannot reach the API.', he: 'מסך הכניסה לא מצליח להגיע ל-API.' },
    cause: { en: 'The API is not running, or SQL Server is still starting.', he: 'ה-API לא רץ, או ש-SQL Server עדיין עולה.' },
    fix: [
      { en: 'Start Docker Desktop, then: docker compose --profile full up', he: 'להפעיל את Docker Desktop, ואז: docker compose --profile full up' },
      { en: 'Check http://localhost:5080/health returns Healthy.', he: 'לבדוק ש-http://localhost:5080/health מחזיר Healthy.' },
      { en: 'Read the API logs: docker compose logs api', he: 'לקרוא את הלוגים של ה-API: docker compose logs api' },
    ],
  },
  {
    id: 'jwt-key',
    category: 'development',
    title: { en: 'The API stops at startup with a Jwt:SigningKey error', he: 'ה-API נעצר בעלייה עם שגיאת Jwt:SigningKey' },
    symptom: { en: 'OptionsValidationException: Jwt:SigningKey must be at least 32 characters.', he: 'OptionsValidationException: Jwt:SigningKey must be at least 32 characters.' },
    cause: { en: 'Production settings ship without a key on purpose, so a server never runs with a default secret.', he: 'הגדרות הייצור מגיעות בלי מפתח בכוונה, כדי ששרת לעולם לא ירוץ עם סוד ברירת מחדל.' },
    fix: [{ en: 'Set Jwt__SigningKey as an environment variable (32+ random characters), or run in the Development environment.', he: 'להגדיר את Jwt__SigningKey כמשתנה סביבה (32 תווים אקראיים לפחות), או להריץ בסביבת Development.' }],
    code: 'src/SalaryNet.Infrastructure/DependencyInjection.cs',
  },
  {
    id: 'integration-tests-docker',
    category: 'development',
    title: { en: 'Integration tests fail before any test runs', he: 'בדיקות האינטגרציה נכשלות לפני שבדיקה כלשהי רצה' },
    symptom: { en: 'Errors about the Docker endpoint or the SQL Server container.', he: 'שגיאות על Docker או על קונטיינר ה-SQL Server.' },
    cause: { en: 'Testcontainers starts a real SQL Server in Docker for every test run.', he: 'Testcontainers מרים SQL Server אמיתי ב-Docker בכל הרצת בדיקות.' },
    fix: [{ en: 'Start Docker Desktop and run dotnet test again. Unit tests alone: dotnet test --filter FullyQualifiedName~Unit', he: 'להפעיל את Docker Desktop ולהריץ שוב dotnet test. בדיקות יחידה בלבד: dotnet test --filter FullyQualifiedName~Unit' }],
  },
  {
    id: 'migration-default',
    category: 'development',
    title: { en: 'Everyone became inactive after a migration', he: 'כל המשתמשים הפכו ללא פעילים אחרי מיגרציה' },
    symptom: { en: 'Nobody can sign in after adding a bool column.', he: 'אף אחד לא מצליח להתחבר אחרי הוספת עמודה בוליאנית.' },
    cause: { en: 'EF Core scaffolds defaultValue: false for a new non-nullable bool column, which silently changes existing rows.', he: 'EF Core מייצר defaultValue: false לעמודה בוליאנית חדשה שאינה ריקה, וזה משנה בשקט את כל השורות הקיימות.' },
    fix: [{ en: 'Always read generated migrations; set the default that keeps existing data valid (here defaultValue: true).', he: 'תמיד לקרוא את המיגרציה שנוצרה, ולקבוע ברירת מחדל ששומרת על הנתונים הקיימים (כאן defaultValue: true).' }],
    code: 'src/SalaryNet.Infrastructure/Persistence/Migrations',
  },
  {
    id: 'ef-translation',
    category: 'development',
    status: 500,
    title: { en: '500 with "The LINQ expression could not be translated"', he: '500 עם "The LINQ expression could not be translated"' },
    symptom: { en: 'A list or dashboard request fails with a server error.', he: 'בקשה לרשימה או ללוח הבקרה נכשלת עם שגיאת שרת.' },
    cause: { en: 'Sorting or filtering after projecting into a C# record cannot be turned into SQL.', he: 'מיון או סינון אחרי הטלה לרשומת C# (record) לא ניתנים לתרגום ל-SQL.' },
    fix: [{ en: 'Apply Where and OrderBy before Select, on entity properties.', he: 'להחיל Where ו-OrderBy לפני Select, על שדות של הישות.' }],
    code: 'src/SalaryNet.Infrastructure/Persistence/DashboardReadModel.cs',
  },
]
