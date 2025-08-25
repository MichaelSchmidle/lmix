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
      :schema="localizedUpdateModelSchema"
      :state="formState"
      :validate-on="['blur', 'input']"
      @submit="handleUpdate"
    >
      <UFormField
        name="name"
        :label="t('fields.name.label')"
        :description="t('fields.name.description')"
        required
      >
        <UInput
          v-model="formState.name"
          autofocus
          :placeholder="t('fields.name.placeholder')"
        />
      </UFormField>

      <UFormField
        name="modelId"
        :label="t('fields.modelId.label')"
        :description="t('fields.modelId.description')"
        required
      >
        <UInput
          v-model="formState.modelId"
          :placeholder="t('fields.modelId.placeholder')"
        />
      </UFormField>

      <UFormField
        name="apiEndpoint"
        :label="t('fields.apiEndpoint.label')"
        required
      >
        <template #description>
          <i18n-t keypath="fields.apiEndpoint.description">
            <template #version>
              <span class="prose dark:prose-invert prose-sm">
                <code>/v1</code>
              </span>
            </template>
          </i18n-t>
        </template>

        <UInput
          v-model="formState.apiEndpoint"
          :placeholder="t('fields.apiEndpoint.placeholder')"
        />
      </UFormField>

      <UFormField
        name="apiKey"
        :label="t('fields.apiKey.label')"
        :description="t('fields.apiKey.description')"
      >
        <UInput
          v-model="formState.apiKey"
          type="password"
          :placeholder="t('fields.apiKey.placeholder')"
        />
      </UFormField>

      <UFormField
        name="isDefault"
        :label="t('fields.isDefault.label')"
        :description="t('fields.isDefault.description')"
      >
        <UCheckbox
          v-model="formState.isDefault"
          :label="t('fields.isDefault.checkbox')"
        />
      </UFormField>

      <!-- Actions -->
      <div class="flex gap-4 justify-end mt-6">
        <UButton
          color="neutral"
          :disabled="modelStore.busy"
          icon="i-ph-plug-fill"
          :label="t('actions.test')"
          :loading="isTesting"
          variant="ghost"
          @click="handleTestConnection"
        />

        <UButton
          type="submit"
          color="primary"
          :disabled="isTesting || modelStore.busy"
          icon="i-ph-check"
          :label="t('actions.save')"
          :loading="modelStore.busy"
        />
      </div>
    </UForm>
  </UPageCard>
</template>

<script setup lang="ts">
import type { Model, UpdateModelInput } from '~/types/models'
import { updateModelSchema } from '../../../shared/validation'

const { t } = useI18n()
const modelStore = useModelStore()
const { loading } = storeToRefs(modelStore)
const toast = useToast()

const props = defineProps<{
  model?: Model
}>()

// Form state
const isTesting = ref(false)

// Initialize form state
const formState = ref<UpdateModelInput>({
  name: '',
  modelId: '',
  apiEndpoint: '',
  apiKey: null,
  isDefault: false,
})

// Check if form has changes
const hasChanges = computed(() => {
  if (!props.model) return false

  return (
    formState.value.name !== props.model.name ||
    formState.value.modelId !== props.model.modelId ||
    formState.value.apiEndpoint !== props.model.apiEndpoint ||
    formState.value.apiKey !== (props.model.apiKey || null) ||
    formState.value.isDefault !== props.model.isDefault
  )
})

// Validation schema with localized messages
const localizedUpdateModelSchema = updateModelSchema.extend({
  name: updateModelSchema.shape.name.refine(
    (name) => name.length > 0,
    t('validation.name.required')
  ),
  modelId: updateModelSchema.shape.modelId.refine(
    (id) => id.length > 0,
    t('validation.modelId.required')
  ),
  apiEndpoint: updateModelSchema.shape.apiEndpoint
    .refine((url) => url.length > 0, t('validation.apiEndpoint.required'))
    .refine(
      (url) => /^https?:\/\/.+/.test(url),
      t('validation.apiEndpoint.invalidUrl')
    )
    .refine(
      (url) => /\/v\d+(?:\/|$)/.test(url),
      'URL must include a version path (e.g., /v1)'
    ),
})

// Initialize form when model prop changes
watch(
  () => props.model,
  (newModel) => {
    if (newModel) {
      // Deep copy the model to form state, excluding system fields
      const { id, createdAt, updatedAt, ...modelData } = newModel
      // Use JSON parse/stringify for deep clone to avoid proxy issues
      const clonedData = JSON.parse(JSON.stringify(modelData))
      formState.value = {
        ...clonedData,
        apiKey: clonedData.apiKey || null,
      }
    }
  },
  { immediate: true }
)

// Test connection handler
const handleTestConnection = async () => {
  isTesting.value = true

  try {
    await modelStore.testModelConnection(formState.value)

    toast.add({
      color: 'success',
      icon: 'i-ph-check-circle-fill',
      title: t('test.success.title'),
      description: t('test.success.description'),
    })
  } catch (error) {
    console.error('Model connection test failed:', error)

    // Extract error message from response
    let errorDescription = t('test.error.description')
    if (error && typeof error === 'object' && 'data' in error) {
      const errorData = error.data as Record<string, unknown>
      if (
        errorData?.statusMessage &&
        typeof errorData.statusMessage === 'string'
      ) {
        errorDescription = errorData.statusMessage
      }
    }

    toast.add({
      color: 'error',
      icon: 'i-ph-x-circle-fill',
      title: t('test.error.title'),
      description: errorDescription,
    })
  } finally {
    isTesting.value = false
  }
}

// Update handler
const handleUpdate = async () => {
  if (!props.model) return

  try {
    // Only perform updates if there are actual changes
    if (hasChanges.value) {
      // Update the model
      await modelStore.updateModel(props.model.id, formState.value)

      // If setting as default and it wasn't before
      if (formState.value.isDefault && !props.model.isDefault) {
        await modelStore.setDefaultModel(props.model.id)
      }
    }

    // Always show success feedback - users expect confirmation
    toast.add({
      color: 'success',
      icon: 'i-ph-check-circle-fill',
      title: t('success.title'),
      description: t('success.description', { name: formState.value.name }),
    })
  } catch (error) {
    console.error(error)

    toast.add({
      color: 'error',
      icon: 'i-ph-x-circle-fill',
      title: t('error.title'),
      description: t('error.description'),
    })
  }
}
</script>

<i18n lang="yaml">
en:
  title: Configure Model
  description: Update the settings for this model.
  fields:
    name:
      label: Model Name
      description: A friendly name to identify this model
      placeholder: GPT-4 Turbo
    modelId:
      label: Model ID
      description: The API model identifier
      placeholder: gpt-4-turbo-preview
    apiEndpoint:
      label: API Endpoint
      description: The base URL for the API including the version path (e.g., {version})
      placeholder: https://api.openai.com/v1
    apiKey:
      label: API Key
      description: Your API key for authentication (leave empty if not required)
      placeholder: sk-...
    isDefault:
      label: Default Model
      description: Use this model as the default for new assistants
      checkbox: Set as default model
  actions:
    save: Save Model
    test: Test Connection
  validation:
    name:
      required: Model name is required
    modelId:
      required: Model ID is required
    apiEndpoint:
      required: API endpoint is required
      invalidUrl: Must be a valid URL
  success:
    title: Model Updated
    description: The model has been successfully updated.
  error:
    title: Update Failed
    description: Failed to update the model. Please try again.
  test:
    success:
      title: Connection Successful
      description: The model connection was tested successfully.
    error:
      title: Connection Failed
      description: Failed to connect to the model API.
</i18n>
