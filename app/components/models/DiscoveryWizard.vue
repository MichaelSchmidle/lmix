<template>
  <UContainer>
    <!-- Stepper -->
    <UStepper
      disabled
      :items="steps"
      :current="currentStep - 1"
    />

    <!-- Step 1: Provider Configuration -->
    <UCard v-if="currentStep === 0">
      <template #header>
        <h2 class="text-lg font-bold">{{ t('step1.title') }}</h2>
        <p class="text-sm text-muted">{{ t('step1.description') }}</p>
      </template>

      <UForm
        :schema="providerConfigSchema"
        :state="providerConfig"
        @submit="discoverModels"
      >
        <UFormField
          name="apiEndpoint"
          :label="t('step1.endpoint.label')"
          :description="t('step1.endpoint.description')"
          required
        >
          <UInput
            v-model="providerConfig.apiEndpoint"
            :placeholder="t('step1.endpoint.placeholder')"
          />
        </UFormField>

        <UFormField
          name="apiKey"
          :label="t('step1.apiKey.label')"
          :description="t('step1.apiKey.description')"
        >
          <UInput
            v-model="providerConfig.apiKey"
            type="password"
            :placeholder="t('step1.apiKey.placeholder')"
            autocomplete="off"
          />
        </UFormField>

        <div class="flex gap-4 justify-end">
          <UButton
            :disabled="loading"
            variant="ghost"
            @click="$emit('cancel')"
          >
            {{ t('actions.cancel') }}
          </UButton>

          <UButton
            type="submit"
            :loading="loading"
          >
            {{ t('actions.discover') }}
          </UButton>
        </div>
      </UForm>
    </UCard>

    <!-- Step 2: Model Selection -->
    <UCard v-if="currentStep === 1">
      <template #header>
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-semibold">{{ $t('step2.header') }}</h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ $t('step2.description', { count: selectableModels.length }) }}
            </p>
          </div>
          <UBadge
            v-if="selectedCount > 0"
            variant="subtle"
          >
            {{ $t('step2.selected', { count: selectedCount }) }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Select All / Clear All -->
        <div class="flex justify-between items-center pb-3 border-b">
          <UCheckbox
            v-model="selectAll"
            :label="$t('step2.selectAll')"
            :indeterminate="selectedCount > 0 && selectedCount < availableCount"
            @change="toggleSelectAll"
          />
          <div class="text-sm text-gray-500">
            {{ $t('step2.available', { count: availableCount }) }}
          </div>
        </div>

        <!-- Model List -->
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="model in selectableModels"
            :key="model.id"
            :class="[
              'flex items-center justify-between p-3 rounded-lg border',
              model.disabled ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50',
            ]"
          >
            <UCheckbox
              v-model="selectedModelIds"
              :value="model.id"
              :disabled="model.disabled"
              class="flex-1"
            >
              <template #label>
                <div class="ml-3">
                  <div class="font-medium">{{ model.name }}</div>
                  <div class="text-sm text-gray-500">
                    {{ model.id }}
                    <span
                      v-if="model.provider"
                      class="ml-2"
                      >• {{ model.provider }}</span
                    >
                  </div>
                </div>
              </template>
            </UCheckbox>

            <UBadge
              v-if="model.isAlreadyConfigured"
              variant="subtle"
              color="gray"
              size="xs"
            >
              {{ $t('step2.configured') }}
            </UBadge>
          </div>
        </div>

        <!-- Error Message -->
        <UAlert
          v-if="error"
          color="red"
          :title="$t('errors.title')"
          :description="error"
          :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'ghost' }"
          @close="error = null"
        />
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton
            variant="ghost"
            :disabled="loading"
            @click="currentStep = 1"
          >
            {{ $t('actions.back') }}
          </UButton>

          <div class="space-x-3">
            <UButton
              variant="ghost"
              :disabled="loading"
              @click="$emit('cancel')"
            >
              {{ $t('actions.cancel') }}
            </UButton>

            <UButton
              :loading="loading"
              :disabled="selectedCount === 0"
              @click="createModels"
            >
              {{ $t('actions.add', { count: selectedCount }) }}
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type {
  ProviderConfig,
  ProviderModel,
  SelectableModel,
} from '~/types/models'
import {
  fetchProviderModels,
  transformToSelectableModels,
  detectProviderType,
  normalizeEndpoint,
  getDefaultModelConfig,
} from '~/utils/providers'

const { t } = useI18n({ useScope: 'local' })
const modelsStore = useModelsStore()
const toast = useToast()

const emit = defineEmits<{
  cancel: []
  success: [models: any[]]
}>()

// State
const currentStep = ref<0 | 1>(0)
const loading = ref(false)
const error = ref<string | null>(null)

