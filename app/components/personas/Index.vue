<template>
  <div>
    <USkeleton
      v-if="loading"
      class="h-13 w-full"
    />

    <UNavigationMenu
      v-else-if="personaStore.personasList.length > 0 || loading"
      :items="navigationItems()"
      orientation="vertical"
    />
    <EmptyState
      v-else
      :description="t('empty.description')"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const personaStore = usePersonaStore()
const { loading, navigationItems } = storeToRefs(personaStore)
</script>

<i18n lang="yaml">
en:
  empty:
    description: No personas yet.
</i18n>
