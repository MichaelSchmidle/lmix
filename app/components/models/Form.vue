<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit" @error="onError">
    <div class="space-y-6">
      <!-- Basic Information -->
      <div class="space-y-4">
        <UFormField label="Model Name" name="name" required>
          <UInput v-model="state.name" placeholder="e.g., GPT-4 Turbo" size="lg" />
        </UFormField>

        <UFormField label="API Endpoint" name="apiEndpoint" required help="Full URL to the model's API endpoint">
          <UInput v-model="state.apiEndpoint" placeholder="https://api.openai.com/v1/chat/completions" size="lg" />
        </UFormField>

        <UFormField label="Model ID" name="modelId" required help="Model identifier used by the API">
          <UInput v-model="state.modelId" placeholder="e.g., gpt-4-turbo-preview" size="lg" />
        </UFormField>

        <UFormField label="API Key" name="apiKey" help="Leave empty for local models like Ollama">
          <UInput v-model="state.apiKey" type="password" placeholder="sk-..." size="lg" />
        </UFormField>

        <UFormField label="Set as Default" name="isDefault">
          <USwitch v-model="state.isDefault" label="Use this model by default" />
        </UFormField>
      </div>

      <!-- Advanced Configuration -->
      <UAccordion :items="[{
        label: 'Advanced Configuration',
        content: '',
        defaultOpen: false
      }]">
        <template #item="{ item }">
          <div class="space-y-4 pt-4">
            <UFormField label="Temperature" name="config.temperature" help="Controls randomness (0-2)">
              <UInput v-model.number="state.config.temperature" type="number" min="0" max="2" step="0.1" placeholder="0.7" />
            </UFormField>

            <UFormField label="Max Tokens" name="config.maxTokens" help="Maximum tokens in response">
              <UInput v-model.number="state.config.maxTokens" type="number" min="1" placeholder="2048" />
            </UFormField>

            <UFormField label="Top P" name="config.topP" help="Nucleus sampling (0-1)">
              <UInput v-model.number="state.config.topP" type="number" min="0" max="1" step="0.01" placeholder="1.0" />
            </UFormField>

            <UFormField label="Frequency Penalty" name="config.frequencyPenalty" help="Reduce repetition (-2 to 2)">
              <UInput v-model.number="state.config.frequencyPenalty" type="number" min="-2" max="2" step="0.1" placeholder="0" />
            </UFormField>

            <UFormField label="Presence Penalty" name="config.presencePenalty" help="Encourage new topics (-2 to 2)">
              <UInput v-model.number="state.config.presencePenalty" type="number" min="-2" max="2" step="0.1" placeholder="0" />
            </UFormField>
          </div>
        </template>
      </UAccordion>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4">
        <UButton v-if="!isEdit" color="neutral" variant="outline" size="lg" @click="testConnection" :loading="testing" :disabled="!canTest">
          Test Connection
        </UButton>
        <div v-else />

        <div class="flex gap-3">
          <UButton color="neutral" variant="ghost" size="lg" @click="onCancel">
            Cancel
          </UButton>
          <UButton type="submit" size="lg" :loading="loading">
            {{ isEdit ? 'Update' : 'Create' }} Model
          </UButton>
        </div>
      </div>

      <!-- Test Result Alert -->
      <UAlert v-if="testResult" :color="testResult.success ? 'success' : 'error'" :title="testResult.success ? 'Connection Successful' : 'Connection Failed'" :description="testResult.message" class="mt-4" />
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { Model } from '~/stores/models'

const props = defineProps<{
  model?: Model
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const modelsStore = useModelsStore()
const localeRoute = useLocalePath()

const isEdit = computed(() => !!props.model)

// Form validation schema
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  apiEndpoint: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional().nullable(),
  modelId: z.string().min(1, 'Model ID is required'),
  isDefault: z.boolean().optional(),
  config: z.object({
    temperature: z.number().min(0).max(2).optional().nullable(),
    maxTokens: z.number().positive().optional().nullable(),
    topP: z.number().min(0).max(1).optional().nullable(),
    frequencyPenalty: z.number().min(-2).max(2).optional().nullable(),
    presencePenalty: z.number().min(-2).max(2).optional().nullable(),
  }).optional()
})

// Form state
const state = reactive({
  name: props.model?.name || '',
  apiEndpoint: props.model?.apiEndpoint || '',
  apiKey: props.model?.apiKey || '',
  modelId: props.model?.modelId || '',
  isDefault: props.model?.isDefault || false,
  config: {
    temperature: props.model?.config?.temperature || null,
    maxTokens: props.model?.config?.maxTokens || null,
    topP: props.model?.config?.topP || null,
    frequencyPenalty: props.model?.config?.frequencyPenalty || null,
    presencePenalty: props.model?.config?.presencePenalty || null,
  }
})

// Test connection state
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

const canTest = computed(() =>
  state.apiEndpoint && state.modelId
)

async function testConnection() {
  testing.value = true
  testResult.value = null

  try {
    const result = await modelsStore.testModelConnection({
      apiEndpoint: state.apiEndpoint,
      apiKey: state.apiKey || undefined,
      modelId: state.modelId,
      config: {
        temperature: state.config.temperature || undefined,
        maxTokens: state.config.maxTokens || undefined
      }
    })

    testResult.value = {
      success: true,
      message: result.message || 'Connection successful'
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  } finally {
    testing.value = false
  }
}

function onSubmit(event: any) {
  // Clean up config - remove null values
  const config: any = {}
  if (state.config.temperature !== null) config.temperature = state.config.temperature
  if (state.config.maxTokens !== null) config.maxTokens = state.config.maxTokens
  if (state.config.topP !== null) config.topP = state.config.topP
  if (state.config.frequencyPenalty !== null) config.frequencyPenalty = state.config.frequencyPenalty
  if (state.config.presencePenalty !== null) config.presencePenalty = state.config.presencePenalty

  const data = {
    ...event.data,
    config: Object.keys(config).length > 0 ? config : undefined
  }

  emit('submit', data)
}

function onError(error: any) {
  console.error('Form validation error:', error)
}

function onCancel() {
  emit('cancel')
}
</script>