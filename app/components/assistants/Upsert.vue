<template>
  <USkeleton
    v-if="loading"
    class="h-128 w-full"
  />
  <UPageCard
    v-else
    :title="t('title')"
    :description="t('description')"
  >
    <UForm
      :schema="assistantSchema"
      :state="formState"
      :validate-on="['change', 'input']"
      @submit="handleSubmit"
    >
      <UFormField
        name="personaId"
        :label="t('fields.persona.label')"
        :description="t('fields.persona.description')"
        required
      >
        <UInputMenu
          v-model="formState.personaId"
          autofocus
          :disabled="assistantStore.busy"
          icon="i-ph-mask-happy-fill"
          :items="personaOptions"
          :loading="personaStore.loading"
          :placeholder="t('fields.persona.placeholder')"
          value-key="value"
        >
          <template #empty>
            <EmptyState
              class="text-start"
              :description="t('fields.persona.empty')"
            />
          </template>
        </UInputMenu>
      </UFormField>

      <UFormField
        name="modelId"
        :label="t('fields.model.label')"
        :description="t('fields.model.description')"
        required
      >
        <UInputMenu
          v-model="formState.modelId"
          :disabled="assistantStore.busy"
          icon="i-ph-circuitry-fill"
          :items="modelOptions"
          :loading="modelStore.loading"
          :placeholder="t('fields.model.placeholder')"
          value-key="value"
        >
          <template #empty>
            <EmptyState
              class="text-start"
              :description="t('fields.model.empty')"
            />
          </template>
        </UInputMenu>
      </UFormField>

      <UFormField
        name="name"
        :label="t('fields.name.label')"
        :description="t('fields.name.description')"
      >
        <UInput
          v-model="formState.name"
          :placeholder="t('fields.name.placeholder')"
        />
      </UFormField>

      <!-- Actions -->
      <div class="flex gap-4 justify-end mt-6">
        <UButton
          type="submit"
          :disabled="assistantStore.busy"
          icon="i-ph-check"
          :label="t('actions.save')"
          :loading="assistantStore.busy"
        />
      </div>
    </UForm>
  </UPageCard>
</template>

<script setup lang="ts">
import { z } from 'zod'

import type {
  Assistant,
  CreateAssistantInput,
  UpdateAssistantInput,
} from '~/types/assistants'

const { t } = useI18n()
const assistantStore = useAssistantStore()
const { loading } = storeToRefs(assistantStore)
const personaStore = usePersonaStore()
const modelStore = useModelStore()
const toast = useToast()
const router = useRouter()
const localePath = useLocalePath()

const props = defineProps<{
  assistant?: Assistant
}>()

// Form state
const formState = ref<CreateAssistantInput | UpdateAssistantInput>({
  personaId: '',
  modelId: '',
  name: null,
})

// Validation schema
const assistantSchema = z.object({
  personaId: z
    .string()
    .min(1, t('validation.persona.required'))
    .uuid(t('validation.persona.invalid')),
  modelId: z
    .string()
    .min(1, t('validation.model.required'))
    .uuid(t('validation.model.invalid')),
  name: z.string().nullable().optional(),
})

// Persona options for select menu
const personaOptions = computed(() =>
  personaStore.sortedPersonas.map((persona) => ({
    value: persona.id,
    label: persona.name,
  }))
)

// Model options for select menu
const modelOptions = computed(() =>
  modelStore.sortedModels.map((model) => ({
    value: model.id,
    label: `${model.name}${model.isDefault ? ' (Default)' : ''}`,
  }))
)

// Initialize form when assistant prop changes
watch(
  () => props.assistant,
  (newAssistant) => {
    if (newAssistant) {
      formState.value = {
        personaId: newAssistant.personaId || '',
        modelId: newAssistant.modelId || '',
        name: newAssistant.name || null,
      }
    }
  },
  { immediate: true }
)

// For new assistants, set default model if available
onMounted(() => {
  if (!props.assistant && modelStore.defaultModel && !formState.value.modelId) {
    formState.value.modelId = modelStore.defaultModel.id
  }
})

// Submit handler
const handleSubmit = async () => {
  try {
    if (!props.assistant) {
      // Create new assistant
      await assistantStore.createAssistant(
        formState.value as CreateAssistantInput
      )

      toast.add({
        color: 'success',
        icon: 'i-ph-check-circle-fill',
        title: t('create.success.title'),
        description: t('create.success.description'),
      })

      // Navigate back to assistants list to show the new assistant
      router.push(localePath({ name: 'assistants' }))
    } else {
      // Update existing assistant
      await assistantStore.updateAssistant(
        props.assistant.id,
        formState.value
      )

      toast.add({
        color: 'success',
        icon: 'i-ph-check-circle-fill',
        title: t('update.success.title'),
        description: t('update.success.description'),
      })
    }
  } catch (error) {
    console.error(error)

    const apiError = error as { data?: { statusMessage?: string; code?: string } }
    
    // Check for specific error codes
    let errorDescription = props.assistant
      ? t('update.error.description')
      : t('create.error.description')

    // Handle specific error codes
    if (apiError.data?.code === 'ASSISTANT_DUPLICATE') {
      errorDescription = t('error.duplicate')
    }

    toast.add({
      color: 'error',
      icon: 'i-ph-x-circle-fill',
      title: props.assistant
        ? t('update.error.title')
        : t('create.error.title'),
      description: errorDescription,
    })
  }
}
</script>

<i18n lang="yaml">
en:
  title: Assistant Details
  description: Configure the pairing of a persona with a model.
  fields:
    persona:
      label: Persona
      description: The character or personality for this assistant
      placeholder: Select a persona
      empty: No personas yet
    model:
      label: Model
      description: The AI model that will power this assistant
      placeholder: Select a model
      empty: No models yet
    name:
      label: Display Name (Optional)
      description: Custom name for this assistant (overrides default)
      placeholder: e.g., Alice (GPT-4)
  actions:
    create: Create Assistant
    save: Save Changes
  validation:
    persona:
      required: Please select a persona
      invalid: Please select a valid persona
    model:
      required: Please select a model
      invalid: Please select a valid model
    required:
      title: Missing Required Fields
      description: Please select both a persona and a model
  create:
    success:
      title: Assistant Created
      description: 'Assistant has been successfully created.'
    error:
      title: Creation Failed
      description: Failed to create the assistant. Please try again.
  update:
    success:
      title: Assistant Updated
      description: 'Assistant has been successfully updated.'
    error:
      title: Update Failed
      description: Failed to update the assistant. Please try again.
  error:
    duplicate: An assistant with this persona and model combination already exists.
</i18n>
