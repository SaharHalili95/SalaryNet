import { useI18n } from 'vue-i18n'
import type { Locale } from '.'
import { localizeName, localizeTerm } from '@shared/i18n/dataGlossary'

/** Display helpers for demo data in the active language: `term` for departments, `person` for names. */
export function useLocalizedData() {
  const { locale } = useI18n()
  return {
    term: (text: string | null | undefined) => localizeTerm(text, locale.value as Locale),
    person: (name: string | null | undefined) => localizeName(name, locale.value as Locale),
  }
}
