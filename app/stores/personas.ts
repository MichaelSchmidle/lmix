import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type {
  Persona,
  CreatePersonaInput,
  UpdatePersonaInput,
} from '~/types/personas'
import type { ApiResponse } from '../../server/utils/responses'

export const usePersonaStore = defineStore('personas', () => {
  // State - this is the reactive data we'll mutate for optimistic updates
  const personas = ref<Persona[]>([])
  const busy = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)
  
  // Use useFetch at store level with proper SSR handling
  const { data: _fetchedData, pending, refresh } = useFetch<ApiResponse<Persona[]>>('/api/personas', {
    key: 'personas',
    server: false, // Client-only for user-isolated data
    lazy: false, // Fetch immediately when store is accessed
    default: () => ({ success: true, data: [], message: '', count: 0 }),
    onResponse({ response }) {
      // Update our local state when data is fetched
      if (response._data?.data) {
        personas.value = response._data.data
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
  const getPersonaById = computed(
    () => (id: string) => personas.value.find((persona) => persona.id === id)
  )

  const sortedPersonas = computed(() =>
    [...personas.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  const navigationItems = computed(() => (): NavigationMenuItem[] => {
    const localeRoute = useLocalePath()

    return sortedPersonas.value.map((persona: Persona) => ({
      label: persona.name,
      to: localeRoute({
        name: 'personas-id',
        params: { id: persona.id },
      }),
    }))
  })

  // Actions
  async function fetchPersonas() {
    // Just refresh - onResponse callback handles the update
    return await refresh()
  }

  async function createPersona(input: CreatePersonaInput) {
    busy.value = true
    const originalPersonas = [...personas.value]

    try {
      const response = await $fetch('/api/personas', {
        method: 'POST',
        body: input,
      })

      if (response.data) {
        personas.value.push(response.data as Persona)
        return response.data as Persona
      }
      throw new Error('No persona returned')
    } catch (err) {
      personas.value = originalPersonas // Rollback on failure
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create persona'
      )
    } finally {
      busy.value = false
    }
  }

  async function updatePersona(id: string, input: UpdatePersonaInput) {
    busy.value = true
    const index = personas.value.findIndex((p) => p.id === id)
    const originalPersona = index !== -1 ? { ...personas.value[index] } : null

    try {
      // Optimistic update
      if (index !== -1 && originalPersona) {
        personas.value[index] = { ...originalPersona, ...input }
      }

      const response = await $fetch(`/api/personas/${id}`, {
        method: 'PUT',
        body: input,
      })

      if (response.data) {
        if (index !== -1) {
          personas.value[index] = response.data as Persona
        }
        return response.data as Persona
      }
      throw new Error('No persona returned')
    } catch (err) {
      // Rollback on failure
      if (index !== -1 && originalPersona) {
        personas.value[index] = originalPersona
      }
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update persona'
      )
    } finally {
      busy.value = false
    }
  }

  async function deletePersona(id: string) {
    busy.value = true
    const originalPersonas = [...personas.value]

    try {
      // Optimistic delete
      personas.value = personas.value.filter((p) => p.id !== id)
      
      await $fetch(`/api/personas/${id}`, {
        method: 'DELETE',
      })
      
      // Lazy cascade refresh - only if assistant store is already initialized
      // Simple approach: try-catch to avoid premature initialization
      try {
        const assistantStore = useAssistantStore()
        if (assistantStore.isInitialized) {
          await assistantStore.fetchAssistants()
        }
      } catch {
        // Assistant store not initialized yet, skip cascade
      }
    } catch (err) {
      personas.value = originalPersonas // Rollback on failure
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete persona'
      )
    } finally {
      busy.value = false
    }
  }

  return {
    // State
    personas,
    loading,
    busy,
    error,
    isInitialized,

    // Getters
    getPersonaById,
    sortedPersonas,
    navigationItems,

    // Actions
    fetchPersonas,
    createPersona,
    updatePersona,
    deletePersona,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePersonaStore, import.meta.hot))
}
