<script setup lang="ts">
import type { Persona } from '@/types/app'
const { t } = useI18n({ useScope: 'local' })
const relationshipStore = useRelationshipStore()
const { getRelationshipsByPersona, getRelationshipLabel } = storeToRefs(relationshipStore)

const props = defineProps({
  persona: {
    required: true,
    type: Object as PropType<Persona>,
  },
})

const columns = computed(() => [
  {
    class: 'w-full',
    key: 'label',
    label: t('label'),
  },
  {
    key: 'actions',
    label: t('actions'),
  },
])

const rows = computed(() => getRelationshipsByPersona.value(props.persona!.uuid).map(relationship => ({
  uuid: relationship.uuid,
  label: getRelationshipLabel.value(relationship.uuid),
})))

const handleRemoveFromRelationship = async (relationshipUuid: string) => {
  try {
    await relationshipStore.removePersonaFromRelationship(relationshipUuid, props.persona!.uuid)
  }
  catch (error) {
    // Handle error appropriately
  }
}
</script>

<template>
  <UiSection icon="i-ph-share-network-thin" :title="t('title')" :description="t('description')">
    <UTable class="max-w-prose" :columns="columns" :rows="rows">
      <template #actions-data="{ row }">
        <div class="flex gap-2">
          <UTooltip :text="t('removeFromRelationship')">
            <UButton color="gray" icon="i-ph-trash-duotone" size="xs" variant="ghost" @click="handleRemoveFromRelationship(row.uuid)" />
          </UTooltip>
          <UTooltip :text="t('editRelationship')">
            <UButton color="gray" icon="i-ph-pencil-duotone" size="xs" :to="`/relationships/${row.uuid}`" variant="ghost" />
          </UTooltip>
        </div>
      </template>
      <template #empty-state>
        <NoData :message="t('empty')" />
      </template>
    </UTable>
  </UiSection>
</template>

<i18n lang="yaml">
en:
  title: Relationships
  description: Relationships this persona is involved in.
  label: Relationship
  actions: Actions
  removeFromRelationship: Remove from relationship
  editRelationship: Edit relationship
  empty: No relationships yet.
</i18n>