import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import { ApiError } from '~/types/errors'

type Model = Database['public']['Tables']['models']['Row']
type ModelCreate = Database['public']['Tables']['models']['Insert']

export const useModelStore = defineStore('model', () => {
  // State
  const models = ref<Model[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Getters
  const getModel = computed(() => {
    return (uuid: string) => models.value.find(m => m.uuid === uuid)
  })

  // Actions
  async function selectModels() {
    // Skip if models are already loaded
    if (models.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()
      const { data, error: apiError } = await client
        .from('models')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new ApiError(apiError.message, apiError)

      models.value = data
    }
    catch (e) {
      error.value = e as Error
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function insertModel(model: ModelCreate) {
    loading.value = true
    error.value = null

    // Optimistic update with required fields
    const tempId = crypto.randomUUID()
    const optimisticModel: Model = {
      ...model,
      uuid: tempId,
      created_at: new Date().toISOString(),
      api_key: model.api_key ?? null // Ensure api_key is never undefined
    }
    models.value.unshift(optimisticModel)

    try {
      const client = useSupabaseClient<Database>()
      const { data, error: apiError } = await client
        .from('models')
        .insert(model)
        .select()
        .single()

      if (apiError) throw new ApiError(apiError.message, apiError)

      // Replace optimistic model with real one
      const index = models.value.findIndex(m => m.uuid === tempId)
      if (index !== -1 && data) {
        models.value[index] = data
      }
    }
    catch (e) {
      // Rollback optimistic update
      models.value = models.value.filter(m => m.uuid !== tempId)
      error.value = e as Error
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function updateModel(uuid: string, updates: Partial<ModelCreate>) {
    loading.value = true
    error.value = null

    // Store original for rollback
    const original = models.value.find(m => m.uuid === uuid)
    if (!original) throw new Error('Model not found')

    // Optimistic update
    const index = models.value.findIndex(m => m.uuid === uuid)
    if (index !== -1) {
      models.value[index] = { ...models.value[index], ...updates }
    }

    try {
      const client = useSupabaseClient<Database>()
      const { data, error: apiError } = await client
        .from('models')
        .update(updates)
        .eq('uuid', uuid)
        .select()
        .single()

      if (apiError) throw new ApiError(apiError.message, apiError)

      // Update with real data
      if (index !== -1 && data) {
        models.value[index] = data
      }
    }
    catch (e) {
      // Rollback optimistic update
      if (index !== -1) {
        models.value[index] = original
      }
      error.value = e as Error
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function deleteModel(uuid: string) {
    loading.value = true
    error.value = null

    // Store original for rollback
    const original = [...models.value]

    // Optimistic update
    models.value = models.value.filter(m => m.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()
      const { error: apiError } = await client
        .from('models')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new ApiError(apiError.message, apiError)
    }
    catch (e) {
      // Rollback optimistic update
      models.value = original
      error.value = e as Error
      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    models,
    loading,
    error,
    // Getters
    getModel,
    // Actions
    selectModels,
    insertModel,
    updateModel,
    deleteModel
  }
})