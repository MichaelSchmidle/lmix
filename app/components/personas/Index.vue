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
    icon: 'i-ph-mask-happy-fill',
    label: t('personas'),
  },
])
</script>

<i18n lang="yaml">
en:
  personas: Personas
</i18n>
