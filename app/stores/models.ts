import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Model, CreateModelInput, UpdateModelInput } from '~/types/models'
import type { ApiResponse } from '~/server/utils/responses'

export const useModelStore = defineStore('models', () => {
  // Use useFetch but handle client/server differently
  const { data: fetchedData, pending, refresh } = useFetch<ApiResponse<Model[]>>('/api/models', {
    key: 'models',
    server: false, // Only run on client
    lazy: false, // Fetch immediately when store is accessed on client
    default: () => ({ success: true, data: [], message: '', count: 0 })
  })
  
  // State
  const busy = ref(false)
  const error = ref<string | null>(null)
  
  // Computed models from fetch
  const models = computed(() => fetchedData.value?.data || [])
  
  // Loading state: true on server, follows pending on client
  const loading = computed(() => {
    if (process.server) return true // Always show skeleton on SSR
    return pending.value // On client, show loading while fetching
  })

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
    // Just refresh the existing useFetch
    return refresh()
  }

  async function createModel(input: CreateModelInput) {
    busy.value = true

    try {
      const response = await $fetch('/api/models', {
        method: 'POST',
        body: input,
      })

      if (response.data) {
        models.value.push(response.data as Model)
        return response.data as Model
      }
      throw new Error('No model returned')
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create model'
      )
    } finally {
      busy.value = false
    }
  }

  async function createModels(input: CreateModelInput | CreateModelInput[]) {
    busy.value = true

    try {
      const response = await $fetch('/api/models', {
        method: 'POST',
        body: input,
      })

      // Handle both single and multiple model responses
      if (Array.isArray(input)) {
        // Multiple models created
        if (Array.isArray(response.data)) {
          models.value.push(...response.data)
          return { models: response.data, count: response.count || response.data.length }
        }
      } else {
        // Single model created
        if (response.data && !Array.isArray(response.data)) {
          models.value.push(response.data as Model)
          return { model: response.data as Model }
        }
      }
      throw new Error('Invalid response format')
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create model(s)'
      )
    } finally {
      busy.value = false
    }
  }

  async function updateModel(id: string, input: UpdateModelInput) {
    busy.value = true

    try {
      const response = await $fetch(`/api/models/${id}`, {
        method: 'PUT',
        body: input,
      })

      if (response.data) {
        // Update local state
        const index = models.value.findIndex((m) => m.id === id)
        if (index !== -1) {
          models.value[index] = response.data as Model
        }
        return response.data as Model
      }
      throw new Error('No model returned')
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update model'
      )
    } finally {
      busy.value = false
    }
  }

  async function deleteModel(id: string) {
    busy.value = true

    try {
      await $fetch(`/api/models/${id}`, {
        method: 'DELETE',
      })

      // Remove from local state
      models.value = models.value.filter((m) => m.id !== id)
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete model'
      )
    } finally {
      busy.value = false
    }
  }

  async function setDefaultModel(id: string) {
    busy.value = true

    try {
      const response = await $fetch(`/api/models/${id}`, {
        method: 'PUT',
        body: { isDefault: true },
      })

      // Update all models' default status in local state
      models.value.forEach((model) => {
        model.isDefault = model.id === id
      })

      return response.data as Model
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to set default model'
      )
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
