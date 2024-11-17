<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { ApiConfiguration, ApiModelList, ApiModelOption } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const modelStore = useModelStore()

// Form state
const apiConfiguration = ref<ApiConfiguration | null>(null)
const apiModelOptions = ref<ApiModelOption[]>([])

const handleDiscoverModels = async (form: ApiConfiguration, node: FormKitNode) => {
  try {
    const response = await $fetch<ApiModelList>(
      `${form.api_endpoint}/models`,
      {
        headers: form.api_key
          ? { Authorization: `Bearer ${form.api_key}` }
          : undefined
      }
    )

    if (!response.data?.length) {
      node.setErrors([t('noModelsFound')])
      return
    }

    apiConfiguration.value = {
      api_endpoint: form.api_endpoint,
      api_key: form.api_key
    }

    apiModelOptions.value = modelStore.transformToFormOptions(apiConfiguration.value, response.data, t('alreadyConfigured'))
    node.clearErrors()
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('connectionFailed')])
  }
}

const handleAddModels = async (form: { models: string[] }, node: FormKitNode) => {
  if (!apiConfiguration.value) return

  try {
    const modelsToInsert = form.models.map(modelId => ({
      id: modelId,
      api_endpoint: apiConfiguration.value!.api_endpoint,
      api_key: apiConfiguration.value!.api_key,
      user_uuid: useSupabaseUser().value!.id
    }))

    await modelStore.insertModels(modelsToInsert)

    // Reset form state
    apiConfiguration.value = null
    apiModelOptions.value = []
    node.clearErrors()

    // Show success message
    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t('modelAdded', { count: form.models.length }),
    })
  }
  catch (error) {
    console.error(error)
    node.setErrors([t('addModelsFailed')])
  }
}
</script>

<template>
  <UiSection icon="i-ph-circuitry-thin" :title="t('title')" :description="t('description')">
    <UCard>
      <div class="space-y-8" v-auto-animate>
        <UDivider>
          <div class="flex gap-[1ex] items-center">
            <UIcon name="i-ph-number-circle-one-fill" class="w-5 h-5" />
            {{ t('configureApi') }}
          </div>
        </UDivider>
        <FormKit :incomplete-message="false" type="form" @submit="handleDiscoverModels">
          <FormKit type="text" name="api_endpoint" :label="t('apiEndpoint.label')" :help="t('apiEndpoint.help')" validation="required" :validation-messages="{ required: t('apiEndpoint.required') }" :disabled="apiModelOptions.length > 0" />
          <FormKit type="text" name="api_key" :label="t('apiKey.label')" :help="t('apiKey.help')" :disabled="apiModelOptions.length > 0" />
          <template #actions="{ disabled }">
            <UiFormActions>
              <UButton color="cyan" icon="i-ph-list-magnifying-glass" :label="t('discoverModels')" :loading="disabled as boolean" :disabled="apiModelOptions.length > 0" type="submit" />
            </UiFormActions>
          </template>
        </FormKit>
        <template v-if="apiModelOptions.length">
          <UDivider>
            <div class="flex gap-[1ex] items-center">
              <UIcon name="i-ph-number-circle-two-fill" class="w-5 h-5" />
              {{ t('selectModels') }}
            </div>
          </UDivider>
          <FormKit :incomplete-message="false" type="form" @submit="handleAddModels">
            <FormKit v-if="apiModelOptions.length" type="checkbox" name="models" :label="t('availableModels.label')" :options="apiModelOptions" :value="[]" validation="required" :validation-messages="{ required: t('availableModels.required') }" />
            <template #actions="{ disabled }">
              <UiFormActions>
                <UButton type="button" color="gray" icon="i-ph-skip-back" variant="ghost" @click="apiModelOptions = []">
                  {{ t('configureApi') }}
                </UButton>
                <UButton type="submit" color="cyan" icon="i-ph-plus" :loading="disabled as boolean">
                  Add Models
                </UButton>
              </UiFormActions>
            </template>
          </FormKit>
        </template>
      </div>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
  en:
    title: Add Models
    description: Language models provide the intelligence to power your productions. At least one model is required to get started.
    configureApi: Configure API
    apiEndpoint:
      label: API Endpoint
      help: OpenAI-compatible API endpoint (e.g., https://api.openai.com/v1)
      required: API endpoint is required.
    apiKey:
      label: API Key
      help: Optional API key for authentication
    discoverModels: Discover Models
    connectionFailed: Connection to the API failed.
    noModelsFound: No models found.
    selectModels: Select Models
    availableModels:
      label: Available Models
      required: At least one model is required.
    alreadyConfigured: This model is already configured.
    modelAdded: One model added | {count} models added
    addModelsFailed: Failed to add models.
</i18n>
