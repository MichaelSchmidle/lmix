import { defineStore, acceptHMRUpdate } from 'pinia'
import type { NavigationMenuItem } from '@nuxt/ui'
import type {
  Persona,
  CreatePersonaInput,
  UpdatePersonaInput,
} from '~/types/personas'

export const usePersonaStore = defineStore('personas', () => {
  // State
  const personas = ref<Persona[]>([])
  const loading = ref(true) // Initial loading state only (shows skeletons)
  const busy = ref(false) // Any operation in progress (disables buttons)
  const error = ref<string | null>(null)
  const initialized = ref(false) // Track if we've fetched at least once

  // Getters
  const getPersonaById = computed(
    () => (id: string) => personas.value.find((persona) => persona.id === id)
  )

  const sortedPersonas = computed(() =>
    [...personas.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  const navigationItems = computed(() => (): NavigationMenuItem[] => {
    const localeRoute = useLocalePath()

    return [
      sortedPersonas.value.map((persona: Persona) => ({
        label: persona.name,
        to: localeRoute({
          name: 'personas-id',
          params: { id: persona.id },
        }),
      })),
    ]
  })

  // Actions
  async function fetchPersonas() {
    // Only set loading if already initialized (subsequent fetches)
    if (initialized.value) {
      loading.value = true
    }
    error.value = null

    try {
      const response = await $fetch('/api/personas')
      personas.value = response.personas
      initialized.value = true
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch personas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createPersona(input: CreatePersonaInput) {
    busy.value = true
    error.value = null

    try {
      const response = await $fetch<{ persona: Persona }>('/api/personas', {
        method: 'POST',
        body: input,
      })

      personas.value.push(response.persona)
      return response.persona
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create persona'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function updatePersona(id: string, input: UpdatePersonaInput) {
    busy.value = true
    error.value = null

    try {
      const response = await $fetch<{ persona: Persona }>(
        `/api/personas/${id}`,
        {
          method: 'PUT',
          body: input,
        }
      )

      const index = personas.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        personas.value[index] = response.persona
      }

      return response.persona
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update persona'
      throw err
    } finally {
      busy.value = false
    }
  }

  async function deletePersona(id: string) {
    busy.value = true
    error.value = null

    try {
      await $fetch(`/api/personas/${id}`, {
        method: 'DELETE',
      })

      personas.value = personas.value.filter((p) => p.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete persona'
      throw err
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
