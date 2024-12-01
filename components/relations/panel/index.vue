<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const relationStore = useRelationStore()
const { getRelationNavigation } = storeToRefs(relationStore)

const props = defineProps({
  isSlideover: {
    default: false,
    type: Boolean,
  },
})
</script>

<template>
  <UiPanelHeader>
    <template v-if="isSlideover" #domainToggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
    {{ t('title') }}
  </UiPanelHeader>
  <UiPanelContent v-auto-animate>
    <UButton block icon="i-ph-share-network-duotone" :label="t('newRelation')" to="/relations/add" />
    <UVerticalNavigation :links="getRelationNavigation()" />
    <NoData v-if="!getRelationNavigation().length" :message="t('noRelations')" />
  </UiPanelContent>
</template>

<i18n lang="yaml">
en:
  title: Relations
  newRelation: New Relation
  noRelations: No relations yet
</i18n>
