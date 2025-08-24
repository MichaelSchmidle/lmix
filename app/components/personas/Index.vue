<template>
  <div>
    <USkeleton
      v-if="loading"
      class="h-13 w-full"
    />

    <UNavigationMenu
      v-else-if="personaStore.personasList.length > 0 || loading"
      :items="navigationItems(currentPersonaId)"
      orientation="vertical"
    />
    <EmptyState
      v-else
      icon="i-ph-mask-happy-fill"
      :description="t('empty.description')"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const personaStore = usePersonaStore()
const { loading, navigationItems } = storeToRefs(personaStore)
const route = useRoute()

// Get current persona ID from route if we're on a persona detail page
const currentPersonaId = computed(() => {
  if (route.name === 'personas-id') {
    return route.params.id as string
  }
  return undefined
})

// Fetch personas on component mount
onMounted(async () => {
  if (!personaStore.personasList.length) {
    await personaStore.fetchPersonas()
  }
})
</script>

<i18n lang="yaml">
en:
  empty:
    description: No personas yet.
</i18n>
