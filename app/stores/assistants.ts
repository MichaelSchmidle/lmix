import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type {
  Assistant,
  CreateAssistantInput,
  UpdateAssistantInput,
} from '~/types/assistants'

export const useAssistantStore = defineStore('assistants', () => {
  // State
  const assistantsList = ref<Assistant[]>([])
  const loading = ref(true) // Initial loading state only (shows skeletons)
  const busy = ref(false) // Any operation in progress (disables buttons)
  const error = ref<string | null>(null)
  const initialized = ref(false) // Track if we've fetched at least once

  // Getters
  const getAssistantById = computed(
    () => (id: string) =>
      assistantsList.value.find((assistant) => assistant.id === id)
  )

  const sortedAssistants = computed(() =>
    [...assistantsList.value].sort((a, b) => {
      // Sort by display name (custom name or persona name)
      const nameA = a.name || a.persona?.name || ''
      const nameB = b.name || b.persona?.name || ''
      return nameA.localeCompare(nameB)
    })
  )

  const navigationItems = computed(() => (): NavigationMenuItem[] => {
    const localeRoute = useLocalePath()

    return [
      {
        icon: 'i-ph-robot-fill',
        label: 'Assistants',
        defaultOpen: true,
        children: sortedAssistants.value.map((assistant: Assistant) => {
          const displayName = assistant.name || 
            `${assistant.persona?.name || 'Unknown'} (${assistant.model?.name || 'Unknown'})`
          
          return {
            label: displayName,
            to: localeRoute({
              name: 'assistants-id',
              params: { id: assistant.id },
            }),
          }
        }),
      },
    ]
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
      assistantsList.value = response.assistants
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
      const response = await $fetch<{ assistant: Assistant }>('/api/assistants', {
        method: 'POST',
        body: input,
      })

      assistantsList.value.push(response.assistant)
      return response.assistant
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
      const response = await $fetch<{ assistant: Assistant }>(
        `/api/assistants/${id}`,
        {
          method: 'PUT',
          body: input,
        }
      )

      const index = assistantsList.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        assistantsList.value[index] = response.assistant
      }

      return response.assistant
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

      assistantsList.value = assistantsList.value.filter((a) => a.id !== id)
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
    assistantsList,
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