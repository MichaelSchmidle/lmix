import { defineStore } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'

export type Model = {
  id: string
  userId: string
  name: string
  apiEndpoint: string
  apiKey: string | null
  modelId: string
  config: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    stopSequences?: string[]
  } | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateModelInput = {
  name: string
  apiEndpoint: string
  apiKey?: string | null
  modelId: string
  config?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    stopSequences?: string[]
  }
  isDefault?: boolean
}

export type UpdateModelInput = Partial<CreateModelInput>

export const useModelStore = defineStore('models', () => {
  // State
  const modelsList = ref<Model[]>([])
  const loading = ref(true) // Start with loading true until first fetch
  const error = ref<string | null>(null)
  const initialized = ref(false) // Track if we've fetched at least once

  // Getters
  const defaultModel = computed(() =>
    modelsList.value.find((model) => model.isDefault)
  )

  const getModelById = computed(
    () => (id: string) => modelsList.value.find((model) => model.id === id)
  )

  const sortedModels = computed(() =>
    [...modelsList.value].sort((a, b) => {
      // Default model first
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      // Then alphabetically by name
      return a.name.localeCompare(b.name)
    })
  )

  const navigationItems = computed(() => (currentModelId?: string) => {
    const localeRoute = useLocalePath()

    // Group models by endpoint
    const modelsByEndpoint = sortedModels.value.reduce(
      (acc, model) => {
        if (!acc[model.apiEndpoint]) {
          acc[model.apiEndpoint] = []
        }
        acc[model.apiEndpoint]!.push(model)
        return acc
      },
      {} as Record<string, Model[]>
    )

    // Create navigation items grouped by endpoint
    return Object.entries(modelsByEndpoint).map(([endpoint, models]) => ({
      icon: 'i-ph-hard-drive-fill',
      label: new URL(endpoint).hostname, // Show just the hostname for cleaner display
      defaultOpen: models.some(model => model.id === currentModelId),
      children: models.map((model: Model) => ({
        label: model.name,
        to: localeRoute({ name: 'models-id', params: { id: model.id } }),
        icon: model.isDefault ? 'i-ph-star-fill' : undefined,
      })),
    }))
  })

  // Actions
  async function fetchModels() {
    // Only set loading if already initialized (subsequent fetches)
    if (initialized.value) {
      loading.value = true
    }
    error.value = null

    try {
      const response = await $fetch('/api/models')
      modelsList.value = response.models
      initialized.value = true
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch models'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createModel(input: CreateModelInput) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ model: Model }>('/api/models', {
        method: 'POST',
        body: input,
      })

      modelsList.value.push(response.model)
      return response.model
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create model'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createModels(input: CreateModelInput | CreateModelInput[]) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ models: Model[] } | { model: Model }>(
        '/api/models',
        {
          method: 'POST',
          body: input,
        }
      )

      // Handle both single and multiple model responses
      if (Array.isArray(input)) {
        // Multiple models created
        const multiResponse = response as { models: Model[] }
        modelsList.value.push(...multiResponse.models)
        return multiResponse
      } else {
        // Single model created
        const singleResponse = response as { model: Model }
        modelsList.value.push(singleResponse.model)
        return singleResponse
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create model(s)'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateModel(id: string, input: UpdateModelInput) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ model: Model }>(`/api/models/${id}`, {
        method: 'PUT',
        body: input,
      })

      const index = modelsList.value.findIndex((m) => m.id === id)
      if (index !== -1) {
        modelsList.value[index] = response.model
      }

      return response.model
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update model'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteModel(id: string) {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/models/${id}`, {
        method: 'DELETE',
      })

      modelsList.value = modelsList.value.filter((m) => m.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete model'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function setDefaultModel(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ model: Model }>(
        `/api/models/${id}/default`,
        {
          method: 'PATCH',
        }
      )

      // Update all models' default status
      modelsList.value.forEach((model) => {
        model.isDefault = model.id === id
      })

      return response.model
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to set default model'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function testModelConnection(
    input: CreateModelInput | UpdateModelInput
  ) {
    try {
      const response = await $fetch('/api/models/test', {
        method: 'POST',
        body: input,
      })

      return response
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Connection test failed'
      )
    }
  }

  return {
    // State
    modelsList,
    loading,
    error,

    // Getters
    defaultModel,
    getModelById,
    sortedModels,
    navigationItems,

    // Actions
    fetchModels,
    createModel,
    createModels,
    updateModel,
    deleteModel,
    setDefaultModel,
    testModelConnection,
  }
})
