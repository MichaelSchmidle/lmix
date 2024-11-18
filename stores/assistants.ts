import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Assistant } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

type AssistantRow = Database['public']['Tables']['assistants']['Row']
type AssistantUpsert = Database['public']['Tables']['assistants']['Insert']

export const useAssistantStore = defineStore('assistant', () => {
  // State
  const assistants = ref<AssistantRow[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  const getAssistant = computed(() => {
    return (uuid: string) => assistants.value.find(a => a.uuid === uuid)
  })

  const getAssistantNavigation = computed(() => {
    return assistants.value
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((assistant): VerticalNavigationLink => ({
        label: assistant.name,
        to: `/assistants/${assistant.uuid}`,
      }))
  })

  // Actions
  async function selectAssistants(): Promise<void> {
    if (assistants.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('assistants')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      assistants.value = data
    }
    catch (e) {
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Assistant selection failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function upsertAssistant(assistant: AssistantUpsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!assistant.uuid
    const original = [...assistants.value]

    if (isUpdate) {
      const index = assistants.value.findIndex(a => a.uuid === assistant.uuid)

      if (index !== -1) {
        assistants.value[index] = { ...assistants.value[index], ...assistant }
      }
    }
    else {
      const tempId = crypto.randomUUID()

      assistants.value.unshift({
        ...assistant,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as AssistantRow)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('assistants')
        .upsert(assistant)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data?.[0]) {
        if (isUpdate) {
          const index = assistants.value.findIndex(a => a.uuid === data[0].uuid)

          if (index !== -1) {
            assistants.value[index] = data[0]
          }
        }
        else {
          assistants.value[0] = data[0]
        }

        return data[0].uuid
      }

      return null
    }
    catch (e) {
      assistants.value = original
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Assistant upsert failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function deleteAssistant(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...assistants.value]
    assistants.value = assistants.value.filter(a => a.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('assistants')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      assistants.value = original
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Assistant deletion failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    assistants,
    loading,
    error,
    // Getters
    getAssistant,
    getAssistantNavigation,
    // Actions
    selectAssistants,
    upsertAssistant,
    deleteAssistant,
  }
}) 