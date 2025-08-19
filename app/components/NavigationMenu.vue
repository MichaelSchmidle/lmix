<template>
  <UNavigationMenu :items="items" orientation="vertical" />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
const { t } = useI18n({ useScope: 'local' })
const localeRoute = useLocaleRoute()

const items = ref<NavigationMenuItem[]>([
  {
    icon: 'i-ph-circuitry-fill',
    label: t('models'),
    to: localeRoute('models'),
  },
  {
    icon: 'i-ph-head-circuit-fill',
    label: t('assistants'),
    to: localeRoute('assistants'),
  },
  {
    icon: 'i-ph-mask-happy-fill',
    label: t('personas'),
    to: localeRoute('personas'),
  },
  {
    icon: 'i-ph-planet-fill',
    label: t('worlds'),
    to: localeRoute('worlds'),
  },
  {
    icon: 'i-ph-panorama-fill',
    label: t('scenarios'),
    to: localeRoute('scenarios'),
  },
  {
    icon: 'i-ph-line-segments-fill',
    label: t('affiliations'),
    to: localeRoute('affiliations'),
  },
])
</script>

<i18n lang="yaml">
en:
  models: Models
  assistants: Assistants
  personas: Personas
  worlds: Worlds
  scenarios: Scenarios
  affiliations: Affiliations
</i18n>