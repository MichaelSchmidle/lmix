<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Relation, RelationInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const user = useSupabaseUser()
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

const formData = computed(() => ({
  public_description: props.relation?.public_description ?? '',
  private_description: props.relation?.private_description ?? '',
}))

const handleSubmit = async (form: RelationInsert, node: FormKitNode) => {
  try {
    const uuid = await relationStore.upsertRelation({
      public_description: form.public_description,
      private_description: form.private_description,
      uuid: props.relation?.uuid,
      user_uuid: user.value!.id,
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
  <UiSection icon="i-ph-share-network-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleCreate')" :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionCreate')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="formData">
        <FormKit type="text" name="name" :label="t('name.label')" />
        <FormKit type="taglist" :options="getPersonaOptions" v-model="selectedPersonas" :label="t('personas.label')" :placeholder="t('personas.placeholder')" validation="min:2" :validation-messages="{ min: t('personas.minimum') }" />
        <FormKit type="textarea" name="public_description" :label="t('publicDescription.label')" />
        <FormKit type="textarea" name="private_description" :label="t('privateDescription.label')" />
        <template #actions>
          <UiFormActions>
            <RelationsDeleteModal v-if="relation" :relation="relation" @success="navigateTo('/relations/new')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'" :label="t(isUpdate ? 'updateRelation' : 'createRelation')" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    titleCreate: Create Relation
    titleUpdate: Update
    descriptionCreate: Create a new relation between personas.
    descriptionUpdate: Update this relation’s configuration.
    name:
      label: Name
    personas:
      label: Personas
      placeholder: Select personas…
      minimum: Please select at least two personas.
    publicDescription:
      label: Public Description
      placeholder: Enter public description…
    privateDescription:
      label: Private Description
      placeholder: Enter private description…
    createRelation: Create
    updateRelation: Update
    relationCreated: Relation created.
    relationUpdated: Relation updated.
    saveFailed: Failed to save relation.
</i18n>