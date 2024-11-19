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

const relationLabel = computed(() => getRelationLabel.value(relation!.uuid))

useHead({
  title: t('title', { label: relationLabel.value }),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      {{ relationLabel }}
      <template #toggle>
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
    title: Relation {label}
    relationNotFound: Relation not found
</i18n>