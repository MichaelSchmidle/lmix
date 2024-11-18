<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'relationships',
  ],
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      {{ t('title') }}
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <RelationshipsUpsert />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: New Relationship
</i18n>