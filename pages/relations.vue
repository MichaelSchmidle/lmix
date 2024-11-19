<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'relations',
  ],
})

const relationStore = useRelationStore()
const { getRelationNavigation } = storeToRefs(relationStore)
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/relations' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <UButton block icon="i-ph-share-network-duotone" :label="t('newRelation')" to="/relations/new" />
      <UVerticalNavigation :links="getRelationNavigation()" />
      <NoData v-if="!getRelationNavigation().length" :message="t('noRelations')" />
    </UiPanelContent>
  </UiPanel>
  <UiPanel v-if="route.path === '/relations'">
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
    title: Relations
    newRelation: New Relation
    noRelations: No relations yet
</i18n>