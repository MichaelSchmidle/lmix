/**
 * Store for managing API model configurations in the application.
 * Handles CRUD operations and state management for API models.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { ApiConfiguration, ApiModel, ApiModelOption, Model, ModelInsert } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { AccordionItem, VerticalNavigationLink } from '#ui/types'

export const useModelStore = defineStore('model', () => {
  // State
  const models = ref<Model[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a model by UUID
   * @returns {(uuid: string) => Model | undefined} Function that takes a UUID and returns the matching model or undefined
   */
  const getModel = computed(() => {
    return (uuid: string) => models.value.find(m => m.uuid === uuid)
  })

  /**
   * Returns navigation links for all models, grouped by API endpoint and sorted alphabetically
   * @returns {AccordionItem[]} Array of accordion items containing navigation links
   */
  const getModelNavigation = computed(() => {
    // Group models by API endpoint
    const groupedModels = models.value.reduce((acc, model) => {
      if (!acc[model.api_endpoint]) {
        acc[model.api_endpoint] = []
      }

      acc[model.api_endpoint].push(model)
      return acc
    }, {} as Record<string, Model[]>)

    // Sort endpoints alphabetically by hostname
    return Object.entries(groupedModels)
      .sort(([a], [b]) => new URL(a).hostname.localeCompare(new URL(b).hostname))
      .map(([endpoint, endpointModels]): AccordionItem => {
        // Sort models alphabetically by ID
        const links: VerticalNavigationLink[] = endpointModels
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(model => ({
            label: model.id,
            to: `/models/${model.uuid}`,
          }))

        return {
          icon: 'i-ph-hard-drive',
          content: links,
          label: new URL(endpoint).hostname,
        }
      })
  })

  /**
   * Returns select options for all models, grouped by API endpoint and sorted alphabetically
   * @returns {Array<{label: string, value: string} | {group: string, options: Array<{label: string, value: string}>}>} Array of select options
   */
  const getModelOptions = computed(() => {
    // Group models by API endpoint
    const groupedModels = models.value.reduce((acc, model) => {
      if (!acc[model.api_endpoint]) {
        acc[model.api_endpoint] = []
      }
      acc[model.api_endpoint].push(model)
      return acc
    }, {} as Record<string, Model[]>)

    // Create options array with groups
    return [
      { label: 'Select a model…', value: '' },
      ...Object.entries(groupedModels)
        .sort(([a], [b]) => new URL(a).hostname.localeCompare(new URL(b).hostname))
        .map(([endpoint, endpointModels]) => ({
          group: new URL(endpoint).hostname,
          options: endpointModels
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(model => ({
              label: model.id,
              value: model.uuid,
            })),
        })),
    ]
  })

  /**
   * Returns the total number of models
   * @returns {number} Total count of models
   */
  const getModelCount = computed(() => models.value.length)

  // Actions
  /**
   * Fetches all models from the database if not already loaded
   * @throws {LMiXError} If API request fails
   */
  async function selectModels(): Promise<void> {
    if (models.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('models')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      models.value = data
    }
    catch (e) {
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Model selection failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates new models with optimistic updates
   * @param {ModelInsert[]} modelsToInsert - Array of models to create
   * @throws {LMiXError} If API request fails
   */
  async function insertModels(modelsToInsert: ModelInsert[]): Promise<void> {
    loading.value = true
    error.value = null

    const tempIds = modelsToInsert.map(() => crypto.randomUUID() as Model['uuid'])

    const optimisticModels: Model[] = modelsToInsert.map((model, index) => ({
      ...model,
      uuid: tempIds[index],
      created_at: new Date().toISOString(),
      api_key: model.api_key ?? null
    }))

    models.value.unshift(...optimisticModels)

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('models')
        .insert(modelsToInsert)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data) {
        tempIds.forEach((tempId, index) => {
          const modelIndex = models.value.findIndex(m => m.uuid === tempId)

          if (modelIndex !== -1 && data[index]) {
            models.value[modelIndex] = data[index]
          }
        })
      }
    }
    catch (e) {
      models.value = models.value.filter(m => !tempIds.includes(m.uuid))
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Model insertion failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a model with optimistic updates
   * @param {string} uuid - Model identifier
   * @throws {LMiXError} If API request fails
   */
  async function deleteModel(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...models.value]
    models.value = models.value.filter(m => m.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()
      const { error: apiError } = await client
        .from('models')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      models.value = original
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Model deletion failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Transforms API models into form options with disabled state for existing models
   * @param {ApiConfiguration} apiConfiguration - API configuration object
   * @param {ApiModel[]} apiModels - Array of API models to transform
   * @param {string} help - Help text to display for disabled options
   * @returns {ApiModelOption[]} Array of form options with disabled state and help text
   */
  function transformToFormOptions(apiConfiguration: ApiConfiguration, apiModels: ApiModel[], help: string): ApiModelOption[] {
    return apiModels.map(apiModel => {
      // Check if model already exists in store
      const existingModel = models.value.find(m =>
        m.api_endpoint === apiConfiguration.api_endpoint && m.id === apiModel.id
      )

      return {
        label: apiModel.id,
        value: apiModel.id,
        help: existingModel && help,
        attrs: existingModel ? { disabled: true } : undefined
      }
    })
  }

  return {
    // State
    models,
    loading,
    error,
    // Getters
    getModel,
    getModelNavigation,
    getModelOptions,
    getModelCount,
    // Actions
    selectModels,
    insertModels,
    deleteModel,
    transformToFormOptions
  }
})