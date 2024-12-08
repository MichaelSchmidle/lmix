<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Assistant, AssistantInsert } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
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

const handleSubmit = async (form: AssistantInsert, node: FormKitNode) => {
  try {
    const uuid = await assistantStore.upsertAssistant({
      ...form,
      uuid: props.assistant?.uuid,
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
  <UiSection icon="i-ph-head-circuit-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleInsert')"
    :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionInsert')">
    <UCard>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="assistant">
        <FormKit type="text" name="name" :label="t('name.label')" validation="required"
          :validation-messages="{ required: t('name.required') }" />
        <FormKit type="dropdown" name="persona_uuid" :label="t('persona.label')" :help="t('persona.help')"
          validation="required" :validation-messages="{ required: t('persona.required') }"
          :options="getPersonaOptions()" />
        <FormKit type="dropdown" name="model_uuid" :label="t('model.label')" :help="t('model.help')"
          validation="required" :validation-messages="{ required: t('model.required') }" :options="getModelOptions" />
        <template #actions="{ disabled }">
          <UiFormActions>
            <AssistantsDeleteModal v-if="assistant" :assistant="assistant" @success="navigateTo('/assistants/add')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'"
              :label="t(isUpdate ? 'updateAssistant' : 'createAssistant')" :loading="(disabled as boolean)" size="lg"
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
  descriptionInsert: Create a new assistant to enact a persona powered by a model.
  descriptionUpdate: Configure this assistant’s model and persona.
  name:
    label: Name
    placeholder: Enter assistant name…
    required: Name is required.
  persona:
    label: Persona
    help: Select the persona that this assistant will embody.
    required: Persona is required.
  model:
    label: Model
    help: Select the model that will power this assistant.
    required: Model is required.
  createAssistant: Create
  updateAssistant: Update
  assistantCreated: Assistant created.
  assistantUpdated: Assistant updated.
  saveFailed: Failed to save assistant.
</i18n>