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
    icon: 'i-ph-popcorn-fill',
    label: t('productions'),
  },
])
</script>

<i18n lang="yaml">
en:
  productions: Productions
</i18n>
