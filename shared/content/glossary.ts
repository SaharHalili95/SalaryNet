import type { Localized } from './localized'

export interface GlossaryTerm {
  term: string
  meaning: Localized
}

/** Plain-language definitions of the technical words used on the architecture page. */
export const glossary: GlossaryTerm[] = [
  { term: 'API', meaning: { en: 'The doorway programs use to talk to each other. The screen asks the API for data; the API answers.', he: 'הדלת שדרכה תוכנות מדברות זו עם זו. המסך מבקש נתונים מה-API, וה-API עונה.' } },
  { term: 'Clean Architecture', meaning: { en: 'A way to organise code in layers so the business rules do not depend on screens or databases and can be changed and tested on their own.', he: 'דרך לארגן קוד בשכבות, כך שהכללים העסקיים לא תלויים במסכים או במסד הנתונים, ואפשר לשנות ולבדוק אותם בנפרד.' } },
  { term: 'JWT (token)', meaning: { en: 'A digital ID card the server signs at sign-in. Every later request shows it, and a forged one is rejected.', he: 'תעודת זהות דיגיטלית שהשרת חותם עליה בכניסה. כל בקשה בהמשך מציגה אותה, ותעודה מזויפת נדחית.' } },
  { term: 'Role / policy', meaning: { en: 'Permissions by job: Admin manages users, HR runs payroll, an employee sees only their own data.', he: 'הרשאות לפי תפקיד: מנהל מנהל משתמשים, משאבי אנוש מריצים שכר, ועובד רואה רק את הנתונים שלו.' } },
  { term: 'Validation', meaning: { en: 'Checking input before using it: required fields, a valid email, a positive salary.', he: 'בדיקת הקלט לפני שמשתמשים בו: שדות חובה, אימייל תקין, שכר חיובי.' } },
  { term: 'Controller', meaning: { en: 'The part of the server that receives one kind of request (for example "employees") and passes it on.', he: 'החלק בשרת שמקבל סוג אחד של בקשה (למשל "עובדים") ומעביר אותה הלאה.' } },
  { term: 'Service', meaning: { en: 'Code that performs one business task step by step, like generating a payslip.', he: 'קוד שמבצע משימה עסקית אחת צעד אחר צעד, למשל הפקת תלוש.' } },
  { term: 'Domain / entity', meaning: { en: 'The heart of the system: the real-world things (employee, payslip, shift) and the rules they must always obey.', he: 'הלב של המערכת: הדברים מהעולם האמיתי (עובד, תלוש, משמרת) והכללים שהם תמיד חייבים לקיים.' } },
  { term: 'Repository', meaning: { en: 'A librarian for the database: knows how to find, add and update records.', he: 'ספרן של מסד הנתונים: יודע איך למצוא, להוסיף ולעדכן רשומות.' } },
  { term: 'Unit of work', meaning: { en: 'Saves several changes as one package: either all succeed or nothing is saved.', he: 'שומר כמה שינויים כחבילה אחת: או שכולם מצליחים, או ששום דבר לא נשמר.' } },
  { term: 'Index / unique index', meaning: { en: 'A fast lookup table in the database. A unique index also refuses duplicates, like two payslips for the same month.', he: 'טבלת חיפוש מהירה במסד הנתונים. אינדקס ייחודי גם מסרב לכפילויות, כמו שני תלושים לאותו חודש.' } },
  { term: 'Migration', meaning: { en: 'A versioned script that changes the database structure, so every copy of the system stays in sync.', he: 'סקריפט עם גרסה שמשנה את מבנה מסד הנתונים, כך שכל עותק של המערכת נשאר מעודכן.' } },
  { term: 'Hash (password)', meaning: { en: 'A one-way scramble of the password. We can check a password against it but can never read the original.', he: 'ערבול חד-כיווני של הסיסמה. אפשר לבדוק מולו סיסמה, אבל אי אפשר לשחזר את המקור.' } },
  { term: 'IDOR', meaning: { en: 'An attack where a user changes an id in the address to see someone else\'s data. Here the server ignores that id and uses the signed token.', he: 'התקפה שבה משתמש משנה מזהה בכתובת כדי לראות נתונים של מישהו אחר. כאן השרת מתעלם מהמזהה ומשתמש בטוקן החתום.' } },
  { term: 'HTTP status (400, 401, 403, 404, 409, 422)', meaning: { en: 'Short answer codes: 400 bad input, 401 not signed in, 403 not allowed, 404 not found, 409 already exists, 422 breaks a business rule.', he: 'קודי תשובה קצרים: 400 קלט שגוי, 401 לא מחובר, 403 אין הרשאה, 404 לא נמצא, 409 כבר קיים, 422 מפר כלל עסקי.' } },
  { term: 'ProblemDetails', meaning: { en: 'A standard format for error messages, so every error looks the same and is easy to handle.', he: 'פורמט סטנדרטי להודעות שגיאה, כך שכל שגיאה נראית אותו דבר וקל לטפל בה.' } },
]
