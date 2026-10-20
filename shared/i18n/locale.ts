export type Locale = 'en' | 'he'

export const intlLocale = (locale: Locale) => (locale === 'he' ? 'he-IL' : 'en-GB')
