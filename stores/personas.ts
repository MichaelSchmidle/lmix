import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Persona } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

type PersonaRow = Database['public']['Tables']['personas']['Row']
type PersonaUpsert = Database['public']['Tables']['personas']['Insert']

export const usePersonaStore = defineStore('persona', () => {
  // State
  const personas = ref<PersonaRow[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  const getPersona = computed(() => {
    return (uuid: string) => personas.value.find(p => p.uuid === uuid)
  })

  const getPersonaNavigation = computed(() => {
    return personas.value
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((persona): VerticalNavigationLink => ({
        label: persona.name,
        to: `/personas/${persona.uuid}`,
      }))
  })

  // Actions
  async function selectPersonas(): Promise<void> {
    if (personas.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()
      const { data, error: apiError } = await client
        .from('personas')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      personas.value = data
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) {
        console.error('Persona selection failed:', e)
      }
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function upsertPersona(persona: PersonaUpsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!persona.uuid
    const original = [...personas.value]

    if (isUpdate) {
      const index = personas.value.findIndex(p => p.uuid === persona.uuid)
      if (index !== -1) {
        personas.value[index] = { ...personas.value[index], ...persona }
      }
    } else {
      const tempId = crypto.randomUUID()
      personas.value.unshift({
        ...persona,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as PersonaRow)
    }

    try {
      const client = useSupabaseClient<Database>()
      const { data, error: apiError } = await client
        .from('personas')
        .upsert(persona)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data?.[0]) {
        if (isUpdate) {
          const index = personas.value.findIndex(p => p.uuid === data[0].uuid)
          if (index !== -1) {
            personas.value[index] = data[0]
          }
        }
        else {
          personas.value[0] = data[0]
        }
        return data[0].uuid
      }
      return null
    }
    catch (e) {
      personas.value = original
      error.value = e as LMiXError
      if (import.meta.dev) {
        console.error('Persona upsert failed:', e)
      }
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function deletePersona(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...personas.value]
    personas.value = personas.value.filter(p => p.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()
      const { error: apiError } = await client
        .from('personas')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      personas.value = original
      error.value = e as LMiXError
      if (import.meta.dev) {
        console.error('Persona deletion failed:', e)
      }
      throw e
    }
    finally {
      loading.value = false
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
    // Actions
    selectPersonas,
    upsertPersona,
    deletePersona,
  }
})
