import type { Locale } from './locale'
import { localizeName } from './dataGlossary'

type Rule = [pattern: RegExp, hebrew: string | ((...groups: string[]) => string)]

/**
 * Hebrew wording for every message the API (and the in-browser demo) can return. The API speaks English;
 * translating at the edge keeps one source of truth for the rules while users read their own language.
 * Unknown messages fall through unchanged.
 */
const rules: Rule[] = [
  [/^Invalid email or password\.$/, 'אימייל או סיסמה שגויים.'],
  [/^Please sign in again\.$/, 'יש להתחבר מחדש.'],
  [/^You do not have access to this resource\.$/, 'אין לך הרשאה למשאב הזה.'],
  [/^.+ '.+' was not found\.$/, 'הרשומה לא נמצאה.'],
  [/^.+ was not found\.$/, 'הרשומה לא נמצאה.'],
  [/^The change conflicts with an existing record\.$/, 'השינוי מתנגש ברשומה קיימת.'],
  [/^An employee with email '(.+)' already exists\.$/, (email) => `כבר קיים עובד עם האימייל ${email}.`],
  [/^An account with email '(.+)' already exists\.$/, (email) => `כבר קיים חשבון עם האימייל ${email}.`],
  [/^A department named '(.+)' already exists\.$/, (name) => `כבר קיימת מחלקה בשם '${name}'.`],
  [/^Department '(.+)' still has employees and cannot be deleted\.$/, (name) => `במחלקה '${name}' עדיין יש עובדים, ולכן אי אפשר למחוק אותה.`],
  [/^Department '.+' does not exist\.$/, 'המחלקה לא קיימת.'],
  [/^Please choose a department\.$/, 'יש לבחור מחלקה.'],
  [/^Payroll for (.+) for (\d\d\/\d{4}) has already been generated\.$/, (name, period) => `כבר הופק תלוש עבור ${localizeName(name, 'he')} לתקופה ${period}.`],
  [/^Payroll cannot be generated for a future period\.$/, 'אי אפשר להפיק שכר לתקופה עתידית.'],
  [/^Payroll cannot be generated for (an )?inactive employee.*$/, 'אי אפשר להפיק שכר לעובד לא פעיל.'],
  [/^You are already checked in\..*$/, 'כבר נמצא/ת במשמרת. יש לצאת לפני שמתחילים משמרת חדשה.'],
  [/^You are not checked in\.$/, 'אינך במשמרת כרגע.'],
  [/^Only employee accounts can record attendance\.$/, 'רק חשבונות עובדים יכולים לרשום נוכחות.'],
  [/^This account is not linked to an employee\.$/, 'החשבון לא מקושר לעובד.'],
  [/^Employee( '.+')? is already active\.$/, 'העובד כבר פעיל.'],
  [/^Employee( '.+')? is already inactive\.$/, 'העובד כבר לא פעיל.'],
  [/^User( '.+')? is already active\.$/, 'החשבון כבר פעיל.'],
  [/^User( '.+')? is already inactive\.$/, 'החשבון כבר לא פעיל.'],
  [/^You cannot change your own role\..*$/, 'אי אפשר לשנות לעצמך את התפקיד. יש לפנות למנהל אחר.'],
  [/^You cannot deactivate your own account\..*$/, 'אי אפשר להשבית את החשבון של עצמך. יש לפנות למנהל אחר.'],
  [/^This employee already has an account\.$/, 'לעובד הזה כבר יש חשבון.'],
  [/^Choose the employee this account belongs to\.$/, 'יש לבחור את העובד שהחשבון שייך לו.'],
  [/^Only employee accounts can be linked to an employee\.$/, 'רק חשבון עובד יכול להיות מקושר לעובד.'],
  [/^An employee account must be linked to an employee\.$/, 'חשבון עובד חייב להיות מקושר לעובד.'],
  [/^Enter the name of the person who uses this account\.$/, 'יש להזין את שם האדם שמשתמש בחשבון.'],
  [/^The current password is incorrect\.$/, 'הסיסמה הנוכחית שגויה.'],
  [/^The new password must be different from the current one\.$/, 'הסיסמה החדשה חייבת להיות שונה מהנוכחית.'],
  [/^Password must contain an uppercase letter\.$/, 'הסיסמה חייבת לכלול אות גדולה באנגלית.'],
  [/^Password must contain a lowercase letter\.$/, 'הסיסמה חייבת לכלול אות קטנה באנגלית.'],
  [/^Password must contain a digit\.$/, 'הסיסמה חייבת לכלול ספרה.'],
  [/^Use at least 8 characters with an uppercase letter.*$/, 'לפחות 8 תווים, עם אות גדולה, אות קטנה וספרה (באנגלית).'],
  [/^Page must be >= 1 and page size between 1 and 100\.$/, 'גודל העמוד חייב להיות בין 1 ל-100.'],
  [/^'To' must be later than 'From'\.$/, 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה.'],
  // FluentValidation's built-in messages.
  [/^'.+' must not be empty\.$/, 'שדה חובה.'],
  [/^'.+' is not a valid email address\.$/, 'כתובת אימייל לא תקינה.'],
  [/^'.+' must be greater than or equal to '(.+)'\.$/, (n) => `הערך חייב להיות לפחות ${n}.`],
  [/^'.+' must be greater than '(.+)'\.$/, (n) => `הערך חייב להיות גדול מ-${n}.`],
  [/^'.+' must be less than or equal to '(.+)'\.$/, (n) => `הערך חייב להיות לכל היותר ${n}.`],
  [/^'.+' must be between (\S+) and (\S+)\..*$/, (a, b) => `הערך חייב להיות בין ${a} ל-${b}.`],
  [/^The length of '.+' must be at least (\d+) characters\..*$/, (n) => `נדרשים לפחות ${n} תווים.`],
  [/^The length of '.+' must be (\d+) characters or fewer\..*$/, (n) => `מותרים עד ${n} תווים.`],
  [/^'.+' must not be more than \d+ digits in total.*$/, 'מותרות עד 2 ספרות אחרי הנקודה העשרונית.'],
  [/^'.+' has a range of values which does not include '.+'\.$/, 'ערך לא תקין.'],
  [/^'.+' must be empty\.$/, 'השדה הזה חייב להישאר ריק.'],
  [/^'.+' is not in the correct format\.$/, 'הפורמט לא תקין.'],
]

export function translateServerMessage(message: string | undefined, locale: Locale): string | undefined {
  if (!message || locale !== 'he') return message
  for (const [pattern, hebrew] of rules) {
    const match = message.match(pattern)
    if (match) return typeof hebrew === 'string' ? hebrew : hebrew(...match.slice(1))
  }
  return message
}
