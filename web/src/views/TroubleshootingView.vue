<script setup lang="ts">
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { pick } from '@/content/localized'
import { issues, type IssueCategory } from '@/content/troubleshooting'
import type { Locale } from '@/i18n'

const { t, locale } = useI18n()
const lang = computed(() => locale.value as Locale)

const categories: IssueCategory[] = ['accounts', 'payroll', 'attendance', 'employees', 'development']
const categoryOptions = computed(() => categories.map((value) => ({ value, label: t(`troubleshooting.categories.${value}`) })))

const search = ref('')
const category = ref<IssueCategory | null>(null)

const visible = computed(() => {
  const term = search.value.trim().toLowerCase()
  return issues.filter((issue) => {
    if (category.value && issue.category !== category.value) return false
    if (!term) return true
    // Search both languages so an English error message pasted into the Hebrew UI still matches.
    const haystack = [issue.title, issue.symptom, issue.cause, ...issue.fix]
      .flatMap((text) => [text.en, text.he])
      .join(' ')
      .toLowerCase()
    return haystack.includes(term) || String(issue.status ?? '').includes(term)
  })
})

const severity = (status?: number) =>
  status === undefined ? 'secondary' : status >= 500 ? 'danger' : status === 401 || status === 403 ? 'warn' : 'info'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('troubleshooting.title') }}</h1>
        <p>{{ t('troubleshooting.subtitle') }}</p>
      </div>
    </div>

    <section class="panel">
      <div class="toolbar">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="search" :placeholder="t('troubleshooting.search')" :aria-label="t('troubleshooting.search')" />
        </IconField>
        <Select v-model="category" :options="categoryOptions" option-label="label" option-value="value"
          :placeholder="t('troubleshooting.allCategories')" show-clear :aria-label="t('troubleshooting.allCategories')" />
        <span class="muted count">{{ t('troubleshooting.count', { count: visible.length }) }}</span>
      </div>

      <p v-if="visible.length === 0" class="muted">{{ t('troubleshooting.empty') }}</p>

      <Accordion v-else multiple>
        <AccordionPanel v-for="issue in visible" :key="issue.id" :value="issue.id">
          <AccordionHeader>
            <span class="issue-head">
              <span class="issue-title">{{ pick(issue.title, lang) }}</span>
              <span class="issue-tags">
                <Tag v-if="issue.status" :value="String(issue.status)" :severity="severity(issue.status)" />
                <Tag :value="t(`troubleshooting.categories.${issue.category}`)" severity="secondary" />
              </span>
            </span>
          </AccordionHeader>
          <AccordionContent>
            <dl class="issue-body">
              <dt>{{ t('troubleshooting.symptom') }}</dt>
              <dd>{{ pick(issue.symptom, lang) }}</dd>
              <dt>{{ t('troubleshooting.cause') }}</dt>
              <dd>{{ pick(issue.cause, lang) }}</dd>
              <dt>{{ t('troubleshooting.fix') }}</dt>
              <dd>
                <ol>
                  <li v-for="(step, i) in issue.fix" :key="i">{{ pick(step, lang) }}</li>
                </ol>
              </dd>
              <template v-if="issue.code">
                <dt>{{ t('troubleshooting.code') }}</dt>
                <dd><code>{{ issue.code }}</code></dd>
              </template>
            </dl>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </section>
  </div>
</template>

<style scoped>
.count { margin-inline-start: auto; }
.issue-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; width: 100%; flex-wrap: wrap; }
.issue-title { font-weight: 600; text-align: start; }
.issue-tags { display: flex; gap: 0.375rem; margin-inline-end: 0.5rem; }
.issue-body { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1.25rem; line-height: 1.6; }
.issue-body dt { font-weight: 600; color: var(--app-text-muted); }
.issue-body dd { margin: 0; }
.issue-body ol { margin: 0; padding-inline-start: 1.25rem; }
.issue-body code { font-size: 0.8125rem; word-break: break-all; }
@media (max-width: 640px) {
  .issue-body { grid-template-columns: 1fr; }
  .issue-body dt { margin-top: 0.5rem; }
}
</style>
