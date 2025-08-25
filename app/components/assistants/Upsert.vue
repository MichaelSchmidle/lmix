<template>
  <UContainer>
    <USkeleton
      v-if="assistantId && !assistant"
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
            :disabled="!isClient || personaStore.loading || assistantStore.busy"
            icon="i-ph-mask-happy-fill"
            :items="personaOptions"
            :loading="personaStore.loading"
            :placeholder="t('fields.persona.placeholder')"
            value-key="value"
          />
        </UFormField>

        <UFormField
          name="modelId"
          :label="t('fields.model.label')"
          :description="t('fields.model.description')"
          required
        >
          <UInputMenu
            v-model="formState.modelId"
            :disabled="!isClient || modelStore.loading || assistantStore.busy"
            icon="i-ph-circuitry-fill"
            :items="modelOptions"
            :loading="modelStore.loading"
            :placeholder="t('fields.model.placeholder')"
            value-key="value"
          />
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
            icon="i-ph-plus"
            :label="isCreateMode ? t('actions.create') : t('actions.save')"
            :loading="assistantStore.busy"
          />
        </div>
      </UForm>
    </UPageCard>
  </UContainer>
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
const personaStore = usePersonaStore()
const modelStore = useModelStore()
const toast = useToast()
const router = useRouter()
const localePath = useLocalePath()

const props = defineProps<{
  assistantId?: string
}>()

// Determine if we're in create or update mode
const isCreateMode = computed(() => !props.assistantId)

// Check if we're on client side to avoid hydration mismatch
const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})

// Get the existing assistant if in update mode
const assistant = computed<Assistant | undefined>(() =>
  props.assistantId
    ? assistantStore.getAssistantById(props.assistantId)
    : undefined
)

// Form state
const formState = ref<CreateAssistantInput | UpdateAssistantInput>({
  personaId: '',
  modelId: '',
  name: null,
})


// Validation schema
const assistantSchema = z.object({
  personaId: z.string().min(1, t('validation.persona.required')).uuid(t('validation.persona.invalid')),
  modelId: z.string().min(1, t('validation.model.required')).uuid(t('validation.model.invalid')),
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
  () => assistant.value,
  (newAssistant) => {
    if (newAssistant) {
      // Deep copy the assistant to form state, excluding system fields
      const {
        id,
        userId,
        createdAt,
        updatedAt,
        persona,
        model,
        ...assistantData
      } = newAssistant
      formState.value = {
        ...assistantData,
        personaId: assistantData.personaId || '',
        modelId: assistantData.modelId || '',
        name: assistantData.name || null,
      }

      // Form state already contains the IDs, no additional setup needed
    }
  },
  { immediate: true }
)

// Fetch personas and models on component mount
onMounted(async () => {
  // Fetch data if not already loaded
  const fetchPromises = []

  if (!personaStore.personasList.length) {
    fetchPromises.push(personaStore.fetchPersonas())
  }
  if (!modelStore.modelsList.length) {
    fetchPromises.push(modelStore.fetchModels())
  }

  // Wait for data to be loaded
  await Promise.all(fetchPromises)

  // For new assistants, set default model if available
  if (isCreateMode.value && modelStore.defaultModel && !formState.value.modelId) {
    formState.value.modelId = modelStore.defaultModel.id
  }
})

// Submit handler
const handleSubmit = async () => {
  // Ensure we have valid selections
  if (!formState.value.personaId || !formState.value.modelId) {
    toast.add({
      color: 'error',
      icon: 'i-ph-warning-circle-fill',
      title: t('validation.required.title'),
      description: t('validation.required.description'),
    })
    return
  }

  try {
    let result: Assistant

    if (isCreateMode.value) {
      // Create new assistant
      result = await assistantStore.createAssistant(
        formState.value as CreateAssistantInput
      )

      toast.add({
        color: 'success',
        icon: 'i-ph-check-circle-fill',
        title: t('create.success.title'),
        description: t('create.success.description', {
          name:
            result.name || `${result.persona?.name} + ${result.model?.name}`,
        }),
      })

      // Navigate back to assistants list to show the new assistant
      router.push(localePath({ name: 'assistants' }))
    } else {
      // Update existing assistant
      result = await assistantStore.updateAssistant(
        props.assistantId!,
        formState.value
      )

      toast.add({
        color: 'success',
        icon: 'i-ph-check-circle-fill',
        title: t('update.success.title'),
        description: t('update.success.description', {
          name:
            result.name || `${result.persona?.name} + ${result.model?.name}`,
        }),
      })
    }
  } catch (error: any) {
    console.error(error)

    // Check for specific error messages
    let errorDescription = isCreateMode.value
      ? t('create.error.description')
      : t('update.error.description')

    if (error.data?.statusMessage?.includes('already exists')) {
      errorDescription = t('error.duplicate')
    }

    toast.add({
      color: 'error',
      icon: 'i-ph-x-circle-fill',
      title: isCreateMode.value
        ? t('create.error.title')
        : t('update.error.title'),
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
    model:
      label: Model
      description: The AI model that will power this assistant
      placeholder: Select a model
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
      description: "Assistant '{name}' has been successfully created."
    error:
      title: Creation Failed
      description: Failed to create the assistant. Please try again.
  update:
    success:
      title: Assistant Updated
      description: "Assistant '{name}' has been successfully updated."
    error:
      title: Update Failed
      description: Failed to update the assistant. Please try again.
  error:
    duplicate: An assistant with this persona and model combination already exists.
</i18n>
