/**
 * Store for managing assistants in the application.
 * Handles CRUD operations and state management for assistants.
 */
import { defineStore } from 'pinia'
import type { VerticalNavigationLink } from '#ui/types'
import type { Database } from '~/types/api'
import type { Assistant, AssistantInsert, AssistantWithRelations, Persona } from '~/types/app'
import { LMiXError } from '~/types/errors'

export const useAssistantStore = defineStore('assistant', () => {
  // State
  const assistants = ref<Assistant[]>([])
  const fullyLoaded = ref(false)
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find an assistant by UUID
   * @returns {(uuid: string) => Assistant | undefined} Function that takes a UUID and returns the matching assistant or undefined
   */
  const getAssistant = computed(() => {
    return (uuid: string) => assistants.value.find(a => a.uuid === uuid)
  })

  /**
   * Returns navigation links for assistants, sorted alphabetically
   * @param filterUuids Optional array of assistant UUIDs to filter by
   * @param icon Optional icon to use for navigation links
   * @returns Array of navigation links for either all assistants or specified assistants
   */
  const getAssistantNavigation = computed(() => {
    return (filterUuids?: string[], icon?: string): VerticalNavigationLink[] => {
      if (filterUuids?.length === 0) return []

      const assistantList = filterUuids
        ? assistants.value.filter(a => filterUuids.includes(a.uuid))
        : assistants.value

      return assistantList
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((assistant): VerticalNavigationLink => ({
          label: assistant.name,
          to: `/assistants/${assistant.uuid}`,
          ...(icon && { icon }),
        }))
    }
  })

  /**
   * Returns select options for assistants, sorted alphabetically
   * @param filterUuids Optional array of assistant UUIDs to filter by
   * @returns Array of select options for either all assistants or specified assistants
   */
  const getAssistantOptions = computed(() => {
    return (filterUuids?: string[]) => {
      if (filterUuids?.length === 0) return []

      const assistantList = filterUuids
        ? assistants.value.filter(a => filterUuids.includes(a.uuid))
        : assistants.value

      return assistantList
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(assistant => ({
          label: assistant.name,
          value: assistant.uuid,
        }))
    }
  })

  /**
   * Returns the total number of assistants
   */
  const getAssistantCount = computed(() => assistants.value.length)

  // Actions
  /**
   * Fetches all assistants from the database if not already loaded
   * @throws {LMiXError} If the API request fails
   */
  async function selectAssistants(): Promise<void> {
    if (fullyLoaded.value) return

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
      fullyLoaded.value = true
    }
  }

  /**
   * Creates or updates an assistant
   * @param {AssistantInsert} assistant - The assistant data to create or update
   * @returns {Promise<string | null>} The UUID of the created/updated assistant, or null if unsuccessful
   * @throws {LMiXError} If the API request fails
   */
  async function upsertAssistant(assistant: AssistantInsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!assistant.uuid
    const original = [...assistants.value]
    let tempId: string | null = null

    if (isUpdate) {
      const index = assistants.value.findIndex(a => a.uuid === assistant.uuid)
      if (index !== -1) {
        assistants.value[index] = { ...assistants.value[index], ...assistant }
      }
    }
    else {
      tempId = crypto.randomUUID()
      assistants.value.unshift({
        ...assistant,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as Assistant)
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
        } else if (tempId) {
          const tempIndex = assistants.value.findIndex(a => a.uuid === tempId)
          if (tempIndex !== -1) {
            assistants.value[tempIndex] = data[0]
          }
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

  /**
   * Deletes an assistant by UUID
   * @param {string} uuid - The UUID of the assistant to delete
   * @throws {LMiXError} If the API request fails
   */
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

  async function addAssistants(newAssistants: (Assistant | AssistantWithRelations)[]): Promise<void> {
    const personaStore = usePersonaStore()

    // Extract and add personas if present
    const personas = newAssistants
      .map(a => (a as AssistantWithRelations).persona)
      .filter((p): p is Persona => p !== null && p !== undefined)

    if (personas.length > 0) {
      await personaStore.addPersonas(personas)
    }

    // Add assistants (strip out nested persona data to avoid duplicates)
    const assistantsToAdd = newAssistants.filter(newAssistant =>
      !assistants.value.some(a => a.uuid === newAssistant.uuid)
    ).map(assistant => {
      // Remove nested persona data before adding to store
      const { persona: _, ...assistantData } = assistant as AssistantWithRelations
      return assistantData
    })

    if (assistantsToAdd.length > 0) {
      assistants.value.unshift(...assistantsToAdd)
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
    getAssistantOptions,
    getAssistantCount,
    // Actions
    selectAssistants,
    upsertAssistant,
    deleteAssistant,
    addAssistants,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssistantStore, import.meta.hot))
}
