<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Relationship, RelationshipInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const user = useSupabaseUser()
const relationshipStore = useRelationshipStore()
const personaStore = usePersonaStore()
const { getPersonaOptions } = storeToRefs(personaStore)
const { getRelationshipPersonas } = storeToRefs(relationshipStore)

const props = defineProps({
  relationship: {
    type: Object as PropType<Relationship>,
    default: undefined,
  },
})

const isUpdate = computed(() => !!props.relationship)
const selectedPersonas = ref<string[]>(props.relationship ? getRelationshipPersonas.value(props.relationship.uuid) : [])

const formData = computed(() => ({
  public_description: props.relationship?.public_description ?? '',
  private_description: props.relationship?.private_description ?? '',
}))

const handleSubmit = async (form: RelationshipInsert, node: FormKitNode) => {
  try {
    const uuid = await relationshipStore.upsertRelationship({
      public_description: form.public_description,
      private_description: form.private_description,
      uuid: props.relationship?.uuid,
      user_uuid: user.value!.id,
    } as RelationshipInsert, selectedPersonas.value)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'relationshipUpdated' : 'relationshipCreated'),
    })

    navigateTo(`/relationships/${uuid}`)
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
        <FormKit type="taglist" :options="getPersonaOptions" v-model="selectedPersonas" :label="t('personas.label')" :placeholder="t('personas.placeholder')" validation="min:2" :validation-messages="{ min: t('personas.minimum') }" />
        <FormKit type="textarea" name="public_description" :label="t('publicDescription.label')" />
        <FormKit type="textarea" name="private_description" :label="t('privateDescription.label')" />
        <template #actions>
          <UiFormActions>
            <RelationshipsDeleteModal v-if="relationship" :relationship="relationship" @success="navigateTo('/relationships/new')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'" :label="t(isUpdate ? 'updateRelationship' : 'createRelationship')" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    titleCreate: Create Relationship
    titleUpdate: Update
    descriptionCreate: Create a new relationship between personas.
    descriptionUpdate: Update this relationship's configuration.
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
    createRelationship: Create
    updateRelationship: Update
    relationshipCreated: Relationship created.
    relationshipUpdated: Relationship updated.
    saveFailed: Failed to save relationship.
</i18n>