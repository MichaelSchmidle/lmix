<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const relationshipStore = useRelationshipStore()
const { getRelationship, getRelationshipLabel } = storeToRefs(relationshipStore)
const relationship = getRelationship.value(route.params.id as string)

if (!relationship) {
  showError({
    statusCode: 404,
    message: t('relationshipNotFound'),
  })
}

const relationshipLabel = computed(() => getRelationshipLabel.value(relationship!.uuid))

useHead({
  title: t('title', { label: relationshipLabel.value }),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      {{ relationshipLabel }}
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <RelationshipsUpsert :relationship="relationship" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: Relationship {label}
    relationshipNotFound: Relationship not found
</i18n>