import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@shared/api/errors'
import type { Locale } from '@/i18n'
import { translateServerMessage } from '@shared/i18n/serverMessages'

/** Shows any error as a toast; returns field errors so forms can highlight inputs. */
export function useApiError() {
  const toast = useToast()
  const { t, te, locale } = useI18n()
  const tr = (message?: string) => translateServerMessage(message, locale.value as Locale)
  const title = (status: number, fallback: string) => (te(`errors.${status}`) ? t(`errors.${status}`) : fallback)

  return (error: unknown): Record<string, string> => {
    if (error instanceof ApiError) {
      const fields = Object.fromEntries(Object.entries(error.fieldErrors).map(([k, v]) => [k, tr(v) ?? v]))
      if (Object.keys(fields).length === 0 || error.status !== 400) {
        toast.add({ severity: error.status >= 500 ? 'error' : 'warn', summary: title(error.status, error.title), detail: tr(error.detail), life: 5000 })
      }
      return fields
    }
    toast.add({ severity: 'error', summary: t('errors.unexpected'), detail: String(error), life: 5000 })
    return {}
  }
}
