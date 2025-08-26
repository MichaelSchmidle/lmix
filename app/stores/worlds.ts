import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type {
  World,
  CreateWorldInput,
  UpdateWorldInput,
} from '~/types/worlds'
import type { ApiResponse } from '../../server/utils/responses'

export const useWorldStore = defineStore('worlds', () => {
  // State - this is the reactive data we'll mutate for optimistic updates
  const worlds = ref<World[]>([])
  const busy = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)
  
  // Use useFetch at store level with proper SSR handling
  const { data: _fetchedData, pending, refresh } = useFetch<ApiResponse<World[]>>('/api/worlds', {
    key: 'worlds',
    server: false, // Client-only for user-isolated data
    lazy: false, // Fetch immediately when store is accessed
    default: () => ({ success: true, data: [], message: '', count: 0 }),
    onResponse({ response }) {
      // Update our local state when data is fetched
      if (response._data?.data) {
        worlds.value = response._data.data
        isInitialized.value = true
      }
    }
  })
  
  // Loading state: true on server, follows pending on client, or if not initialized
  const loading = computed(() => {
    if (import.meta.server) return true // Always show skeleton on SSR
    return pending.value || !isInitialized.value // Show loading until data is ready
  })

  // Getters
  const getWorldById = computed(
    () => (id: string) => worlds.value.find((world) => world.id === id)
  )

  const sortedWorlds = computed(() =>
    [...worlds.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  const navigationItems = computed(() => (): NavigationMenuItem[] => {
    const localeRoute = useLocalePath()

    return sortedWorlds.value.map((world: World) => ({
      label: world.name,
      to: localeRoute({
        name: 'worlds-id',
        params: { id: world.id },
      }),
    }))
  })

  // Actions
  async function fetchWorlds() {
    // Just refresh - onResponse callback handles the update
    return await refresh()
  }

  async function createWorld(input: CreateWorldInput) {
    busy.value = true
    const originalWorlds = [...worlds.value]

    try {
      const response = await $fetch('/api/worlds', {
        method: 'POST',
        body: input,
      })

      if (response.data) {
        worlds.value.push(response.data as World)
        return response.data as World
      }
      throw new Error('No world returned')
    } catch (err) {
      worlds.value = originalWorlds // Rollback on failure
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create world'
      )
    } finally {
      busy.value = false
    }
  }

  async function updateWorld(id: string, input: UpdateWorldInput) {
    busy.value = true
    const index = worlds.value.findIndex((w) => w.id === id)
    const originalWorld = index !== -1 ? { ...worlds.value[index] } : null

    try {
      // Optimistic update
      if (index !== -1 && originalWorld) {
        worlds.value[index] = { ...originalWorld, ...input }
      }

      const response = await $fetch(`/api/worlds/${id}`, {
        method: 'PUT',
        body: input,
      })

      if (response.data) {
        if (index !== -1) {
          worlds.value[index] = response.data as World
        }
        return response.data as World
      }
      throw new Error('No world returned')
    } catch (err) {
      // Rollback on failure
      if (index !== -1 && originalWorld) {
        worlds.value[index] = originalWorld
      }
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update world'
      )
    } finally {
      busy.value = false
    }
  }

  async function deleteWorld(id: string) {
    busy.value = true
    const originalWorlds = [...worlds.value]

    try {
      // Optimistic delete
      worlds.value = worlds.value.filter((w) => w.id !== id)
      
      await $fetch(`/api/worlds/${id}`, {
        method: 'DELETE',
      })
    } catch (err) {
      worlds.value = originalWorlds // Rollback on failure
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete world'
      )
    } finally {
      busy.value = false
    }
  }

  return {
    // State
    worlds,
    loading,
    busy,
    error,
    isInitialized,

    // Getters
    getWorldById,
    sortedWorlds,
    navigationItems,

    // Actions
    fetchWorlds,
    createWorld,
    updateWorld,
    deleteWorld,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorldStore, import.meta.hot))
}