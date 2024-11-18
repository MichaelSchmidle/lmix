<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: ['relationships'],
})

const relationshipStore = useRelationshipStore()
const { getRelationshipNavigation } = storeToRefs(relationshipStore)
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/relationships' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <UButton block icon="i-ph-share-network-duotone" :label="t('newRelationship')" to="/relationships/new" />
      <UVerticalNavigation :links="getRelationshipNavigation" />
      <NoData v-if="!getRelationshipNavigation.length" :message="t('noRelationships')" />
    </UiPanelContent>
  </UiPanel>
  <UiPanel v-if="route.path === '/relationships'">
    <UiPanelHeader has-back-button>
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent />
  </UiPanel>
  <NuxtPage v-else />
</template>

<i18n lang="yaml">
  en:
    title: Relationships
    newRelationship: New Relationship
    noRelationships: No relationships yet
</i18n>