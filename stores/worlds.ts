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
  const getWorld = computed(() => {
    return (uuid: string) => worlds.value.find(w => w.uuid === uuid)
  })

  const getWorldNavigation = computed(() => {
    return worlds.value
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((world): VerticalNavigationLink => ({
        label: world.name,
        to: `/worlds/${world.uuid}`,
      }))
  })

  const getWorldCount = computed(() => worlds.value.length)

  // Actions
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

  async function upsertWorld(world: WorldInsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!world.uuid
    const original = [...worlds.value]

    if (isUpdate) {
      const index = worlds.value.findIndex(w => w.uuid === world.uuid)

      if (index !== -1) {
        worlds.value[index] = { ...worlds.value[index], ...world }
      }
    }
    else {
      const tempId = crypto.randomUUID()

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
        }
        else {
          worlds.value[0] = data[0]
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

  return {
    // State
    worlds,
    loading,
    error,
    // Getters
    getWorld,
    getWorldNavigation,
    getWorldCount,
    // Actions
    selectWorlds,
    upsertWorld,
    deleteWorld,
  }
}) 