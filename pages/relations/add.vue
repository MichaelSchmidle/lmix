<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'relations',
    'personas',
  ],
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <RelationsPanelSlideover class="lg:hidden" />
      </template>
      {{ t('title') }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <RelationsUpsert />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
en:
  title: New Relation
</i18n>