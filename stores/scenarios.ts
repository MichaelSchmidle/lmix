import { defineStore } from 'pinia'
import type { Database } from '~/types/api'
import type { Scenario, ScenarioInsert } from '~/types/app'
import { LMiXError } from '~/types/errors'
import type { VerticalNavigationLink } from '#ui/types'

export const useScenarioStore = defineStore('scenario', () => {
  // State
  const scenarios = ref<Scenario[]>([])
  const loading = ref(false)
  const error = ref<LMiXError | null>(null)

  // Getters
  const getScenario = computed(() => {
    return (uuid: string) => scenarios.value.find(s => s.uuid === uuid)
  })

  const getScenarioNavigation = computed(() => {
    return scenarios.value
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((scenario): VerticalNavigationLink => ({
        label: scenario.name,
        to: `/scenarios/${scenario.uuid}`,
      }))
  })

  const getScenarioCount = computed(() => scenarios.value.length)

  // Actions
  async function selectScenarios(): Promise<void> {
    if (scenarios.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('scenarios')
        .select()
        .order('created_at', { ascending: false })

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      scenarios.value = data
    }
    catch (e) {
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Scenario selection failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function upsertScenario(scenario: ScenarioInsert): Promise<string | null> {
    loading.value = true
    error.value = null

    const isUpdate = !!scenario.uuid
    const original = [...scenarios.value]

    if (isUpdate) {
      const index = scenarios.value.findIndex(s => s.uuid === scenario.uuid)
      if (index !== -1) {
        scenarios.value[index] = { ...scenarios.value[index], ...scenario }
      }
    }
    else {
      const tempId = crypto.randomUUID()
      scenarios.value.unshift({
        ...scenario,
        uuid: tempId,
        created_at: new Date().toISOString(),
      } as Scenario)
    }

    try {
      const client = useSupabaseClient<Database>()

      const { data, error: apiError } = await client
        .from('scenarios')
        .upsert(scenario)
        .select()

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )

      if (data?.[0]) {
        if (isUpdate) {
          const index = scenarios.value.findIndex(s => s.uuid === data[0].uuid)
          if (index !== -1) {
            scenarios.value[index] = data[0]
          }
        }
        else {
          scenarios.value[0] = data[0]
        }
        return data[0].uuid
      }

      return null
    }
    catch (e) {
      scenarios.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Scenario upsert failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function deleteScenario(uuid: string): Promise<void> {
    loading.value = true
    error.value = null

    const original = [...scenarios.value]
    scenarios.value = scenarios.value.filter(s => s.uuid !== uuid)

    try {
      const client = useSupabaseClient<Database>()

      const { error: apiError } = await client
        .from('scenarios')
        .delete()
        .eq('uuid', uuid)

      if (apiError) throw new LMiXError(
        apiError.message,
        'API_ERROR',
        apiError
      )
    }
    catch (e) {
      scenarios.value = original
      error.value = e as LMiXError
      if (import.meta.dev) console.error('Scenario deletion failed:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  return {
    scenarios,
    loading,
    error,
    getScenario,
    getScenarioNavigation,
    getScenarioCount,
    selectScenarios,
    upsertScenario,
    deleteScenario,
  }
}) 