// Stepper configuration (Nuxt UI Stepper format)
const steps = computed(() => [
  {
    icon: 'i-ph-number-one',
    title: t('step1.title'),
  },
  {
    icon: 'i-ph-number-two',
    title: t('step2.title'),
  },
])

// Form validation schema using Zod
const providerConfigSchema = z.object({
  apiEndpoint: z.string()
    .min(1, t('validation.endpointRequired'))
    .url(t('validation.invalidUrl')),
  apiKey: z.string().nullable().optional(),
})

type ProviderConfigSchema = z.output<typeof providerConfigSchema>

// Step 1: Provider Configuration
const providerConfig = reactive<ProviderConfigSchema>({
  apiEndpoint: '',
  apiKey: null,
})

// Step 2: Model Selection
const discoveredModels = ref<ProviderModel[]>([])
const selectableModels = ref<SelectableModel[]>([])
const selectedModelIds = ref<string[]>([])
const selectAll = ref(false)

// Computed
const selectedCount = computed(() => selectedModelIds.value.length)
const availableCount = computed(
  () => selectableModels.value.filter((m) => !m.disabled).length
)

// Actions
async function discoverModels(event: FormSubmitEvent<ProviderConfigSchema>) {
  loading.value = true
  error.value = null

  try {
    // Fetch models from provider using validated data
    discoveredModels.value = await fetchProviderModels(event.data)

    // Get existing models to check for duplicates
    const existingModels = modelsStore.modelsList
    const existingSet = new Set(
      existingModels.map((m) => `${m.modelId}|${m.apiEndpoint}`)
    )

    // Transform to selectable format
    selectableModels.value = transformToSelectableModels(
      discoveredModels.value,
      existingSet,
      normalizeEndpoint(
        event.data.apiEndpoint,
        detectProviderType(event.data.apiEndpoint)
      )
    )

    // Auto-select all available models
    selectedModelIds.value = selectableModels.value
      .filter((m) => !m.disabled)
      .map((m) => m.id)

    // Move to step 2
    currentStep.value = 2

    // Show success message
    toast.add({
      title: t('success.discovered'),
      description: t('success.discoveredDescription', {
        count: discoveredModels.value.length,
      }),
      color: 'green',
    })
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : t('errors.discoveryFailed')
    toast.add({
      title: t('errors.title'),
      description: error.value,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedModelIds.value = selectableModels.value
      .filter((m) => !m.disabled)
      .map((m) => m.id)
  } else {
    selectedModelIds.value = []
  }
}

async function createModels() {
  loading.value = true
  error.value = null

  try {
    const providerType = detectProviderType(providerConfig.apiEndpoint)
    const normalizedEndpoint = normalizeEndpoint(
      providerConfig.apiEndpoint,
      providerType
    )
    const defaultConfig = getDefaultModelConfig(providerType)

    // Prepare model data
    const modelsToCreate = selectedModelIds.value.map((modelId) => {
      const model = selectableModels.value.find((m) => m.id === modelId)!
      return {
        name: model.name,
        apiEndpoint: normalizedEndpoint,
        apiKey: providerConfig.apiKey,
        modelId: model.id,
        config: defaultConfig,
        isDefault: false,
      }
    })

    // Create models via store
    const response = await modelsStore.createModels(modelsToCreate)

    // Show success message
    toast.add({
      title: t('success.created'),
      description: t('success.createdDescription', { count: response.count }),
      color: 'green',
    })

    // Emit success event
    emit('success', response.models)
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : t('errors.creationFailed')
    toast.add({
      title: t('errors.title'),
      description: error.value,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

// Watch for changes in selection
watch(selectedModelIds, () => {
  const available = selectableModels.value.filter((m) => !m.disabled)
  if (selectedModelIds.value.length === 0) {
    selectAll.value = false
  } else if (selectedModelIds.value.length === available.length) {
    selectAll.value = true
  }
})
</script>

<i18n lang="yaml">
en:
  step1:
    title: Configure Provider
    description: Enter the API endpoint and key for your model provider to discover available models.
    endpoint:
      label: API Endpoint
      description: The base URL for the model provider
      placeholder: https://api.openai.com/v1
    apiKey:
      label: API Key
      description: Required for most providers
      placeholder: sk-…
  step2:
    title: Select Models
    description: Select the models you want to add from the discovered list.
    selected: '{count} selected'
    available: '{count} available'
    selectAll: Select all
    configured: Already configured
  actions:
    cancel: Cancel
    back: Back
    discover: Discover Models
    create: 'Create Models'
  validation:
    endpointRequired: API endpoint is required
    invalidUrl: Please enter a valid URL
  success:
    discovered: Models discovered
    discoveredDescription: 'Found {count} models from the provider'
    created: Models added
    createdDescription: 'Successfully added {count} model(s)'
  errors:
    title: Error
    discoveryFailed: Failed to discover models
    creationFailed: Failed to create models
</i18n>
