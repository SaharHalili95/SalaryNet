import { useToast } from 'primevue/usetoast'
import { ApiError } from '@/api/errors'

/** Shows any error as a toast; returns field errors so forms can highlight inputs. */
export function useApiError() {
  const toast = useToast()

  return (error: unknown): Record<string, string> => {
    if (error instanceof ApiError) {
      const fields = error.fieldErrors
      if (Object.keys(fields).length === 0 || error.status !== 400) {
        toast.add({ severity: error.status >= 500 ? 'error' : 'warn', summary: error.title, detail: error.detail, life: 5000 })
      }
      return fields
    }
    toast.add({ severity: 'error', summary: 'Unexpected error', detail: String(error), life: 5000 })
    return {}
  }
}
