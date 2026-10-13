import type { Locale } from '.'

/**
 * Hebrew display names for the fictional demo company. The data itself is stored once (in English, as the
 * seed writes it); only what is shown changes. Anything not in the glossary, such as text a user typed, is
 * shown exactly as entered.
 */
const departments: Record<string, string> = {
  Engineering: 'הנדסה',
  Finance: 'כספים',
  'Human Resources': 'משאבי אנוש',
  Sales: 'מכירות',
  'Customer Success': 'הצלחת לקוחות',
  Operations: 'תפעול',
  'Product development, platform and QA': 'פיתוח מוצר, פלטפורמה ובדיקות איכות',
  'Accounting, payroll control and reporting': 'הנהלת חשבונות, בקרת שכר ודיווח',
  'Recruiting, people operations and benefits': 'גיוס, תפעול משאבי אנוש והטבות',
  'New business and account management': 'לקוחות חדשים וניהול תיקי לקוחות',
  'Onboarding, support and retention': 'קליטה, תמיכה ושימור לקוחות',
  'IT, facilities and procurement': 'מערכות מידע, תחזוקה ורכש',
}

const nameParts: Record<string, string> = {
  Noa: 'נועה', Yonatan: 'יונתן', Maya: 'מאיה', Itai: 'איתי', Tamar: 'תמר', Omer: 'עומר', Shira: 'שירה',
  Eitan: 'איתן', Yael: 'יעל', Amit: 'עמית', Lior: 'ליאור', Roni: 'רוני', Daniel: 'דניאל', Michal: 'מיכל',
  Ariel: 'אריאל', Hila: 'הילה', Gal: 'גל', Nadav: 'נדב', Dana: 'דנה', Tomer: 'תומר', Adi: 'עדי', Ido: 'עידו',
  Keren: 'קרן', Yuval: 'יובל', Sivan: 'סיון', Ofir: 'אופיר', Rotem: 'רותם', Alon: 'אלון', Inbar: 'ענבר',
  Elad: 'אלעד', Eyal: 'אייל',
  Cohen: 'כהן', Levi: 'לוי', Mizrahi: 'מזרחי', Peretz: 'פרץ', Biton: 'ביטון', Friedman: 'פרידמן',
  Avraham: 'אברהם', Dahan: 'דהן', Shapiro: 'שפירא', Katz: 'כץ', Azoulay: 'אזולאי', Golan: 'גולן',
  'Ben-David': 'בן דוד', Rosen: 'רוזן', Halevi: 'הלוי', Segal: 'סגל', Weiss: 'וייס', Navon: 'נבון',
  Amar: 'עמר', Tal: 'טל', Shamir: 'שמיר', Barak: 'ברק',
}

/** Department names and descriptions. */
export function localizeTerm(text: string | null | undefined, locale: Locale): string {
  if (!text) return text ?? ''
  return locale === 'he' ? (departments[text] ?? text) : text
}

/** A person's name, translated word by word only when every word is known. */
export function localizeName(name: string | null | undefined, locale: Locale): string {
  if (!name) return name ?? ''
  if (locale !== 'he') return name
  const parts = name.split(' ')
  return parts.every((p) => p in nameParts) ? parts.map((p) => nameParts[p]).join(' ') : name
}
