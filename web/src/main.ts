import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { createApp } from 'vue'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import './styles/main.css'

// Aura's default primary is emerald; use blue so components match the brand and chart series 1.
const SalaryNetPreset = definePreset(Aura, {
  semantic: {
    primary: Object.fromEntries(
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [step, `{blue.${step}}`]),
    ),
  },
})

createApp(App)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, { theme: { preset: SalaryNetPreset, options: { darkModeSelector: 'system' } } })
  .use(ToastService)
  .use(ConfirmationService)
  .directive('tooltip', Tooltip)
  .mount('#app')
