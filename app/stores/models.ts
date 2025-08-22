import { defineStore } from 'pinia'
import type { InferSelectModel } from 'drizzle-orm'
import type { models } from '~/server/database/schema/models'

export type Model = InferSelectModel<typeof models>

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

export const useModelsStore = defineStore('models', () => {
  // State
  const modelsList = ref<Model[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const defaultModel = computed(() => 
    modelsList.value.find(model => model.isDefault)
  )

  const getModelById = computed(() => 
    (id: string) => modelsList.value.find(model => model.id === id)
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

  const navigationItems = computed(() => {
    const localeRoute = useLocalePath()
    
    return sortedModels.value.map(model => ({
      label: model.name,
      to: localeRoute(`/models/${model.id}`),
      icon: model.isDefault ? 'i-ph-star-fill' : undefined,
      badge: model.isDefault ? { label: 'Default', color: 'primary' as const } : undefined
    }))
  })

  // Actions
  async function fetchModels() {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/models')
      modelsList.value = response.models
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch models'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createModel(input: CreateModelInput) {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/models', {
        method: 'POST',
        body: input
      })
      
      modelsList.value.push(response.model)
      return response.model
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create model'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createModels(input: CreateModelInput | CreateModelInput[]) {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/models', {
        method: 'POST',
        body: input
      })
      
      // Handle both single and multiple model responses
      if (Array.isArray(input)) {
        // Multiple models created
        modelsList.value.push(...response.models)
        return response
      } else {
        // Single model created
        modelsList.value.push(response.model)
        return response
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create model(s)'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateModel(id: string, input: UpdateModelInput) {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/models/${id}`, {
        method: 'PUT',
        body: input
      })
      
      const index = modelsList.value.findIndex(m => m.id === id)
      if (index !== -1) {
        modelsList.value[index] = response.model
      }
      
      return response.model
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update model'
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
        method: 'DELETE'
      })
      
      modelsList.value = modelsList.value.filter(m => m.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete model'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function setDefaultModel(id: string) {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/models/${id}/default`, {
        method: 'PATCH'
      })
      
      // Update all models' default status
      modelsList.value.forEach(model => {
        model.isDefault = model.id === id
      })
      
      return response.model
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to set default model'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function testModelConnection(input: CreateModelInput | UpdateModelInput) {
    try {
      const response = await $fetch('/api/models/test', {
        method: 'POST',
        body: input
      })
      
      return response
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Connection test failed')
    }
  }

  // Initialize store
  onMounted(() => {
    fetchModels()
  })

  return {
    // State
    modelsList: readonly(modelsList),
    loading: readonly(loading),
    error: readonly(error),
    
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
    testModelConnection
  }
})