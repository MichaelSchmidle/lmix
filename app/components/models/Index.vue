<template>
  <UNavigationMenu
    :items="items"
    orientation="vertical"
  />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n({ useScope: 'local' })
const modelsStore = useModelsStore()

// Computed navigation items based on models from store
const items = computed<NavigationMenuItem[]>(() => {
  return [
    {
      children: modelsStore.navigationItems,
      defaultOpen: true,
      icon: 'i-ph-circuitry-fill',
      label: t('models'),
    },
  ]
})

// Load models on mount
onMounted(() => {
  modelsStore.fetchModels()
})
</script>

<i18n lang="yaml">
en:
  models: Models
</i18n>
