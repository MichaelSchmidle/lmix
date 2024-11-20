/**
 * Store for managing personas in the application.
 * Handles CRUD operations and state management for personas.
 */
import { defineStore } from 'pinia'
import type { VerticalNavigationLink } from '#ui/types'
import type { Database } from '~/types/api'
import type { Persona, PersonaInsert } from '~/types/app'
import { LMiXError } from '~/types/errors'

export const usePersonaStore = defineStore('persona', () => {
  // State
  const personas = ref<Persona[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a persona by UUID
   * @returns {(uuid: string) => Persona | undefined} Function that takes a UUID and returns the matching persona or undefined
   */
  const getPersona = computed(() => {
    return (uuid: string): Persona | undefined => personas.value.find(p => p.uuid === uuid)
  })

  /**
   * Returns navigation links for personas, sorted alphabetically
   * @param filterUuids Optional array of persona UUIDs to filter by
   * @param icon Optional icon to use for navigation links
   * @returns Array of navigation links for either all personas or specified personas
   */
  const getPersonaNavigation = computed(() => {
    return (filterUuids?: string[], icon?: string): VerticalNavigationLink[] => {
      if (filterUuids?.length === 0) return []

      const personaList = filterUuids
        ? personas.value.filter(p => filterUuids.includes(p.uuid))
        : personas.value

      return personaList
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((persona): VerticalNavigationLink => ({
          label: persona.name,
          to: `/personas/${persona.uuid}`,
          ...(icon && { icon }),
        }))
    }
  })

  /**
   * Returns select options for personas, sorted alphabetically
   * @param filterUuids Optional array of persona UUIDs to filter by
   * @returns Array of select options for either all personas or specified personas
   */
  const getPersonaOptions = computed(() => {
    return (filterUuids?: string[]) => {
      if (filterUuids?.length === 0) return []

      const personaList = filterUuids
        ? personas.value.filter(p => filterUuids.includes(p.uuid))
        : personas.value

      return personaList
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(persona => ({
          label: persona.name,
          value: persona.uuid,
        }))
    }
  })

  /**
   * Returns the total number of personas
   */
  const getPersonaCount = computed(() => personas.value.length)

  // Actions
  /**
   * Fetches all personas from the database if not already loaded
   * @throws {LMiXError} If the API request fails
   */
  async function selectPersonas(): Promise<void> {
    if (personas.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('personas')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      personas.value = data
    }
    catch (e) {
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Persona selection failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates or updates a persona
   * @param {PersonaInsert} persona - The persona data to create or update
   * @returns {Promise<string | null>} The UUID of the created/updated persona, or null if unsuccessful
   * @throws {LMiXError} If the API request fails
   */
  async function upsertPersona(persona: PersonaInsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!persona.uuid
    const original = [...personas.value]
    let tempId: string | null = null

    if (isUpdate) {
      const index = personas.value.findIndex(p => p.uuid === persona.uuid)
      if (index !== -1) {
        personas.value[index] = { ...personas.value[index], ...persona }
      }
    } else {
      tempId = crypto.randomUUID()
      personas.value.unshift({
        ...persona,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as Persona)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('personas')
        .upsert(persona)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data?.[0]) {
        if (isUpdate) {
          const index = personas.value.findIndex(p => p.uuid === data[0].uuid)
          if (index !== -1) {
            personas.value[index] = data[0]
          }
        } else if (tempId) {
          const tempIndex = personas.value.findIndex(p => p.uuid === tempId)
          if (tempIndex !== -1) {
            personas.value[tempIndex] = data[0]
          }
        }
        return data[0].uuid
      }

      return null
    }
    catch (e) {
      personas.value = original
      error.value = e as LMiXError
      if (import.meta.dev) {
        console.error('Persona upsert failed:', e)
      }
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a persona by UUID
   * @param {string} uuid - The UUID of the persona to delete
   * @throws {LMiXError} If the API request fails
   */
  async function deletePersona(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...personas.value]
    personas.value = personas.value.filter(p => p.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('personas')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      personas.value = original
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('Persona deletion failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function addPersonas(newPersonas: Persona[]): Promise<void> {
    const personasToAdd = newPersonas.filter(newPersona =>
      !personas.value.some(p => p.uuid === newPersona.uuid)
    )
    if (personasToAdd.length > 0) {
      personas.value = [...personas.value, ...personasToAdd]
    }
  }

  return {
    // State
    personas,
    loading,
    error,
    // Getters
    getPersona,
    getPersonaNavigation,
    getPersonaOptions,
    getPersonaCount,
    // Actions
    selectPersonas,
    upsertPersona,
    deletePersona,
    addPersonas,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePersonaStore, import.meta.hot))
}
