<template>
  <div class="space-y-6">
    <!-- Step 1: Provider Configuration -->
    <div v-if="step === 1">
      <h3 class="text-lg font-semibold mb-4">{{ t('configureProvider') }}</h3>
      
      <UForm
        :schema="providerSchema"
        :state="providerState"
        @submit="fetchModels"
      >
        <div class="space-y-4">
          <UFormField
            label="API Endpoint"
            name="apiEndpoint"
            required
            help="Full URL to the model's API endpoint"
          >
            <UInput
              v-model="providerState.apiEndpoint"
              placeholder="https://api.openai.com/v1/chat/completions"
              size="lg"
            />
          </UFormField>

          <UFormField
            label="API Key"
            name="apiKey"
            help="Leave empty for local models like Ollama"
          >
            <UInput
              v-model="providerState.apiKey"
              type="password"
              placeholder="sk-..."
              size="lg"
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              size="lg"
              @click="$emit('cancel')"
            >
              {{ t('cancel') }}
            </UButton>
            <UButton
              type="submit"
              size="lg"
              :loading="fetchingModels"
            >
              {{ t('fetchModels') }}
            </UButton>
          </div>
        </div>
      </UForm>
    </div>

    <!-- Step 2: Select Models -->
    <div v-else-if="step === 2">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{{ t('selectModels') }}</h3>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-ph-arrow-left"
          @click="step = 1"
        >
          {{ t('back') }}
        </UButton>
      </div>

      <div v-if="availableModels.length === 0" class="text-center py-8 text-gray-500">
        {{ t('noModelsFound') }}
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="model in availableModels"
          :key="model.id"
          class="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          :class="{
            'border-primary-500 bg-primary-50 dark:bg-primary-900/20': selectedModels.has(model.id)
          }"
          @click="toggleModelSelection(model)"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ model.name }}</div>
              <div class="text-sm text-gray-500">{{ model.id }}</div>
            </div>
            <UCheckbox
              :model-value="selectedModels.has(model.id)"
              @update:model-value="toggleModelSelection(model)"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mt-6">
        <div class="text-sm text-gray-500">
          {{ t('selectedCount', { count: selectedModels.size }) }}
        </div>
        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            size="lg"
            @click="$emit('cancel')"
          >
            {{ t('cancel') }}
          </UButton>
          <UButton
            size="lg"
            :disabled="selectedModels.size === 0"
            @click="step = 3"
          >
            {{ t('next') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Step 3: Configure Selected Models -->
    <div v-else-if="step === 3">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{{ t('configureModels') }}</h3>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-ph-arrow-left"
          @click="step = 2"
        >
          {{ t('back') }}
        </UButton>
      </div>

      <UTabs :items="modelConfigTabs">
        <template #item="{ item }">
          <UForm
            :schema="modelConfigSchema"
            :state="modelConfigs[item.modelId]"
            @submit="() => saveModel(item.modelId)"
          >
            <div class="space-y-4">
              <UFormField
                label="Display Name"
                name="name"
                required
                help="How this model will appear in LMiX"
              >
                <UInput
                  v-model="modelConfigs[item.modelId].name"
                  size="lg"
                />
              </UFormField>

              <UFormField
                label="Set as Default"
                name="isDefault"
              >
                <USwitch
                  v-model="modelConfigs[item.modelId].isDefault"
                  label="Use this model by default"
                />
              </UFormField>

              <!-- Advanced Configuration -->
              <UAccordion
                :items="[{
                  label: 'Advanced Configuration',
                  content: '',
                  defaultOpen: false
                }]"
              >
                <template #item="{ item }">
                  <div class="space-y-4 pt-4">
                    <UFormField
                      label="Temperature"
                      name="config.temperature"
                      help="Controls randomness (0-2)"
                    >
                      <UInput
                        v-model.number="modelConfigs[item.modelId].config.temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        placeholder="0.7"
                      />
                    </UFormField>

                    <UFormField
                      label="Max Tokens"
                      name="config.maxTokens"
                      help="Maximum tokens in response"
                    >
                      <UInput
                        v-model.number="modelConfigs[item.modelId].config.maxTokens"
                        type="number"
                        min="1"
                        placeholder="2048"
                      />
                    </UFormField>
                  </div>
                </template>
              </UAccordion>
            </div>
          </UForm>
        </template>
      </UTabs>

      <div class="flex justify-end gap-3 mt-6">
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          @click="$emit('cancel')"
        >
          {{ t('cancel') }}
        </UButton>
        <UButton
          size="lg"
          @click="saveAllModels"
          :loading="saving"
        >
          {{ t('saveModels', { count: selectedModels.size }) }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'

const { t } = useI18n({ useScope: 'local' })
const modelsStore = useModelsStore()
const toast = useToast()
const router = useRouter()
const localeRoute = useLocalePath()

const emit = defineEmits<{
  cancel: []
  success: []
}>()

// Wizard state
const step = ref(1)
const fetchingModels = ref(false)
const saving = ref(false)
const availableModels = ref<Array<{ id: string; name: string }>>([])
const selectedModels = ref(new Set<string>())
const modelConfigs = ref<Record<string, any>>({})

// Step 1: Provider configuration
const providerSchema = z.object({
  apiEndpoint: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional().nullable(),
})

const providerState = reactive({
  apiEndpoint: '',
  apiKey: ''
})

// Step 3: Model configuration schema
const modelConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isDefault: z.boolean().optional(),
  config: z.object({
    temperature: z.number().min(0).max(2).optional().nullable(),
    maxTokens: z.number().positive().optional().nullable(),
  }).optional()
})

