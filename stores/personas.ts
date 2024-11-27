/**
 * Store for managing personas in the application.
 * Handles CRUD operations and state management for personas.
 * 
 * @remarks
 * Personas represent the main characters in the application.
 */
import { defineStore } from 'pinia'
import type { VerticalNavigationLink } from '#ui/types'
import type { Database } from '~/types/api'
import type { Persona, PersonaInsert } from '~/types/app'
import { LMiXError } from '~/types/errors'

export const usePersonaStore = defineStore('persona', () => {
  // State
  const personas = ref<Persona[]>([])
  const fullyLoaded = ref(false)
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a persona by UUID
   * @param {string} uuid - UUID of the persona
   * @returns {Persona | undefined} The persona if found, undefined otherwise
   */
  const getPersona = computed(() => {
    return (uuid: string): Persona | undefined => personas.value.find(p => p.uuid === uuid)
  })

  /**
   * Returns navigation links for personas, sorted alphabetically
   * @param {string[]} filterUuids Optional array of persona UUIDs to filter by
   * @param {string} icon Optional icon to use for navigation links
   * @returns {VerticalNavigationLink[]} Array of navigation links for either all personas or specified personas
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
   * @param {string[]} filterUuids Optional array of persona UUIDs to filter by
   * @returns {Array<{ label: string; value: string }>} Array of select options for either all personas or specified personas
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
   * @returns {number} Total count of personas
   */
  const getPersonaCount = computed(() => personas.value.length)

  // Actions
  /**
   * Fetches all personas from the database if not already loaded
   * @returns {Promise<void>} Promise that resolves when the personas are fetched
   * @throws {LMiXError} If the API request fails
   */
  async function selectPersonas(): Promise<void> {
    if (fullyLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data: selectedPersonas, error: selectError } = await client
        .from('personas')
        .select()
        .order('inserted_at', { ascending: false })

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError
      )

      personas.value = selectedPersonas
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Persona selection failed:', e)
      throw e
    }
    finally {
      loading.value = false
      fullyLoaded.value = true
    }
  }

  /**
   * Creates or updates a persona
   * @param {PersonaInsert} persona - The persona data to create or update
   * @returns {Promise<string>} The UUID of the created/updated persona
   * @throws {LMiXError} If the API request fails or no data is returned
   */
  async function upsertPersona(persona: PersonaInsert): Promise<string> {
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
    }
    else {
      tempId = crypto.randomUUID()
      personas.value.unshift({
        ...persona,
        uuid: tempId,
        inserted_at: new Date().toISOString(),
      } as Persona)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data: upsertedPersona, error: upsertError } = await client
        .from('personas')
        .upsert(persona)
        .select()
        .single()

      if (upsertError) throw new LMiXError(
        upsertError.message,
        'API_ERROR',
        upsertError
      )

      if (!upsertedPersona) {
        throw new LMiXError(
          'No data returned from persona upsert',
          'API_ERROR',
        )
      }

      if (isUpdate) {
        const index = personas.value.findIndex(p => p.uuid === upsertedPersona.uuid)
        if (index !== -1) {
          personas.value[index] = upsertedPersona
        }
      }
      else if (tempId) {
        const tempIndex = personas.value.findIndex(p => p.uuid === tempId)
        if (tempIndex !== -1) {
          personas.value[tempIndex] = upsertedPersona
        }
      }

      return upsertedPersona.uuid
    }
    catch (e) {
      personas.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Persona upsert failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a persona by UUID
   * @param {string} uuid - The UUID of the persona to delete
   * @returns {Promise<void>} Promise that resolves when the persona is deleted
   * @throws {LMiXError} If the API request fails
   */
  async function deletePersona(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...personas.value]
    personas.value = personas.value.filter(p => p.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: deleteError } = await client
        .from('personas')
        .delete()
        .eq('uuid', uuid)

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError
      )
    }
    catch (e) {
      personas.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Persona deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Adds personas to the store without inserting them into the database
   * @param newPersonas The personas to add
   */
  function addPersonas(newPersonas: Persona[]) {
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
