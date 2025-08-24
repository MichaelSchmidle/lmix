<template>
  <UContainer>
    <!-- Stepper -->
    <UStepper
      v-model="currentStep"
      disabled
      :items="steps"
      :default-value="0"
    />

    <!-- Step 1: Provider Configuration -->
    <UPageCard
      v-if="currentStep === 0"
      :title="t('steps.0.title')"
      :description="t('steps.0.description')"
    >
      <UForm
        :schema="providerConfigSchema"
        :state="providerConfig"
        :validate-on="['change', 'input']"
        @submit="handleDiscoverModels"
      >
        <UFormField
          name="apiEndpoint"
          :label="t('steps.0.endpoint.label')"
          :description="t('steps.0.endpoint.description')"
          required
        >
          <template #description>
            <i18n-t keypath="steps.0.endpoint.description">
              <template #version>
                <span class="prose dark:prose-invert prose-sm">
                  <code>/v1</code>
                </span>
              </template>
            </i18n-t>
          </template>

          <UInput
            v-model="providerConfig.apiEndpoint"
            autofocus
            :placeholder="t('steps.0.endpoint.placeholder')"
          />
        </UFormField>

        <UFormField
          name="apiKey"
          :label="t('steps.0.apiKey.label')"
          :description="t('steps.0.apiKey.description')"
        >
          <UInput
            v-model="providerConfig.apiKey"
            type="password"
            :placeholder="t('steps.0.apiKey.placeholder')"
          />
        </UFormField>

        <div class="flex gap-4 justify-end">
          <UButton
            type="submit"
            icon="i-ph-magnifying-glass"
            :label="t('actions.discover')"
            :loading="loading"
          />
        </div>
      </UForm>
    </UPageCard>

    <!-- Step 2: Model Selection -->
    <UPageCard
      v-if="currentStep === 1"
      :title="t('steps.1.title')"
    >
      <template #description>
        <i18n-t
          class="text-sm text-muted"
          keypath="steps.1.description"
          tag="p"
        >
          <template #endpoint>
            <span class="prose dark:prose-invert prose-sm"
              ><code>{{ providerConfig.apiEndpoint }}</code></span
            >
          </template>
        </i18n-t>
      </template>

      <UForm
        :schema="modelSelectionSchema"
        :state="modelSelection"
        :validate-on="['change']"
        @submit="handleCreateModels"
      >
        <UFormField
          name="selectedModels"
          :label="t('steps.1.models.label')"
          required
        >
          <!-- Select All -->
          <UCheckbox
            v-model="selectAll"
            class="mb-1"
            :label="t('steps.1.selectAll')"
            @update:model-value="toggleSelectAll"
          />

          <!-- Model Selection -->
          <UCheckboxGroup
            v-model="modelSelection.selectedModels"
            :items="checkboxItems"
            value-key="value"
          />
        </UFormField>

        <div class="flex gap-4 justify-end">
          <UButton
            type="button"
            :disabled="loading"
            :label="t('actions.back')"
            variant="outline"
            @click="currentStep = 0"
          />

          <UButton
            type="submit"
            icon="i-ph-plus"
            :label="t('actions.create')"
            :loading="loading"
          />
        </div>
      </UForm>
    </UPageCard>
  </UContainer>
</template>

<script setup lang="ts">
// ===== IMPORTS =====
import { z } from 'zod'
import type { CheckboxGroupItem, StepperItem } from '@nuxt/ui'
import type { Model } from '~/types/models'

interface ModelsResponse {
  object: 'list'
  data: Model[]
}

interface CreateModelsResponse {
  models: Model[]
  count: number
  skipped: number
  message: string
}

// No emits needed - just reset form after success

// ===== COMPOSABLES =====
const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const modelStore = useModelStore()

// ===== VALIDATION SCHEMAS =====
const providerConfigSchema = z.object({
  apiEndpoint: z
    .string()
    .min(1, t('validation.endpoint.required'))
    .url(t('validation.endpoint.invalidUrl'))
    .refine(
      (url) => /\/v\d+(?:\/|$)/.test(url),
      t('validation.endpoint.missingVersion')
    ),
  apiKey: z.string().nullable().optional(),
})

const modelSelectionSchema = z.object({
  selectedModels: z.array(z.string()).min(1, t('validation.models.required')),
})

type ProviderConfigSchema = z.output<typeof providerConfigSchema>

// ===== INITIAL STATES =====
const initialProviderConfig: ProviderConfigSchema = {
  apiEndpoint: '',
  apiKey: null,
}

const initialModelSelection = {
  selectedModels: [] as string[],
}

// ===== STATE =====
const currentStep = ref<0 | 1>(0)
const loading = ref(false)
const models = ref<Model[]>([])
const selectAll = ref(false)

// Form state
const providerConfig = reactive<ProviderConfigSchema>({
  ...initialProviderConfig,
})
const modelSelection = reactive({ ...initialModelSelection })

