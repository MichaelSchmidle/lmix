/**
 * Store for managing assistants in the application.
 * Handles CRUD operations and state management for assistants.
 * 
 * @remarks
 * Assistants represent the AI assistants in the application.
 */
import { defineStore } from 'pinia'
import type { VerticalNavigationLink } from '#ui/types'
import type { Database } from '~/types/api'
import type { Assistant, AssistantInsert, AssistantWithRelations, Persona } from '~/types/app'
import { LMiXError } from '~/types/errors'



export const useAssistantStore = defineStore('assistant', () => {
  // State
  const assistants = ref<Assistant[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)
  const fullyLoaded = ref(false)

  // Getters 
  /**
   * Returns a function to find an assistant by UUID
   * @param {string} uuid - UUID of the assistant
   * @returns {Assistant | undefined} Assistant object or undefined
   */
  const getAssistant = computed(() => {
    return (uuid: string) => assistants.value.find(a => a.uuid === uuid)
  })

  /**
   * Returns navigation links for assistants, sorted alphabetically
   * @param filterUuids Optional array of assistant UUIDs to filter by
   * @param icon Optional icon to use for navigation links
   * @returns {VerticalNavigationLink[]} Array of navigation links for either all assistants or specified assistants
   * @throws {LMiXError} If API request fails
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
   * @returns {Array<{ label: string; value: string }>} Array of select options for either all assistants or specified assistants
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
   * Returns assistants filtered by model UUID
   * @param modelUuid UUID of the model
   * @returns {Assistant[]} Array of assistants
   */
  const getAssistantsByModel = computed(() => {
    return (modelUuid: string) => assistants.value
      .filter(a => a.model_uuid === modelUuid)
  })

  /**
   * Returns the total number of assistants
   * @returns {number} Total count of assistants
   */
  const getAssistantCount = computed(() => assistants.value.length)

  // Actions
  /**
   * Fetches assistants from the database and updates the store.
   * @returns {Promise<void>} Promise that resolves when the assistants are fetched
   * @throws {LMiXError} If the API request fails
   */
  async function selectAssistants(): Promise<void> {
    if (fullyLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data: selectedAssistants, error: selectError } = await client
        .from('assistants')
        .select()
        .order('created_at', { ascending: false })

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError
      )

      assistants.value = selectedAssistants
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
   * Upserts an assistant in the database and updates the store.
   * @param {AssistantInsert} assistant - The assistant to upsert
   * @returns {Promise<string>} Promise that resolves to the UUID of the upserted assistant
   * @throws {LMiXError} If the API request fails
   */
  async function upsertAssistant(assistant: AssistantInsert): Promise<string> {
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

      const { data: upsertedAssistant, error: upsertError } = await client
        .from('assistants')
        .upsert(assistant)
        .select()
        .single()

      if (upsertError) throw new LMiXError(
        upsertError.message,
        'API_ERROR',
        upsertError
      )

      if (!upsertedAssistant) {
        throw new LMiXError(
          'No data returned from assistant upsert',
          'API_ERROR'
        )
      }

      if (isUpdate) {
        const index = assistants.value.findIndex(a => a.uuid === upsertedAssistant.uuid)
        if (index !== -1) {
          assistants.value[index] = upsertedAssistant
        }
      }
      else if (tempId) {
        const tempIndex = assistants.value.findIndex(a => a.uuid === tempId)
        if (tempIndex !== -1) {
          assistants.value[tempIndex] = upsertedAssistant
        }
      }
      return upsertedAssistant.uuid
    }
    catch (e) {
      assistants.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Assistant upsert failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes an assistant from the database and updates the store.
   * @param {string} uuid - The UUID of the assistant to delete
   * @returns {Promise<void>} Promise that resolves when the assistant is deleted
   * @throws {LMiXError} If the API request fails
   */
  async function deleteAssistant(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...assistants.value]
    assistants.value = assistants.value.filter(a => a.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: deleteError } = await client
        .from('assistants')
        .delete()
        .eq('uuid', uuid)

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError
      )
    }
    catch (e) {
      assistants.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Assistant deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Adds assistants to the store without inserting them into the database
   * @param {Assistant[]} newAssistants - The assistants to add
   */
  function addAssistants(newAssistants: (Assistant | AssistantWithRelations)[]) {
    const personaStore = usePersonaStore()

    // Extract and add personas if present
    const personas = newAssistants
      .map(a => (a as AssistantWithRelations).persona)
      .filter((p): p is Persona => p !== null && p !== undefined)

    if (personas.length > 0) {
      personaStore.addPersonas(personas)
    }

    // Add assistants (strip out nested persona data to avoid duplicates)
    const assistantsToAdd = newAssistants
      .filter(newAssistant =>
        !assistants.value.some(a => a.uuid === newAssistant.uuid)
      )
      .map(assistant => {
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
    fullyLoaded,
    // Getters
    getAssistant,
    getAssistantNavigation,
    getAssistantOptions,
    getAssistantsByModel,
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
