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
          avatar: persona.avatar_url ? {
            alt: persona.name,
            src: persona.avatar_url,
          } : undefined,
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
    const personaToDelete = personas.value.find(p => p.uuid === uuid)

    try {
      // Delete avatar first if it exists
      if (personaToDelete?.avatar_url) {
        await deleteAvatar(uuid)
      }

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

      personas.value = personas.value.filter(p => p.uuid !== uuid)
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

  /**
   * Uploads an avatar image for a persona
   * @param {string} personaUuid - UUID of the persona
   * @param {File} file - The image file to upload
   * @returns {Promise<string>} The signed URL of the uploaded avatar
   * @throws {LMiXError} If the upload fails
   */
  async function uploadAvatar(personaUuid: string, file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new LMiXError('Invalid file type', 'VALIDATION_ERROR')
    }
    if (file.size > 6 * 1024 * 1024) {
      throw new LMiXError('File too large', 'VALIDATION_ERROR')
    }

    const client = useSupabaseClient()
    const userUuid = useSupabaseUser().value?.id

    if (!userUuid) {
      throw new LMiXError('User not authenticated', 'AUTH_ERROR')
    }

    const filePath = `${userUuid}/${personaUuid}`
    const { error: uploadError } = await client.storage
      .from('persona_avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      throw new LMiXError(uploadError.message, 'API_ERROR', uploadError)
    }

    // Get signed URL instead of public URL
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from('persona_avatars')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year expiry

    if (signedUrlError || !signedUrlData) {
      throw new LMiXError(
        signedUrlError?.message || 'Failed to get signed URL',
        'API_ERROR',
        signedUrlError
      )
    }

    // Add timestamp to URL to bust cache
    const url = new URL(signedUrlData.signedUrl)
    url.searchParams.set('v', Date.now().toString())

    // Update persona with new avatar URL
    const persona = personas.value.find(p => p.uuid === personaUuid)
    if (persona) {
      await upsertPersona({
        ...persona,
        avatar_url: url.toString(),
      })
    }

    return url.toString()
  }

  /**
   * Deletes the avatar for a persona
   * @param {string} personaUuid - UUID of the persona
   * @throws {LMiXError} If the deletion fails
   */
  async function deleteAvatar(personaUuid: string): Promise<void> {
    const client = useSupabaseClient()
    const userUuid = useSupabaseUser().value?.id

    if (!userUuid) {
      throw new LMiXError('User not authenticated', 'AUTH_ERROR')
    }

    const filePath = `${userUuid}/${personaUuid}`
    const { error: deleteError } = await client.storage
      .from('persona_avatars')
      .remove([filePath])

    if (deleteError) {
      throw new LMiXError(deleteError.message, 'API_ERROR', deleteError)
    }

    // Update persona to remove avatar URL
    const persona = personas.value.find(p => p.uuid === personaUuid)
    if (persona) {
      await upsertPersona({
        ...persona,
        avatar_url: null,
      })
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
    uploadAvatar,
    deleteAvatar,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePersonaStore, import.meta.hot))
}