// ===== COMPUTED =====
const steps: StepperItem[] = [
  {
    icon: 'i-ph-number-one',
    title: t('steps.0.title'),
  },
  {
    icon: 'i-ph-number-two',
    title: t('steps.1.title'),
  },
]

// Get existing model IDs from the store
const existingModelIds = computed(
  () =>
    new Set(
      modelStore.modelsList
        .filter((m) => m.apiEndpoint === providerConfig.apiEndpoint)
        .map((m) => m.modelId)
    )
)

const checkboxItems = computed<CheckboxGroupItem[]>(() =>
  models.value.map((model) => ({
    value: model.id,
    label: model.id,
    disabled: existingModelIds.value.has(model.id),
    description: existingModelIds.value.has(model.id)
      ? t('steps.1.configured')
      : undefined,
  }))
)

// ===== WATCHERS =====
watch(
  () => modelSelection.selectedModels,
  (newSelection) => {
    // Only consider non-disabled models for "select all" state
    const availableModels = models.value.filter(
      (model) => !existingModelIds.value.has(model.id)
    )
    selectAll.value =
      newSelection.length === availableModels.length &&
      availableModels.length > 0
  },
  { deep: true }
)

// ===== METHODS =====
const resetForm = () => {
  currentStep.value = 0
  models.value = []
  selectAll.value = false
  Object.assign(modelSelection, initialModelSelection)
  Object.assign(providerConfig, initialProviderConfig)
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    // Only select models that aren't already configured
    modelSelection.selectedModels = models.value
      .filter((model) => !existingModelIds.value.has(model.id))
      .map((model) => model.id)
  } else {
    modelSelection.selectedModels = []
  }
}

const handleDiscoverModels = async () => {
  try {
    loading.value = true

    // Remove trailing slash from endpoint if present
    providerConfig.apiEndpoint = providerConfig.apiEndpoint.replace(/\/$/, '')

    const response: ModelsResponse = await $fetch(
      `${providerConfig.apiEndpoint}/models`,
      {
        headers: providerConfig.apiKey
          ? { Authorization: `Bearer ${providerConfig.apiKey}` }
          : undefined,
      }
    )

    models.value = response.data

    // Only advance to step 1 if we found models
    if (models.value.length > 0) {
      currentStep.value = 1
    } else {
      toast.add({
        color: 'error',
        icon: 'i-ph-warning-fill',
        title: t('errors.title'),
        description: t('errors.noModelsFound'),
        duration: 0,
      })
    }
  } catch (error: unknown) {
    console.error('Error fetching models:', error)
    toast.add({
      color: 'error',
      icon: 'i-ph-warning-fill',
      title: t('errors.title'),
      description: t('errors.discoveryFailed'),
      duration: 0,
    })
  } finally {
    loading.value = false
  }
}

const handleCreateModels = async () => {
  try {
    loading.value = true

    // Create model input objects from selected models and provider config
    const modelInputs = modelSelection.selectedModels.map((modelId) => ({
      name: String(modelId),
      apiEndpoint: providerConfig.apiEndpoint,
      apiKey: providerConfig.apiKey,
      modelId: String(modelId),
      config: {
        temperature: 0.7,
        maxTokens: 2048,
      },
    }))

    // Create the models using the store
    const result = (await modelStore.createModels(
      modelInputs
    )) as CreateModelsResponse

    toast.add({
      color: 'success',
      icon: 'i-ph-check-circle-fill',
      title: t('success.created'),
      description: t('success.createdDescription', {
        count: result.count,
      }),
    })

    // Reset form to allow creating more models
    resetForm()
  } catch (error: unknown) {
    console.error('Error creating models:', error)
    toast.add({
      color: 'error',
      icon: 'i-ph-warning-fill',
      title: t('errors.title'),
      description: t('errors.creationFailed'),
    })
  } finally {
    loading.value = false
  }
}
</script>

<i18n lang="yaml">
en:
  steps:
    0:
      title: Configure Provider
      description: Enter the API endpoint and key for your OpenAI API-compatible model provider to discover available models.
      endpoint:
        label: API Endpoint
        description: The base URL for the model provider including the version path (e.g., {version})
        placeholder: https://api.openai.com/v1
      apiKey:
        label: API Key
        description: Your API key for authentication (leave empty if not required)
        placeholder: sk-…
    1:
      title: Select Models
      description: Select the models you want to add from {endpoint}.
      selectAll: Select all
      configured: Already configured
      models:
        label: Available Models
  actions:
    back: Back
    discover: Discover Models
    create: 'Create Models'
  validation:
    endpoint:
      required: API endpoint is required.
      invalidUrl: Please enter a valid URL.
      missingVersion: URL must include a version path.
    models:
      required: Please select at least one model.
  success:
    created: Models Added
    createdDescription: Successfully added {count} model.|Successfully added {count} model.
  errors:
    title: Error
    discoveryFailed: Failed to discover models.
    noModelsFound: No models found at this endpoint.
    creationFailed: Failed to create models.
</i18n>
