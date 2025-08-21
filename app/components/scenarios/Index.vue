<template>
  <UNavigationMenu
    :items="items"
    orientation="vertical"
  />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
const { t } = useI18n({ useScope: 'local' })

const items = ref<NavigationMenuItem[]>([
  {
    children: [],
    defaultOpen: true,
    icon: 'i-ph-line-segments-fill',
    label: t('scenarios'),
  },
])
</script>

<i18n lang="yaml">
en:
  scenarios: Scenarios
</i18n>
