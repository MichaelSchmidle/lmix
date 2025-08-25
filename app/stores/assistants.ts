import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type {
  Assistant,
  CreateAssistantInput,
  UpdateAssistantInput,
} from '~/types/assistants'

export const useAssistantStore = defineStore('assistants', () => {
  // State
  const assistants = ref<Assistant[]>([])
  const loading = ref(true) // Initial loading state only (shows skeletons)
  const busy = ref(false) // Any operation in progress (disables buttons)
  const error = ref<string | null>(null)
  const initialized = ref(false) // Track if we've fetched at least once

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
    // Only set loading if already initialized (subsequent fetches)
    if (initialized.value) {
      loading.value = true
    }
    error.value = null

    try {
      const response = await $fetch('/api/assistants')
      assistants.value = response.data || []
      initialized.value = true
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch assistants'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createAssistant(input: CreateAssistantInput) {
    busy.value = true
    error.value = null

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
      error.value =
        err instanceof Error ? err.message : 'Failed to create assistant'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function updateAssistant(id: string, input: UpdateAssistantInput) {
    busy.value = true
    error.value = null

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
      error.value =
        err instanceof Error ? err.message : 'Failed to update assistant'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function deleteAssistant(id: string) {
    busy.value = true
    error.value = null

    try {
      await $fetch(`/api/assistants/${id}`, {
        method: 'DELETE',
      })

      assistants.value = assistants.value.filter((a) => a.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete assistant'
      throw err
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
