/**
 * Store for managing worlds in the application.
 * Handles CRUD operations and state management for worlds.
 * 
 * @remarks
 * Worlds represent the global conditions in the application.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { World, WorldInsert } from '~/types/app'
import { LMiXError, ApiError, ValidationError, AuthenticationError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useWorldStore = defineStore('world', () => {
  // State
  const worlds = ref<World[]>([])
  const fullyLoaded = ref(false)
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a world by UUIDs
   * @param {string} uuid - UUID of the world
   * @returns {World | undefined} The world if found, undefined otherwise
   */
  const getWorld = computed(() => {
    return (uuid: string) => worlds.value.find(w => w.uuid === uuid)
  })

  /**
   * Returns navigation links for worlds, sorted alphabetically
   * @param {string[]} filterUuids Optional array of world UUIDs to filter by
   * @param {string} icon Optional icon to use for navigation links
   * @returns {VerticalNavigationLink[]} Array of navigation links for either all worlds or specified worlds
   */
  const getWorldNavigation = computed(() => {
    return (filterUuids?: string[], icon?: string): VerticalNavigationLink[] => {
      if (filterUuids?.length === 0) return []

      const worldList = filterUuids
        ? worlds.value.filter(w => filterUuids.includes(w.uuid))
        : worlds.value

      return worldList
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((world): VerticalNavigationLink => ({
          label: world.name,
          to: `/worlds/${world.uuid}`,
          ...(icon && { icon }),
        }))
    }
  })

  /**
   * Returns select options for all worlds, sorted alphabetically
   * @returns {Array<{ label: string; value: string }>} Array of select options
   */
  const getWorldOptions = computed(() => [
    ...worlds.value
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(world => ({
        label: world.name,
        value: world.uuid,
      })),
  ])

  /**
   * Returns the total number of worlds
   * @returns {number} Total count of worlds
   */
  const getWorldCount = computed(() => worlds.value.length)

  // Actions
  /**
   * Fetches all worlds from the database if not already loaded
   * @returns {Promise<void>} Promise that resolves when the worlds are fetched
   * @throws {LMiXError} If the API request fails
   */
  async function selectWorlds(): Promise<void> {
    if (fullyLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data: selectedWorlds, error: selectError } = await client
        .from('worlds')
        .select()
        .order('inserted_at', { ascending: false })

      if (selectError) throw new LMiXError(
        selectError.message,
        'API_ERROR',
        selectError
      )

      worlds.value = selectedWorlds
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('World selection failed:', e)
      throw e
    }
    finally {
      loading.value = false
      fullyLoaded.value = true
    }
  }

  /**
   * Creates or updates a world
   * @param {WorldInsert} world - The world data to create or update
   * @returns {Promise<string>} The UUID of the created/updated world
   * @throws {LMiXError} If the API request fails
   */
  async function upsertWorld(world: WorldInsert): Promise<string> {
    loading.value = true
    error.value = null

    const isUpdate = !!world.uuid
    const original = [...worlds.value]
    let tempId: string | null = null

    if (isUpdate) {
      const index = worlds.value.findIndex(w => w.uuid === world.uuid)
      if (index !== -1) {
        worlds.value[index] = { ...worlds.value[index], ...world }
      }
    }
    else {
      tempId = crypto.randomUUID()
      worlds.value.unshift({
        ...world,
        uuid: tempId,
        inserted_at: new Date().toISOString(),
      } as World)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data: upsertedWorld, error: upsertError } = await client
        .from('worlds')
        .upsert(world)
        .select()
        .single()

      if (upsertError) {
        // Convert Supabase errors to appropriate LMiX error types
        if (upsertError.code === '42501') {
          throw new AuthenticationError(
            'Not authorized to upsert world',
            upsertError
          )
        }
        if (upsertError.code === '23502') {
          throw new ValidationError(
            'Missing required fields for world',
            upsertError
          )
        }
        throw new ApiError(
          upsertError.message,
          upsertError
        )
      }

      if (!upsertedWorld) {
        throw new ApiError(
          'No world data returned from API'
        )
      }

      if (isUpdate) {
        const index = worlds.value.findIndex(w => w.uuid === upsertedWorld.uuid)
        if (index !== -1) {
          worlds.value[index] = upsertedWorld
        }
      }
      else if (tempId) {
        const tempIndex = worlds.value.findIndex(w => w.uuid === tempId)
        if (tempIndex !== -1) {
          worlds.value[tempIndex] = upsertedWorld
        }
      }

      return upsertedWorld.uuid
    }
    catch (e) {
      // Rollback optimistic update
      worlds.value = original

      // Set error state for UI feedback
      error.value = e as LMiXError

      // Log in development only
      if (import.meta.dev) {
        console.error('World upsert failed:', e)
      }

      // Re-throw for UI handling
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a world by UUID
   * @param {string} uuid - The UUID of the world to delete
   * @returns {Promise<void>} Promise that resolves when the world is deleted
   * @throws {LMiXError} If the API request fails
   */
  async function deleteWorld(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...worlds.value]
    worlds.value = worlds.value.filter(w => w.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: deleteError } = await client
        .from('worlds')
        .delete()
        .eq('uuid', uuid)

      if (deleteError) throw new LMiXError(
        deleteError.message,
        'API_ERROR',
        deleteError,
      )
    }
    catch (e) {
      worlds.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('World deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Adds worlds to the store without inserting them into the database
   * @param newWorlds - The worlds to add
   */
  function addWorlds(newWorlds: World[]) {
    const worldsToAdd = newWorlds.filter(newWorld =>
      !worlds.value.some(w => w.uuid === newWorld.uuid)
    )
    if (worldsToAdd.length > 0) {
      worlds.value.push(...worldsToAdd)
    }
  }

  return {
    // State
    worlds,
    loading,
    error,
    // Getters
    getWorld,
    getWorldNavigation,
    getWorldOptions,
    getWorldCount,
    // Actions
    selectWorlds,
    upsertWorld,
    deleteWorld,
    addWorlds,
  }
})

// Add HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorldStore, import.meta.hot))
}