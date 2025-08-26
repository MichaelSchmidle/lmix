import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type {
  Assistant,
  CreateAssistantInput,
  UpdateAssistantInput,
} from '~/types/assistants'
import type { ApiResponse } from '~/server/utils/responses'

export const useAssistantStore = defineStore('assistants', () => {
  // State - this is the reactive data we'll mutate for optimistic updates
  const assistants = ref<Assistant[]>([])
  const busy = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)
  
  // Use useFetch at store level with proper SSR handling
  const { data: fetchedData, pending, refresh } = useFetch<ApiResponse<Assistant[]>>('/api/assistants', {
    key: 'assistants',
    server: false, // Client-only for user-isolated data
    lazy: false, // Fetch immediately when store is accessed
    default: () => ({ success: true, data: [], message: '', count: 0 }),
    onResponse({ response }) {
      // Update our local state when data is fetched
      if (response._data?.data) {
        assistants.value = response._data.data
        isInitialized.value = true
      }
    }
  })
  
  // Loading state: true on server, follows pending on client, or if not initialized
  const loading = computed(() => {
    if (process.server) return true // Always show skeleton on SSR
    return pending.value || !isInitialized.value // Show loading until data is ready
  })

  // Getters
  const getAssistantById = computed(
    () => (id: string) =>
      assistants.value.find((assistant) => assistant.id === id)
  )

  const sortedAssistants = computed(() =>
    [...assistants.value].sort((a, b) => {
      // Sort by display name (custom name or persona name)
      const nameA = a.name || a.persona?.name || ''
      const nameB = b.name || b.persona?.name || ''
      return nameA.localeCompare(nameB)
    })
  )

  const navigationItems = computed(() => (): NavigationMenuItem[] => {
    const localeRoute = useLocalePath()

    return sortedAssistants.value.map((assistant: Assistant) => {
      const displayName =
        assistant.name ||
        `${assistant.persona?.name || 'Unknown'}@${
          assistant.model?.name || 'Unknown'
        }`

      return {
        label: displayName,
        to: localeRoute({
          name: 'assistants-id',
          params: { id: assistant.id },
        }),
      }
    })
  })

  // Actions
  async function fetchAssistants() {
    // Refresh from server and update local state
    const result = await refresh()
    if (result?.data.value?.data) {
      assistants.value = result.data.value.data
    }
    return result
  }

  async function createAssistant(input: CreateAssistantInput) {
    busy.value = true

    try {
      const response = await $fetch('/api/assistants', {
        method: 'POST',
        body: input,
      })

      if (response.data) {
        assistants.value.push(response.data as Assistant)
        return response.data as Assistant
      }
      throw new Error('No assistant returned')
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create assistant'
      )
    } finally {
      busy.value = false
    }
  }

  async function updateAssistant(id: string, input: UpdateAssistantInput) {
    busy.value = true

    try {
      const response = await $fetch(`/api/assistants/${id}`, {
        method: 'PUT',
        body: input,
      })

      if (response.data) {
        const index = assistants.value.findIndex((a) => a.id === id)
        if (index !== -1) {
          assistants.value[index] = response.data as Assistant
        }
        return response.data as Assistant
      }
      throw new Error('No assistant returned')
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update assistant'
      )
    } finally {
      busy.value = false
    }
  }

  async function deleteAssistant(id: string) {
    busy.value = true

    try {
      await $fetch(`/api/assistants/${id}`, {
        method: 'DELETE',
      })

      assistants.value = assistants.value.filter((a) => a.id !== id)
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete assistant'
      )
    } finally {
      busy.value = false
    }
  }

  return {
    // State
    assistants,
    loading,
    busy,
    error,

    // Getters
    getAssistantById,
    sortedAssistants,
    navigationItems,

    // Actions
    fetchAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssistantStore, import.meta.hot))
}
