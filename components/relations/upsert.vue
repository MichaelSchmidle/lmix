<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Relation, RelationInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const relationStore = useRelationStore()
const personaStore = usePersonaStore()
const { getPersonaOptions } = storeToRefs(personaStore)
const { getRelationPersonas } = storeToRefs(relationStore)

const props = defineProps({
  relation: {
    type: Object as PropType<Relation>,
    default: undefined,
  },
})

const isUpdate = computed(() => !!props.relation)
const selectedPersonas = ref<string[]>(props.relation ? getRelationPersonas.value(props.relation.uuid) : [])

const handleSubmit = async (relation: RelationInsert, node: FormKitNode) => {
  try {
    const uuid = await relationStore.upsertRelation({
      name: relation.name,
      universal: relation.universal,
      internal: relation.internal,
      external: relation.external,
      uuid: props.relation?.uuid,
    } as RelationInsert, selectedPersonas.value)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'relationUpdated' : 'relationCreated'),
    })

    navigateTo(`/relations/${uuid}`)
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('saveFailed')])
  }
}
</script>

<template>
  <UiSection icon="i-ph-share-network-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleInsert')"
    :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionInsert')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="relation">
        <FormKit type="text" name="name" :label="t('name.label')" :help="t('name.help')" />
        <FormKit type="taglist" :options="getPersonaOptions()" v-model="selectedPersonas" :label="t('personas.label')"
          :help="t('personas.help')" validation="required|min:2"
          :validation-messages="{ required: t('personas.minimum'), min: t('personas.minimum') }" />
        <FormKit type="textarea" auto-height name="universal" :label="t('universal.label')"
          :help="t('universal.help')" />
        <FormKit type="textarea" auto-height name="internal" :label="t('internal.label')" :help="t('internal.help')" />
        <FormKit type="textarea" auto-height name="external" :label="t('external.label')" :help="t('external.help')" />
        <template #actions="{ disabled }">
          <UiFormActions>
            <RelationsDeleteModal v-if="relation" :relation="relation" @success="navigateTo('/relations/add')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'"
              :label="t(isUpdate ? 'updateRelation' : 'createRelation')" :loading="(disabled as boolean)"
              type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
en:
  titleInsert: Create
  titleUpdate: Update
  descriptionInsert: Create a new relation between personas.
  descriptionUpdate: Configure this relation’s personas and descriptions.
  name:
    label: Name
    help: If no name is provided, LMiX will label this relation automatically by concatenating the names of the selected personas.
  personas:
    label: Personas
    help: Select the personas that will be part of this relation.
    minimum: Please select at least two personas.
  universal:
    label: Universal
    help: What’s true for all personas about this relation – personas in the relation included.
  internal:
    label: Internal
    help: What’s true only for personas in this relation.
  external:
    label: External
    help: What’s true only for outside personas about this relation.
  createRelation: Create
  updateRelation: Update
  relationCreated: Relation created.
  relationUpdated: Relation updated.
  saveFailed: Failed to save relation.
</i18n>