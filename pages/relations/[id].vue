<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const relationStore = useRelationStore()
const { getRelation, getRelationLabel } = storeToRefs(relationStore)
const relation = getRelation.value(route.params.id as string)

if (!relation) {
  showError({
    statusCode: 404,
    message: t('relationNotFound'),
  })
}

useHead({
  title: t('title', { name: getRelationLabel.value(relation!.uuid) }),
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
      {{ getRelationLabel(relation!.uuid) }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <RelationsUpsert :relation="relation" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: Relation {name}
    relationNotFound: Relation not found
</i18n>