// Computed tabs for model configuration
const modelConfigTabs = computed(() => {
  return Array.from(selectedModels.value).map(modelId => {
    const model = availableModels.value.find(m => m.id === modelId)
    return {
      label: model?.name || modelId,
      modelId
    }
  })
})

// Actions
async function fetchModels() {
  fetchingModels.value = true
  
  try {
    const models = await modelsStore.fetchAvailableModels(
      providerState.apiEndpoint,
      providerState.apiKey || undefined
    )
    
    availableModels.value = models
    
    if (models.length === 0) {
      toast.add({
        title: t('noModels'),
        description: t('noModelsDescription'),
        color: 'warning'
      })
    } else {
      step.value = 2
      toast.add({
        title: t('modelsFound'),
        description: t('modelsFoundDescription', { count: models.length }),
        color: 'success'
      })
    }
  } catch (error) {
    toast.add({
      title: t('fetchError'),
      description: error instanceof Error ? error.message : t('fetchErrorDescription'),
      color: 'error'
    })
  } finally {
    fetchingModels.value = false
  }
}

function toggleModelSelection(model: { id: string; name: string }) {
  if (selectedModels.value.has(model.id)) {
    selectedModels.value.delete(model.id)
    delete modelConfigs.value[model.id]
  } else {
    selectedModels.value.add(model.id)
    // Initialize configuration for this model
    modelConfigs.value[model.id] = {
      name: model.name,
      isDefault: selectedModels.value.size === 1, // First selected is default
      config: {
        temperature: null,
        maxTokens: null
      }
    }
  }
}

async function saveModel(modelId: string) {
  const config = modelConfigs.value[modelId]
  
  // Clean up config - remove null values
  const cleanConfig: any = {}
  if (config.config.temperature !== null) cleanConfig.temperature = config.config.temperature
  if (config.config.maxTokens !== null) cleanConfig.maxTokens = config.config.maxTokens
  
  const modelData = {
    name: config.name,
    apiEndpoint: providerState.apiEndpoint,
    apiKey: providerState.apiKey || undefined,
    modelId: modelId,
    config: Object.keys(cleanConfig).length > 0 ? cleanConfig : undefined,
    isDefault: config.isDefault
  }
  
  await modelsStore.createModel(modelData)
}

async function saveAllModels() {
  saving.value = true
  
  try {
    const modelIds = Array.from(selectedModels.value)
    
    for (const modelId of modelIds) {
      await saveModel(modelId)
    }
    
    toast.add({
      title: t('success'),
      description: t('modelsCreated', { count: modelIds.length }),
      color: 'success'
    })
    
    // Navigate to models page
    await router.push(localeRoute('/models'))
    emit('success')
  } catch (error) {
    toast.add({
      title: t('saveError'),
      description: error instanceof Error ? error.message : t('saveErrorDescription'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<i18n lang="yaml">
en:
  configureProvider: Configure Provider
  selectModels: Select Models
  configureModels: Configure Models
  cancel: Cancel
  fetchModels: Fetch Available Models
  back: Back
  next: Next
  noModelsFound: No models found
  selectedCount: "{count} model(s) selected"
  saveModels: "Save {count} Model(s)"
  noModels: No Models Found
  noModelsDescription: Could not find any models from this provider
  modelsFound: Models Found
  modelsFoundDescription: "Found {count} available models"
  fetchError: Fetch Error
  fetchErrorDescription: Failed to fetch models from provider
  success: Success
  modelsCreated: "Successfully added {count} model(s)"
  saveError: Save Error
  saveErrorDescription: Failed to save models
</i18n>