import type { Localized } from './localized'

export interface SummarySection {
  id: string
  icon: string
  title: Localized
  /** Technology names, always shown left-to-right next to the title. */
  tech?: string
  items: Localized[]
}

/** Plain summary of what the project contains, shown on the "About this project" page. */
export const summarySections: SummarySection[] = [
  {
    id: 'backend',
    icon: 'pi pi-server',
    title: { en: 'Back end', he: 'צד השרת' },
    tech: 'C# · .NET 8',
    items: [
      { en: 'Clean Architecture in four layers: Domain, Application, Infrastructure and API.', he: 'ארכיטקטורה נקייה בארבע שכבות: ליבה, אפליקציה, תשתית ושרת API.' },
      { en: 'EF Core on SQL Server with unique indexes and check constraints: a payslip can never be created twice, even under concurrent requests.', he: 'EF Core מול SQL Server עם אינדקסים ייחודיים ואילוצים: תלוש לא יכול להיווצר פעמיים, גם כשמגיעות בקשות במקביל.' },
      { en: 'Payroll engine with progressive income tax and social security.', he: 'מנוע שכר עם מס הכנסה מדורג וביטוח לאומי.' },
      { en: 'Security: Admin, HR and Employee roles with JWT, IDOR protection, account lockout after 5 failures with admin unlock, a password policy and full user management.', he: 'אבטחה: תפקידי מנהל, משאבי אנוש ועובד עם JWT, הגנה מפני IDOR, נעילת חשבון אחרי 5 כישלונות ושחרור בידי מנהל, מדיניות סיסמה וניהול משתמשים מלא.' },
      { en: 'Errors as standard ProblemDetails responses and validation with FluentValidation.', he: 'שגיאות בפורמט ProblemDetails סטנדרטי, וולידציה עם FluentValidation.' },
    ],
  },
  {
    id: 'frontend',
    icon: 'pi pi-desktop',
    title: { en: 'Front end', he: 'צד הממשק' },
    tech: 'Vue 3 · TypeScript',
    items: [
      { en: 'Dashboard, employees, departments, payroll and payslips, attendance and users.', he: 'לוח בקרה, עובדים, מחלקות, שכר ותלושים, נוכחות ומשתמשים.' },
      { en: 'A different home screen per role: My overview for employees, payroll status for HR, account health for the admin.', he: 'מסך בית שונה לכל תפקיד: "הסקירה שלי" לעובד, סטטוס השכר למשאבי אנוש, ומצב החשבונות למנהל.' },
      { en: 'English and Hebrew with full right-to-left layout, including demo data and server messages.', he: 'עברית ואנגלית עם תמיכה מלאה מימין לשמאל, כולל נתוני הדמו והודעות השרת.' },
      { en: 'Test accounts on the sign-in page, and a live simulation that hires or loses an employee every two minutes.', he: 'חשבונות לבדיקה במסך הכניסה, וסימולציה חיה שמוסיפה או מורידה עובד כל 2 דקות.' },
      { en: 'Built-in guides: How it works and Troubleshooting.', he: 'מדריכים מובנים: "איך זה עובד" ו"פתרון תקלות".' },
    ],
  },
  {
    id: 'quality',
    icon: 'pi pi-check-circle',
    title: { en: 'Tests', he: 'בדיקות' },
    items: [
      { en: '164 back-end tests, including integration tests against a real SQL Server in Testcontainers.', he: '164 בדיקות בשרת, כולל בדיקות אינטגרציה מול SQL Server אמיתי ב-Testcontainers.' },
      { en: '54 front-end tests, including checks that no translation is missing and every cited code path exists.', he: '54 בדיקות בממשק, כולל בדיקה שאין תרגום חסר ושכל נתיב קוד שמוזכר קיים.' },
      { en: '101 mobile tests in Playwright, run on iPhone (Safari engine), a small iPhone and Android, in English and Hebrew.', he: '101 בדיקות מובייל ב-Playwright, שרצות על אייפון (מנוע Safari), אייפון קטן ואנדרואיד, באנגלית ובעברית.' },
      { en: 'An end-to-end script that runs 67 actions across every role against a running server.', he: 'סקריפט מקצה לקצה שמריץ 67 פעולות בכל התפקידים מול שרת פעיל.' },
    ],
  },
  {
    id: 'delivery',
    icon: 'pi pi-cloud-upload',
    title: { en: 'Running and delivery', he: 'הרצה ופרסום' },
    items: [
      { en: 'Docker Compose runs the full system with one command; the live site does not need it.', he: 'Docker Compose מריץ את המערכת המלאה בפקודה אחת. האתר החי לא צריך אותו.' },
      { en: 'GitHub Actions runs the tests on every change and deploys this site automatically.', he: 'GitHub Actions מריץ את הבדיקות בכל שינוי ומפרסם את האתר הזה אוטומטית.' },
      { en: 'README with screenshots and explanations.', he: 'README עם צילומי מסך והסברים.' },
    ],
  },
  {
    id: 'bugs',
    icon: 'pi pi-exclamation-triangle',
    title: { en: 'Real bugs caught along the way', he: 'באגים אמיתיים שנתפסו בדרך' },
    items: [
      { en: 'A generated migration that would have made every existing user inactive.', he: 'מיגרציה שנוצרה אוטומטית והייתה הופכת את כל המשתמשים הקיימים ללא פעילים.' },
      { en: 'EF Core queries that could not be translated to SQL and returned 500.', he: 'שאילתות EF Core שלא ניתנו לתרגום ל-SQL והחזירו 500.' },
      { en: 'A rounding error that crashed the demo data seeder.', he: 'שגיאת עיגול שהפילה את יצירת נתוני הדמו.' },
      { en: 'UI library package versions that did not match each other.', he: 'גרסאות של ספריית העיצוב שלא התאימו זו לזו.' },
      { en: 'The architecture layer chain shown backwards in Hebrew.', he: 'שרשרת שכבות הארכיטקטורה שהוצגה הפוך בעברית.' },
    ],
  },
  {
    id: 'next',
    icon: 'pi pi-forward',
    title: { en: 'What is next', he: 'מה הלאה' },
    items: [
      { en: 'A practice track: realistic bugs planted on separate branches to find and fix.', he: 'מסלול תרגול: באגים אמיתיים שנשתלים בענפים נפרדים, כדי למצוא ולתקן אותם.' },
      { en: 'Optionally, hosting the real .NET API and database on Azure.', he: 'אופציונלי: אירוח שרת ה-‎.NET ומסד הנתונים האמיתיים ב-Azure.' },
    ],
  },
]
