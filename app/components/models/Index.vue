<template>
  <div>
    <USkeleton
      v-if="loading"
      class="h-13 w-full"
    />

    <UNavigationMenu
      v-else-if="modelStore.modelsList.length > 0"
      :items="items"
      orientation="vertical"
    />

    <EmptyState
      v-else
      :description="t('empty.description')"
      icon="i-ph-circuitry-fill"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const modelStore = useModelStore()
const { loading } = storeToRefs(modelStore)

// Use the store's built-in navigation items with current model ID
const currentModelId = computed(() => route.params.id as string | undefined)
const items = computed(() => modelStore.navigationItems(currentModelId.value))
</script>

<i18n lang="yaml">
en:
  empty:
    description: No models yet.
</i18n>
