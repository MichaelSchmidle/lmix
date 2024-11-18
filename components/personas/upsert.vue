<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Persona, PersonaInsert } from '@/types/app'

const props = defineProps({
  persona: {
    type: Object as PropType<Persona>,
    default: undefined,
  },
})

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const personaStore = usePersonaStore()
const user = useSupabaseUser()

const isUpdate = computed(() => !!props.persona)

const handleSubmit = async (form: Partial<PersonaInsert>, node: FormKitNode) => {
  try {
    const uuid = await personaStore.upsertPersona({
      ...form,
      uuid: props.persona?.uuid,
      user_uuid: user.value!.id,
    } as PersonaInsert)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'personaUpdated' : 'personaCreated'),
    })

    navigateTo(`/personas/${uuid}`)
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('saveFailed')])
  }
}
</script>

<template>
  <UiSection icon="i-ph-mask-happy-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleCreate')" :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionCreate')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="persona">
        <FormKit type="text" name="name" :label="t('name.label')" validation="required" :validation-messages="{ required: t('name.required') }" />
        <FormKit type="textarea" name="self_perception" :label="t('selfPerception.label')" :help="t('selfPerception.help')" />
        <FormKit type="textarea" name="public_perception" :label="t('publicPerception.label')" :help="t('publicPerception.help')" />
        <FormKit type="textarea" name="private_knowledge" :label="t('privateKnowledge.label')" :help="t('privateKnowledge.help')" />
        <FormKit type="textarea" name="public_knowledge" :label="t('publicKnowledge.label')" :help="t('publicKnowledge.help')" />
        <template #actions>
          <UiFormActions>
            <PersonasDeleteModal v-if="persona" :persona="persona" @success="navigateTo('/personas/new')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'" :label="t(isUpdate ? 'updatePersona' : 'createPersona')" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    titleCreate: Create Persona
    titleUpdate: Update Persona
    descriptionCreate: Create a new persona with their own perceptions and knowledge states.
    descriptionUpdate: Update this persona’s perceptions and knowledge states.
    name:
      label: Name
      required: Name is required
    selfPerception:
      label: Self Perception
      help: How the persona views themselves
    publicPerception:
      label: Public Perception
      help: How others perceive the persona
    privateKnowledge:
      label: Private Knowledge
      help: What only the persona knows
    publicKnowledge:
      label: Public Knowledge
      help: What others know for a fact about the persona
    createPersona: Create Persona
    updatePersona: Update Persona
    personaCreated: Persona created.
    personaUpdated: Persona updated.
    saveFailed: Failed to save persona.
</i18n>