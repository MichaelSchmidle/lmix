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
const route = useRoute()
const modelStore = useModelStore()
const { loading } = storeToRefs(modelStore)

// Use the store's built-in navigation items with current model ID
const currentModelId = computed(() => route.params.id as string | undefined)
const items = computed(() => modelStore.navigationItems(currentModelId.value))
</script>
