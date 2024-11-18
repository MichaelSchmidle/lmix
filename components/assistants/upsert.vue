<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Assistant, AssistantInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const user = useSupabaseUser()
const assistantStore = useAssistantStore()
const modelStore = useModelStore()
const personaStore = usePersonaStore()

const props = defineProps({
  assistant: {
    type: Object as PropType<Assistant>,
    default: undefined,
  },
})

const isUpdate = computed(() => !!props.assistant)

const { getModelOptions } = storeToRefs(modelStore)
const { getPersonaOptions } = storeToRefs(personaStore)

const handleSubmit = async (form: Partial<AssistantInsert>, node: FormKitNode) => {
  try {
    const uuid = await assistantStore.upsertAssistant({
      ...form,
      uuid: props.assistant?.uuid,
      user_uuid: user.value!.id,
    } as AssistantInsert)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'assistantUpdated' : 'assistantCreated'),
    })

    navigateTo(`/assistants/${uuid}`)
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('saveFailed')])
  }
}
</script>

<template>
  <UiSection icon="i-ph-head-circuit-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleCreate')" :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionCreate')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="assistant">
        <FormKit type="text" name="name" :label="t('name.label')" validation="required" :validation-messages="{ required: t('name.required') }" />
        <FormKit type="select" name="model_uuid" :label="t('model.label')" :placeholder="t('model.placeholder')" validation="required" :validation-messages="{ required: t('model.required') }" :options="getModelOptions" />
        <FormKit type="select" name="persona_uuid" :label="t('persona.label')" :placeholder="t('persona.placeholder')" validation="required" :validation-messages="{ required: t('persona.required') }" :options="getPersonaOptions" />
        <template #actions>
          <UiFormActions>
            <AssistantsDeleteModal v-if="assistant" :assistant="assistant" @success="navigateTo('/assistants/new')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'" :label="t(isUpdate ? 'updateAssistant' : 'createAssistant')" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    titleCreate: Create Assistant
    titleUpdate: Update Assistant
    descriptionCreate: Create a new assistant by combining a model with a persona.
    descriptionUpdate: Update this assistant’s configuration.
    name:
      label: Name
      placeholder: Enter assistant name…
      required: Name is required
    model:
      label: Model
      placeholder: Select a model…
      required: Model is required
    persona:
      label: Persona
      placeholder: Select a persona…
      required: Persona is required
    createAssistant: Create Assistant
    updateAssistant: Update Assistant
    assistantCreated: Assistant created.
    assistantUpdated: Assistant updated.
    saveFailed: Failed to save assistant.
</i18n>