/**
 * Store for managing worlds in the application.
 * Handles CRUD operations and state management for worlds.
 */
import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { World, WorldInsert } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useWorldStore = defineStore('world', () => {
  // State
  const worlds = ref<World[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  /**
   * Returns a function to find a world by UUID
   * @returns {(uuid: string) => World | undefined} Function that takes a UUID and returns the matching world or undefined
   */
  const getWorld = computed(() => {
    return (uuid: string) => worlds.value.find(w => w.uuid === uuid)
  })

  /**
   * Returns navigation links for worlds, sorted alphabetically
   * @param filterUuids Optional array of world UUIDs to filter by
   * @param icon Optional icon to use for navigation links
   * @returns Array of navigation links for either all worlds or specified worlds
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
   */
  const getWorldCount = computed(() => worlds.value.length)

  // Actions
  /**
   * Fetches all worlds from the database if not already loaded
   * @throws {LMiXError} If the API request fails
   */
  async function selectWorlds(): Promise<void> {
    if (worlds.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('worlds')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      worlds.value = data
    }
    catch (e) {
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('World selection failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Creates or updates a world
   * @param {WorldInsert} world - The world data to create or update
   * @returns {Promise<string | null>} The UUID of the created/updated world, or null if unsuccessful
   * @throws {LMiXError} If the API request fails
   */
  async function upsertWorld(world: WorldInsert): Promise<string | null> {
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
    } else {
      tempId = crypto.randomUUID()
      worlds.value.unshift({
        ...world,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as World)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('worlds')
        .upsert(world)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data?.[0]) {
        if (isUpdate) {
          const index = worlds.value.findIndex(w => w.uuid === data[0].uuid)
          if (index !== -1) {
            worlds.value[index] = data[0]
          }
        } else if (tempId) {
          const tempIndex = worlds.value.findIndex(w => w.uuid === tempId)
          if (tempIndex !== -1) {
            worlds.value[tempIndex] = data[0]
          }
        }
        return data[0].uuid
      }

      return null
    }
    catch (e) {
      worlds.value = original
      error.value = e as LMiXError
      if (import.meta.dev) {
        console.error('World upsert failed:', e)
      }
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deletes a world by UUID
   * @param {string} uuid - The UUID of the world to delete
   * @throws {LMiXError} If the API request fails
   */
  async function deleteWorld(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...worlds.value]
    worlds.value = worlds.value.filter(w => w.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('worlds')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      worlds.value = original
      error.value = e as LMiXError

      if (import.meta.dev) {
        console.error('World deletion failed:', e)
      }

      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function addWorlds(newWorlds: World[]): Promise<void> {
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