import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Model, CreateModelInput, UpdateModelInput } from '~/types/models'

export const useModelStore = defineStore('models', () => {
  // State
  const models = ref<Model[]>([])
  const loading = ref(true) // Initial loading state only (shows skeletons)
  const busy = ref(false) // Any operation in progress (disables buttons)
  const error = ref<string | null>(null)
  const initialized = ref(false) // Track if we've fetched at least once

  // Getters
  const defaultModel = computed(() =>
    models.value.find((model) => model.isDefault)
  )

  const getModelById = computed(
    () => (id: string) => models.value.find((model) => model.id === id)
  )

  const sortedModels = computed(() =>
    [...models.value].sort((a, b) => {
      // Default model first
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      // Then alphabetically by name
      return a.name.localeCompare(b.name)
    })
  )

  const navigationItems = computed(
    () =>
      (currentModelId?: string): NavigationMenuItem[] => {
        const localeRoute = useLocalePath()

        // Group models by endpoint
        const modelsByEndpoint = sortedModels.value.reduce((acc, model) => {
          if (!acc[model.apiEndpoint]) {
            acc[model.apiEndpoint] = []
          }
          acc[model.apiEndpoint]!.push(model)
          return acc
        }, {} as Record<string, Model[]>)

        // Create navigation items grouped by endpoint
        return Object.entries(modelsByEndpoint).map(([endpoint, models]) => ({
          icon: 'i-ph-hard-drive-fill',
          label: new URL(endpoint).hostname, // Show just the hostname for cleaner display
          defaultOpen: models.some(
            (model: Model) => model.id === currentModelId
          ),
          children: models.map((model: Model) => ({
            label: model.name,
            to: localeRoute({ name: 'models-id', params: { id: model.id } }),
            icon: model.isDefault ? 'i-ph-asterisk' : undefined,
          })),
        }))
      }
  )

  // Actions
  async function fetchModels() {
    // Only set loading if already initialized (subsequent fetches)
    if (initialized.value) {
      loading.value = true
    }
    error.value = null

    try {
      const response = await $fetch('/api/models')
      models.value = response.models
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
    busy.value = true
    error.value = null

    try {
      const response = await $fetch<{ model: Model }>('/api/models', {
        method: 'POST',
        body: input,
      })

      models.value.push(response.model)
      return response.model
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create model'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function createModels(input: CreateModelInput | CreateModelInput[]) {
    busy.value = true
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
        models.value.push(...multiResponse.models)
        return multiResponse
      } else {
        // Single model created
        const singleResponse = response as { model: Model }
        models.value.push(singleResponse.model)
        return singleResponse
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create model(s)'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function updateModel(id: string, input: UpdateModelInput) {
    busy.value = true
    error.value = null

    try {
      const response = await $fetch<{ model: Model }>(`/api/models/${id}`, {
        method: 'PUT',
        body: input,
      })

      const index = models.value.findIndex((m) => m.id === id)
      if (index !== -1) {
        models.value[index] = response.model
      }

      return response.model
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update model'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function deleteModel(id: string) {
    busy.value = true
    error.value = null

    try {
      await $fetch(`/api/models/${id}`, {
        method: 'DELETE',
      })

      models.value = models.value.filter((m) => m.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete model'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function setDefaultModel(id: string) {
    busy.value = true
    error.value = null

    try {
      const response = await $fetch<{ model: Model }>(`/api/models/${id}`, {
        method: 'PUT',
        body: { isDefault: true },
      })

      // Update all models' default status
      models.value.forEach((model) => {
        model.isDefault = model.id === id
      })

      return response.model
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to set default model'
      throw err
    } finally {
      busy.value = false
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
    models,
    loading,
    busy,
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useModelStore, import.meta.hot))
}
