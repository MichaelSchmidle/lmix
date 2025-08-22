<template>
  <div>
    <USkeleton
      v-if="loading"
      class="h-8 w-full"
    />

    <UNavigationMenu
      v-else
      :items="items"
      orientation="vertical"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const modelStore = useModelStore()
const { loading } = storeToRefs(modelStore)

// Use the store's built-in navigation items with current model ID
const items = computed(() => {
  const currentModelId = route.params.id as string | undefined
  return modelStore.navigationItems(currentModelId)
})
</script>

<i18n lang="yaml">
en:
  models: Models
  default: Default
</i18n>
