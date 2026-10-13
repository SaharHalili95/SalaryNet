import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/errors'

/** Shows any error as a toast; returns field errors so forms can highlight inputs. */
export function useApiError() {
  const toast = useToast()
  const { t, te } = useI18n()
  const title = (status: number, fallback: string) => (te(`errors.${status}`) ? t(`errors.${status}`) : fallback)

  return (error: unknown): Record<string, string> => {
    if (error instanceof ApiError) {
      const fields = error.fieldErrors
      if (Object.keys(fields).length === 0 || error.status !== 400) {
        toast.add({ severity: error.status >= 500 ? 'error' : 'warn', summary: title(error.status, error.title), detail: error.detail, life: 5000 })
      }
      return fields
    }
    toast.add({ severity: 'error', summary: t('errors.unexpected'), detail: String(error), life: 5000 })
    return {}
  }
}
