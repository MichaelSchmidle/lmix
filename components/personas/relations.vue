<script setup lang="ts">
import type { Persona } from '@/types/app'
const { t } = useI18n({ useScope: 'local' })
const relationStore = useRelationStore()
const { getRelationsByPersona, getRelationLabel } = storeToRefs(relationStore)

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

const rows = computed(() => getRelationsByPersona.value(props.persona!.uuid).map(relation => ({
  uuid: relation.uuid,
  label: getRelationLabel.value(relation.uuid),
})))

const handleRemoveFromRelation = async (relationUuid: string) => {
  try {
    await relationStore.removePersonaFromRelation(relationUuid, props.persona!.uuid)
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
          <UTooltip :text="t('removeFromRelation')">
            <UButton color="gray" icon="i-ph-trash-duotone" size="xs" variant="ghost"
              @click="handleRemoveFromRelation(row.uuid)" />
          </UTooltip>
          <UTooltip :text="t('editRelation')">
            <UButton color="gray" icon="i-ph-pencil-duotone" size="xs" :to="`/relations/${row.uuid}`" variant="ghost" />
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
  title: Relations
  description: Relations this persona is involved in.
  label: Relation
  actions: Actions
  removeFromRelation: Remove from relation
  editRelation: Edit relation
  empty: No relations yet.
</i18n>